import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser, getServiceRoleClient } from '../_shared/auth.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user via JWT
    const { user, error: authError } = await authenticateUser(req);
    if (!user || authError) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Vui lòng đăng nhập để sử dụng tính năng AI.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      provider = 'system',
      model = 'gpt-4o-mini',
      prompt = '',
      context = '',
      apiKey = '',
      accessToken = '',
    } = body;

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
    if (provider === 'system') {
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

    if (provider === 'system') {
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
        const token = accessToken || apiKey;
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'unauthorized_token', message: 'Thiếu Token ủy quyền ChatGPT.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const codexRes = await fetch('https://chatgpt.com/backend-api/codex/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'originator': 'codex_cli_rs',
            'User-Agent': 'codex-cli/0.1.0 (Windows; x86_64)',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: cleanContext ? `NGỮ CẢNH TÀI LIỆU:\n${cleanContext}\n\nCÂU HỎI:\n${cleanPrompt}` : cleanPrompt },
            ],
          }),
        });

        if (!codexRes.ok) {
          throw new Error(`Codex Gateway error: status ${codexRes.status}`);
        }

        const codexData = await codexRes.json();
        reply = codexData.choices?.[0]?.message?.content || codexData.reply || 'Không có phản hồi từ ChatGPT Codex.';

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
              maxOutputTokens: 800,
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
                { role: 'user', content: cleanContext ? `NGỮ CẢNH:\n${cleanContext}\n\nCÂU HỎI:\n${cleanPrompt}` : cleanPrompt },
              ],
              max_tokens: 800,
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
      if (provider === 'system') {
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
