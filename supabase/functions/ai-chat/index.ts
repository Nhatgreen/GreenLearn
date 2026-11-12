import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser, getServiceRoleClient } from '../_shared/auth.ts';

const OPENAI_OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OPENAI_OAUTH_REDIRECT_URI = 'http://localhost:1455/auth/callback';
const OPENAI_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const CODEX_RESPONSES_URL = 'https://chatgpt.com/backend-api/codex/responses';

function extractAccountIdFromJwt(jwt: string): string | undefined {
  try {
    const parts = jwt.trim().split('.');
    if (parts.length !== 3) return undefined;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    const authClaim = payload?.['https://api.openai.com/auth'] || {};
    return (
      authClaim.chatgpt_account_id ||
      payload.chatgpt_account_id ||
      payload.account_id ||
      undefined
    );
  } catch {
    return undefined;
  }
}

function parseCodexSseStream(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  // Fallback if response is plain JSON instead of SSE
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      if (typeof json.output_text === 'string' && json.output_text) return json.output_text;
      if (typeof json.reply === 'string' && json.reply) return json.reply;
      const msgContent = json.choices?.[0]?.message?.content;
      if (typeof msgContent === 'string' && msgContent) return msgContent;
      const outText = json.output?.[0]?.content?.[0]?.text;
      if (typeof outText === 'string' && outText) return outText;
    } catch {
      // Not single JSON object, parse as SSE lines below
    }
  }

  let accumulatedDelta = '';
  let completedFallback = '';

  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const dataStr = line.slice(5).trim();
    if (!dataStr || dataStr === '[DONE]') continue;

    try {
      const evt = JSON.parse(dataStr);
      if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
        accumulatedDelta += evt.delta;
      } else if (evt.type === 'response.completed' && evt.response) {
        const outputs = evt.response.output;
        if (Array.isArray(outputs)) {
          for (const item of outputs) {
            if (Array.isArray(item?.content)) {
              for (const part of item.content) {
                if (typeof part?.text === 'string') {
                  completedFallback += part.text;
                }
              }
            }
          }
        }
      }
    } catch {
      // Skip malformed SSE line
    }
  }

  return (accumulatedDelta || completedFallback).trim();
}

function resolveCodexModel(requestedModel: string): string {
  const m = (requestedModel || '').trim();
  if (!m) return 'gpt-5.6-terra';
  if (m.startsWith('cx/')) return m.slice(3);
  return m;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // =========================================================================
    // OAUTH ACTION 1: Exchange PKCE authorization_code -> access_token + refresh_token
    // =========================================================================
    if (action === 'exchange_openai_code') {
      const { code, codeVerifier, redirectUri } = body;
      if (!code || !codeVerifier) {
        return new Response(
          JSON.stringify({
            error: 'missing_params',
            message: 'Thiếu mã xác thực (code) hoặc khóa đối chiếu PKCE (code_verifier).',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenRes = await fetch(OPENAI_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: OPENAI_OAUTH_CLIENT_ID,
          code: String(code).trim(),
          redirect_uri: redirectUri || OPENAI_OAUTH_REDIRECT_URI,
          code_verifier: String(codeVerifier).trim(),
        }),
      });

      const tokenData = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenData.access_token) {
        const errDetail =
          tokenData.error_description ||
          tokenData.error?.message ||
          tokenData.error ||
          `HTTP ${tokenRes.status}`;
        return new Response(
          JSON.stringify({
            error: 'oauth_exchange_failed',
            message: `Không thể đổi mã ủy quyền OpenAI: ${errDetail}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accountId = extractAccountIdFromJwt(tokenData.access_token);
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          account_id: accountId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // OAUTH ACTION 2: Refresh expired access_token using refresh_token
    // =========================================================================
    if (action === 'refresh_openai_token') {
      const { refreshToken } = body;
      if (!refreshToken) {
        return new Response(
          JSON.stringify({
            error: 'missing_refresh_token',
            message: 'Thiếu refresh_token để gia hạn phiên ChatGPT.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refreshRes = await fetch(OPENAI_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: OPENAI_OAUTH_CLIENT_ID,
          refresh_token: String(refreshToken).trim(),
        }),
      });

      const refreshData = await refreshRes.json().catch(() => ({}));
      if (!refreshRes.ok || !refreshData.access_token) {
        const errDetail =
          refreshData.error_description ||
          refreshData.error?.message ||
          refreshData.error ||
          `HTTP ${refreshRes.status}`;
        return new Response(
          JSON.stringify({
            error: 'oauth_refresh_failed',
            message: `Phiên đăng nhập ChatGPT đã hết hạn và không thể tự gia hạn (${errDetail}). Vui lòng kết nối lại.`,
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accountId = extractAccountIdFromJwt(refreshData.access_token);
      return new Response(
        JSON.stringify({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token || refreshToken,
          expires_in: refreshData.expires_in,
          account_id: accountId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      provider = 'system',
      model = 'gpt-4o-mini',
      prompt = '',
      context = '',
      apiKey = '',
      accessToken = '',
      accountId: clientAccountId = '',
      maxTokens,
    } = body;

    // 1. Authenticate user via JWT (Strictly required for 'system' provider that debits ViToken)
    const { user, error: authError } = await authenticateUser(req);
    if (provider === 'system' && (!user || authError)) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Vui lòng đăng nhập để sử dụng tính năng AI hệ thống.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'invalid_prompt', message: 'Nội dung câu hỏi không hợp lệ.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPrompt = prompt.normalize('NFC').trim();
    const cleanContext = typeof context === 'string' ? context.normalize('NFC').trim() : '';

    // Budget guard: Prompt + context <= 12,000 characters
    if (cleanPrompt.length + cleanContext.length > 12000) {
      return new Response(
        JSON.stringify({ error: 'too_long', message: 'Độ dài câu hỏi và ngữ cảnh vượt quá giới hạn 12.000 ký tự.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getServiceRoleClient();

    // 2. Server-side Rate Limiting (Hourly & Daily for system provider)
    if (provider === 'system' && user) {
      const { data: hourLimit, error: hourErr } = await supabaseAdmin.rpc('consume_rate_limit', {
        p_user: user.id,
        p_action: 'ai_chat_hour',
        p_limit: 20,
        p_window: '1 hour',
      });

      if (hourErr || (hourLimit && !hourLimit[0]?.allowed)) {
        return new Response(
          JSON.stringify({
            error: 'rate_limited',
            message: 'Bạn đã đạt giới hạn 20 lượt hỏi AI / giờ. Vui lòng quay lại sau.',
            resetAt: hourLimit?.[0]?.reset_at,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: dayLimit, error: dayErr } = await supabaseAdmin.rpc('consume_rate_limit', {
        p_user: user.id,
        p_action: 'ai_chat_day',
        p_limit: 60,
        p_window: '1 day',
      });

      if (dayErr || (dayLimit && !dayLimit[0]?.allowed)) {
        return new Response(
          JSON.stringify({
            error: 'rate_limited',
            message: 'Bạn đã đạt hạn mức 60 lượt hỏi AI / ngày của hệ thống.',
            resetAt: dayLimit?.[0]?.reset_at,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. ViToken Debit for System Managed Provider
    let tokenCost = 1;
    let balanceAfter: number | undefined;
    const requestId = crypto.randomUUID();

    if (provider === 'system' && user) {
      const { data: costData } = await supabaseAdmin
        .from('ai_model_costs')
        .select('vitoken_cost, enabled')
        .eq('model', model)
        .single();

      if (costData?.vitoken_cost !== undefined) {
        tokenCost = costData.vitoken_cost;
      }

      const { data: debitedBalance, error: debitError } = await supabaseAdmin.rpc('debit_vitoken', {
        p_user: user.id,
        p_amount: tokenCost,
        p_type: 'ai_usage',
        p_description: `Hỏi đáp AI (${model})`,
        p_reference: requestId,
      });

      if (debitError) {
        if (debitError.message.includes('insufficient_balance')) {
          return new Response(
            JSON.stringify({
              error: 'insufficient_balance',
              message: 'Số dư ViToken không đủ để thực hiện yêu cầu AI này.',
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw debitError;
      }

      balanceAfter = debitedBalance;
    }

    // 4. Call Model Provider with Auto-Refund on Failure
    const systemInstruction = `Bạn là Trợ lý Học Tập ViTudy chuyên nghiệp, thông minh, ngắn gọn và chính xác. 
Nhiệm vụ của bạn là giải thích kiến thức, tóm tắt, giải bài tập và làm rõ ngữ cảnh từ tài liệu người học cung cấp.
Nếu có ngữ cảnh (Context), hãy ưu tiên bám sát dữ liệu trong ngữ cảnh đó để giải thích.`.normalize('NFC');

    let reply = '';

    try {
      if (provider === 'oauth_chatgpt') {
        const token = (accessToken || apiKey || '').trim();
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'unauthorized_token', message: 'Thiếu Token ủy quyền ChatGPT.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const resolvedAccountId = clientAccountId || extractAccountIdFromJwt(token);
        const codexModel = resolveCodexModel(model);
        const userMessageText = cleanContext
          ? `NGỮ CẢNH TÀI LIỆU:\n${cleanContext}\n\nCÂU HỎI:\n${cleanPrompt}`
          : cleanPrompt;

        const codexHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'originator': 'codex_cli_rs',
          'User-Agent': 'codex_cli_rs/0.136.0 (Linux; x86_64)',
          'OpenAI-Beta': 'responses=v1',
        };
        if (resolvedAccountId) {
          codexHeaders['ChatGPT-Account-Id'] = resolvedAccountId;
        }

        const codexRes = await fetch(CODEX_RESPONSES_URL, {
          method: 'POST',
          headers: codexHeaders,
          body: JSON.stringify({
            model: codexModel,
            instructions: systemInstruction,
            input: [
              {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: userMessageText,
                  },
                ],
              },
            ],
            store: false,
            stream: true,
            reasoning: {
              effort: 'low',
              summary: 'auto',
            },
          }),
        });

        if (!codexRes.ok) {
          const errBody = await codexRes.text().catch(() => '');
          throw new Error(`Codex Gateway (${codexRes.status}): ${errBody.slice(0, 200)}`);
        }

        const rawSse = await codexRes.text();
        reply = parseCodexSseStream(rawSse) || 'Không có phản hồi từ ChatGPT Codex.';

      } else if (provider === 'byok_gemini' || provider === 'oauth_gemini') {
        const geminiKey = apiKey || accessToken;
        if (!geminiKey) {
          return new Response(
            JSON.stringify({ error: 'missing_api_key', message: 'Chưa cấu hình API Key hoặc Token Google Gemini.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

        const calculatedTokens = typeof maxTokens === 'number' && maxTokens > 0 
          ? Math.min(maxTokens, 4000) 
          : 2500;

        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n${cleanContext ? `NGỮ CẢNH:\n${cleanContext}\n\n` : ''}CÂU HỎI:\n${cleanPrompt}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: calculatedTokens,
            },
          }),
        });

        if (!geminiRes.ok) {
          throw new Error(`Gemini API error: status ${geminiRes.status}`);
        }

        const geminiData = await geminiRes.json();
        reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ Gemini.';

      } else {
        // BYOK OpenAI or System Managed OpenAI
        const targetKey = provider === 'byok_openai' ? apiKey : Deno.env.get('OPENAI_API_KEY');

        if (!targetKey) {
          // Simulation fallback if system key not yet provisioned in environment
          reply = `[ViTudy AI Assistant]\nDựa trên tài liệu bạn cung cấp:\n${cleanContext ? `"${cleanContext.slice(0, 150)}..."` : 'Chủ đề: ' + cleanPrompt}\n\n1. Trọng tâm: Câu hỏi thuộc nội dung cốt lõi của bài học.\n2. Hướng dẫn: Đọc kỹ định nghĩa và chú ý các trường hợp đặc biệt để làm bài chính xác.`;
        } else {
          const calculatedTokens = typeof maxTokens === 'number' && maxTokens > 0 
            ? Math.min(maxTokens, 4000) 
            : 2500;

          const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${targetKey}`,
            },
            body: JSON.stringify({
              model: model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: cleanContext ? `NGỮ CẢNH:\n${cleanContext}\n\n` : '' + `CÂU HỎI:\n${cleanPrompt}` },
              ],
              max_tokens: calculatedTokens,
              temperature: 0.7,
            }),
          });

          if (!openAiRes.ok) {
            throw new Error(`OpenAI API error: status ${openAiRes.status}`);
          }

          const openAiData = await openAiRes.json();
          reply = openAiData.choices?.[0]?.message?.content || 'Không có phản hồi từ OpenAI.';
        }
      }

    } catch (callError: any) {
      // Auto-refund if system token was debited
      if (provider === 'system' && user) {
        await supabaseAdmin.rpc('credit_vitoken', {
          p_user: user.id,
          p_amount: tokenCost,
          p_type: 'refund',
          p_description: 'Hoàn trả ViToken do lỗi kết nối AI Gateway',
          p_reference: `refund:${requestId}`,
        });
      }

      return new Response(
        JSON.stringify({
          error: 'provider_failed',
          message: 'Không thể kết nối đến nhà cung cấp AI. ViToken (nếu có) đã được tự động hoàn lại đầy đủ.',
          details: callError.message,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        reply,
        provider,
        balanceAfter,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'system_error', message: err.message || 'Lỗi xử lý AI Gateway.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
