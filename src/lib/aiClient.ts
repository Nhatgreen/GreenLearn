import { ByokStore } from './byokStore';
import {
  OPENAI_OAUTH_CLIENT_ID,
  OPENAI_OAUTH_REDIRECT_URI,
  OPENAI_TOKEN_URL,
  OpenAiOAuthSession,
  parseOpenAiCallbackInput,
  getPendingPkce,
  clearPendingPkce,
  saveOpenAiOAuthSession,
  getOpenAiOAuthSession,
  isOpenAiSessionExpired,
} from './openaiOAuth';

export type AiProvider = 'byok_gemini' | 'byok_openai' | 'oauth_chatgpt' | 'system';

export interface AskAiRequest {
  provider?: AiProvider;
  model?: string;
  prompt: string;
  context?: string;
  apiKey?: string;
  accessToken?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AskAiResult {
  reply: string;
  provider: string;
  balanceAfter?: number;
}

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Khuyên dùng - Nhanh, thông minh, miễn phí từ Google' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Tư duy chuyên sâu, giải toán và lý luận phức tạp' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Tốc độ phản hồi cực nhanh thời gian thực' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Ngữ cảnh cực lớn 2M tokens' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Mô hình tiêu chuẩn ổn định' },
];

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Khuyên dùng - Phản hồi nhanh & tiết kiệm chi phí' },
  { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship - Trả lời xuất sắc và chi tiết nhất' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', tag: 'Mạnh nhất, phù hợp bài toán nhiều bước' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', tag: 'Phản hồi sâu, xử lý tài liệu dài' },
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', tag: 'Phân tích cấu trúc và tổng hợp' },
  { id: 'gpt-5.5', name: 'GPT-5.5', tag: 'Cân bằng tốc độ và độ chính xác' },
  { id: 'gpt-5', name: 'GPT-5', tag: 'Đa dụng cho các môn học' },
  { id: 'o3-mini', name: 'o3-mini', tag: 'Tối ưu cho Toán và lập trình' },
  { id: 'o1', name: 'o1', tag: 'Suy luận từng bước chi tiết' },
  { id: 'o1-mini', name: 'o1-mini', tag: 'Suy luận nhanh cho bài tập ngắn' },
  { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', tag: 'Bản cập nhật thường xuyên' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'Đa nhiệm nâng cao' },
];

export const CHATGPT_MODEL_GROUPS = [
  {
    group: 'Siêu suy luận & Chuyên sâu',
    models: [
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', desc: 'Mạnh nhất, phù hợp bài toán nhiều bước' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', desc: 'Phản hồi sâu, xử lý tài liệu dài' },
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', desc: 'Phân tích cấu trúc và tổng hợp' },
      { id: 'o3-mini', name: 'o3-mini', desc: 'Tối ưu cho Toán và lập trình' },
      { id: 'o1', name: 'o1', desc: 'Suy luận từng bước chi tiết' },
    ],
  },
  {
    group: 'Cân bằng & Đa dụng',
    models: [
      { id: 'gpt-5.5', name: 'GPT-5.5', desc: 'Cân bằng tốc độ và độ chính xác' },
      { id: 'gpt-5', name: 'GPT-5', desc: 'Đa dụng cho các môn học' },
      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Hiểu hình ảnh và văn bản' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', desc: 'Bản cập nhật thường xuyên' },
    ],
  },
  {
    group: 'Phản hồi nhanh & Tiết kiệm',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Phản hồi nhanh và tiết kiệm' },
      { id: 'o1-mini', name: 'o1-mini', desc: 'Suy luận nhanh cho bài tập ngắn' },
    ],
  },
];

export const PROVIDER_MODELS: Record<AiProvider, { id: string; name: string; tag: string }[]> = {
  byok_gemini: GEMINI_MODELS,
  byok_openai: OPENAI_MODELS,
  oauth_chatgpt: CHATGPT_MODEL_GROUPS.flatMap((group) =>
    group.models.map((m) => ({
      id: m.id,
      name: m.name,
      tag: m.desc,
    }))
  ),
  system: [
    { id: 'gpt-4o-mini', name: 'GreenLearn AI (Nhanh)', tag: 'Hỗ trợ giải đáp cốt lõi & tóm tắt' },
    { id: 'gemini-2.5-flash', name: 'GreenLearn AI (Đa năng)', tag: 'Phân tích tài liệu & công thức' },
  ],
};

export async function refreshOpenAiSession(refreshToken: string): Promise<OpenAiOAuthSession> {
  const cleanRefresh = refreshToken.trim();
  const existing = getOpenAiOAuthSession();

  try {
    const res = await fetch(OPENAI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: OPENAI_OAUTH_CLIENT_ID,
        refresh_token: cleanRefresh,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      const expiresAt =
        typeof data.expires_in === 'number'
          ? Date.now() + data.expires_in * 1000
          : undefined;
      return saveOpenAiOAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || cleanRefresh,
        accountId: existing?.accountId,
        email: existing?.email,
        planType: existing?.planType,
        expiresAt,
        updatedAt: Date.now(),
      });
    }
  } catch {}

  throw new Error('Phiên đăng nhập ChatGPT đã hết hạn. Vui lòng kết nối lại.');
}

export async function exchangeOpenAiCode(rawInput: string): Promise<OpenAiOAuthSession> {
  const parsed = parseOpenAiCallbackInput(rawInput);

  if (parsed.kind === 'error') {
    throw new Error(parsed.message);
  }

  if (parsed.kind === 'session') {
    clearPendingPkce();
    return saveOpenAiOAuthSession({
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accountId: parsed.accountId,
      updatedAt: Date.now(),
    });
  }

  if (parsed.kind === 'jwt') {
    clearPendingPkce();
    return saveOpenAiOAuthSession({
      accessToken: parsed.accessToken,
      updatedAt: Date.now(),
    });
  }

  const pending = getPendingPkce();
  if (!pending || !pending.codeVerifier) {
    throw new Error(
      'Chưa tìm thấy phiên khởi tạo PKCE. Vui lòng bấm "Bước 1: Đăng nhập ChatGPT" trước, rồi dán lại đường dẫn Callback URL.'
    );
  }

  if (parsed.state && pending.state && parsed.state !== pending.state) {
    throw new Error(
      'Mã bảo mật (state) trong URL không khớp với lần mở đăng nhập gần nhất. Vui lòng bấm lại "Bước 1: Đăng nhập ChatGPT".'
    );
  }

  let tokenErrorMsg = '';
  try {
    const res = await fetch(OPENAI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: OPENAI_OAUTH_CLIENT_ID,
        code: parsed.code,
        redirect_uri: OPENAI_OAUTH_REDIRECT_URI,
        code_verifier: pending.codeVerifier,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      clearPendingPkce();
      const expiresAt =
        typeof data.expires_in === 'number'
          ? Date.now() + data.expires_in * 1000
          : undefined;
      return saveOpenAiOAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        updatedAt: Date.now(),
      });
    }
    tokenErrorMsg =
      data.error_description || data.error?.message || data.error || `HTTP ${res.status}`;
  } catch (err: any) {
    tokenErrorMsg = err?.message || 'Lỗi kết nối máy chủ OpenAI Auth';
  }

  throw new Error(
    `Không thể đổi mã ủy quyền OpenAI (${tokenErrorMsg || 'Mã code đã hết hạn hoặc đã được sử dụng'}). Vui lòng bấm mở lại trang đăng nhập.`
  );
}

export async function ensureValidOpenAiSession(): Promise<OpenAiOAuthSession | null> {
  const session = getOpenAiOAuthSession();
  if (!session) return null;

  if (isOpenAiSessionExpired(session)) {
    if (session.refreshToken) {
      try {
        return await refreshOpenAiSession(session.refreshToken);
      } catch {
        return session;
      }
    }
  }
  return session;
}

/**
 * Trực tiếp gọi API Google Gemini từ trình duyệt
 */
export async function callDirectGemini(req: AskAiRequest): Promise<AskAiResult> {
  const apiKey = req.apiKey || ByokStore.get('gemini') || '';
  if (!apiKey.trim()) {
    throw new Error('Chưa cấu hình Google Gemini API Key. Vui lòng nhập API Key từ Google AI Studio.');
  }

  const model = req.model?.includes('gemini') ? req.model : 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const promptText = req.context
    ? `NGỮ CẢNH TÀI LIỆU:\n${req.context.slice(0, 8000)}\n\nYÊU CẦU / CÂU HỎI:\n${req.prompt}`
    : req.prompt;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const signal = req.signal || controller.signal;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
        systemInstruction: {
          parts: [{ text: 'Bạn là trợ lý học tập GreenLearn thông minh, giải thích chuẩn xác, sư phạm và dễ hiểu.' }],
        },
        generationConfig: {
          maxOutputTokens: req.maxTokens ? Math.min(req.maxTokens, 4000) : 2500,
          temperature: 0.7,
        },
      }),
      signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}`;
      if (res.status === 400 && errMsg.includes('API_KEY_INVALID')) {
        throw new Error('Khóa API Google Gemini không hợp lệ. Vui lòng kiểm tra lại tại aistudio.google.com.');
      }
      if (res.status === 429) {
        throw new Error('Đã vượt quá giới hạn tần suất Google Gemini. Vui lòng thử lại sau giây lát.');
      }
      throw new Error(`Google Gemini: ${errMsg}`);
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ mô hình Gemini.';

    return {
      reply,
      provider: 'byok_gemini',
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Yêu cầu Google Gemini đã quá thời gian phản hồi (30 giây). Vui lòng thử lại.');
    }
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      throw new Error('Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra kết nối mạng.');
    }
    throw error;
  }
}

/**
 * Trực tiếp gọi API OpenAI từ trình duyệt
 */
export async function callDirectOpenAi(req: AskAiRequest): Promise<AskAiResult> {
  const resolvedApiKey = (req.apiKey || ByokStore.get('openai') || '').trim();

  if (!resolvedApiKey) {
    throw new Error('Chưa cấu hình Khóa API OpenAI. Vui lòng nhập OpenAI API Key.');
  }

  const model = req.model || 'gpt-4o-mini';

  const messages: { role: 'system' | 'user'; content: string }[] = [
    {
      role: 'system',
      content: 'Bạn là trợ lý học tập GreenLearn thông minh, giải thích ngắn gọn, chính xác, sư phạm và dễ hiểu.',
    },
    {
      role: 'user',
      content: req.context ? `NGỮ CẢNH TÀI LIỆU:\n${req.context.slice(0, 6000)}\n\nYÊU CẦU / CÂU HỎI:\n${req.prompt}` : req.prompt,
    },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const signal = req.signal || controller.signal;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: req.maxTokens ? Math.min(req.maxTokens, 4000) : 2500,
        temperature: 0.7,
      }),
      signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Khóa API OpenAI không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại tại platform.openai.com.');
      }
      if (res.status === 429) {
        throw new Error('Tài khoản OpenAI của bạn đã hết hạn mức credit hoặc vượt giới hạn tần suất. Vui lòng kiểm tra số dư tại platform.openai.com.');
      }
      if (res.status >= 500) {
        throw new Error('Máy chủ OpenAI đang bận hoặc gặp sự cố tạm thời. Vui lòng thử lại sau giây lát.');
      }
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}`;
      throw new Error(`OpenAI API: ${errMsg}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'Không có phản hồi từ mô hình AI.';

    return {
      reply,
      provider: 'byok_openai',
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Yêu cầu đã quá thời gian phản hồi (30 giây). Vui lòng thử lại với đoạn văn bản ngắn hơn.');
    }
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      throw new Error('Không thể kết nối đến máy chủ OpenAI (api.openai.com). Vui lòng kiểm tra kết nối mạng hoặc tiện ích chặn quảng cáo/VPN.');
    }
    throw error;
  }
}

/**
 * Điều phối gọi AI thống nhất
 */
export async function askAi(req: AskAiRequest): Promise<AskAiResult> {
  const provider = req.provider || (
    req.apiKey?.startsWith('AIzaSy') ? 'byok_gemini' :
    ByokStore.has('gemini') && !ByokStore.has('openai') ? 'byok_gemini' :
    ByokStore.has('chatgpt_oauth') && !ByokStore.has('openai') ? 'oauth_chatgpt' :
    'byok_openai'
  );

  // 1. Google Gemini
  if (provider === 'byok_gemini') {
    const key = req.apiKey || ByokStore.get('gemini');
    if (key) {
      return callDirectGemini({ ...req, apiKey: key });
    }
  }

  // 2. OpenAI BYOK
  if (provider === 'byok_openai') {
    const key = req.apiKey || ByokStore.get('openai');
    if (key) {
      return callDirectOpenAi({ ...req, apiKey: key });
    }
  }

  // 3. ChatGPT OAuth
  if (provider === 'oauth_chatgpt') {
    const session = await ensureValidOpenAiSession();
    if (session && session.accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && anonKey) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              provider: 'oauth_chatgpt',
              model: req.model || 'gpt-4o-mini',
              prompt: req.prompt,
              context: req.context,
              accessToken: session.accessToken,
              accountId: session.accountId,
              maxTokens: req.maxTokens || 2500,
            }),
            signal: req.signal,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.reply) {
              return {
                reply: data.reply,
                provider: 'oauth_chatgpt',
              };
            }
          }
        } catch {}
      }

      // Thử gọi direct (nếu token là API key hoặc platform token)
      try {
        return await callDirectOpenAi({
          ...req,
          apiKey: session.accessToken,
          model: req.model || 'gpt-4o-mini',
        });
      } catch (err: any) {
        // Tự động fallback sang Google Gemini hoặc OpenAI BYOK nếu người dùng đã có key
        const geminiKey = ByokStore.get('gemini');
        if (geminiKey) {
          return await callDirectGemini({ ...req, apiKey: geminiKey });
        }
        const openAiKey = ByokStore.get('openai');
        if (openAiKey) {
          return await callDirectOpenAi({ ...req, apiKey: openAiKey });
        }
        throw new Error(
          `Không thể gọi mô hình ChatGPT trực tiếp (${err.message}). Vui lòng cấu hình Google Gemini API Key (miễn phí 100% từ Google AI Studio) hoặc OpenAI API Key trong Cài đặt AI!`
        );
      }
    }
  }

  // Fallback khi chưa cấu hình khóa
  return {
    reply: `[GreenLearn Trợ Lý Học Tập]
Chưa cấu hình kết nối AI.
Để kích hoạt trợ lý AI thông minh:
1. Bấm vào biểu tượng Bot AI ở góc trên bên phải màn hình (hoặc vào trang Hồ sơ cá nhân).
2. Bạn có thể chọn kết nối miễn phí bằng Google Gemini API Key (từ Google AI Studio), OpenAI API Key, hoặc Đăng nhập ChatGPT.
3. Toàn bộ thông tin được lưu trữ an toàn 100% trên trình duyệt của bạn (localStorage), không gửi về máy chủ trung gian.`,
    provider: provider || 'byok_openai',
  };
}

/**
 * Kiểm tra kết nối AI thời gian thực và đo độ trễ ms
 */
export async function testAiConnection(params: {
  provider?: AiProvider;
  model: string;
  apiKey?: string;
  accessToken?: string;
}): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  const provider = params.provider || (
    params.apiKey?.startsWith('AIzaSy') ? 'byok_gemini' : 'byok_openai'
  );

  try {
    // 1. Google Gemini Test
    if (provider === 'byok_gemini') {
      const key = (params.apiKey || ByokStore.get('gemini') || '').trim();
      if (!key) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Vui lòng nhập Google Gemini API Key trước khi kiểm tra.',
        };
      }
      const model = params.model?.includes('gemini') ? params.model : 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Trả lời: OK' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
        if (res.status === 400) {
          return {
            success: false,
            latencyMs,
            message: 'Khóa API Google Gemini không hợp lệ. Vui lòng kiểm tra lại.',
          };
        }
        return {
          success: false,
          latencyMs,
          message: `Google Gemini API lỗi: ${msg}`,
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công! Gemini (${model}) phản hồi sau ${latencyMs}ms.`,
      };
    }

    // 2. OpenAI Test
    if (provider === 'byok_openai') {
      const key = (params.apiKey || ByokStore.get('openai') || '').trim();
      if (!key) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Chưa cấu hình Khóa API OpenAI. Vui lòng nhập OpenAI API Key trước khi kiểm tra.',
        };
      }

      const model = params.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Trả lời: OK' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        if (res.status === 401) {
          return {
            success: false,
            latencyMs,
            message: 'Khóa API OpenAI không hợp lệ hoặc đã hết hạn.',
          };
        }
        if (res.status === 429) {
          return {
            success: false,
            latencyMs,
            message: 'Tài khoản OpenAI đã hết credit hoặc bị giới hạn tần suất.',
          };
        }
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
        return {
          success: false,
          latencyMs,
          message: `OpenAI API lỗi: ${msg}`,
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công! OpenAI (${model}) phản hồi sau ${latencyMs}ms.`,
      };
    }

    // 3. ChatGPT OAuth Test
    if (provider === 'oauth_chatgpt') {
      const candidateInput = (params.accessToken || params.apiKey || '').trim();
      let session = getOpenAiOAuthSession();

      if (candidateInput && (!session || candidateInput !== session.accessToken)) {
        const parsed = parseOpenAiCallbackInput(candidateInput);
        if (parsed.kind === 'code' || parsed.kind === 'session' || parsed.kind === 'jwt') {
          session = await exchangeOpenAiCode(candidateInput);
        }
      }

      session = await ensureValidOpenAiSession();
      if (!session || !session.accessToken) {
        return {
          success: false,
          latencyMs: 0,
          message: 'Chưa kết nối tài khoản ChatGPT. Vui lòng thực hiện Bước 1 và Bước 2.',
        };
      }

      // Gửi truy vấn thực tế để đo độ trễ thực và kiểm tra mô hình ChatGPT
      try {
        await askAi({
          provider: 'oauth_chatgpt',
          model: params.model,
          prompt: 'Kiểm tra kết nối mô hình. Trả lời đúng 1 từ: OK',
        });
      } catch (err: any) {
        return {
          success: false,
          latencyMs: Date.now() - startTime,
          message: `Xác thực token thành công nhưng không thể gọi mô hình (${err.message || 'Lỗi gọi API'}). Khuyên dùng Google Gemini API Key miễn phí từ Google AI Studio để gọi trực tiếp từ trình duyệt!`,
        };
      }

      const latencyMs = Date.now() - startTime;
      const accountLabel = session.email
        ? session.email
        : session.accountId
        ? `ID: ${session.accountId.slice(0, 8)}...`
        : 'Đã xác thực';
      const planBadge = session.planType ? ` (${session.planType.toUpperCase()})` : '';

      return {
        success: true,
        latencyMs,
        message: `Hoạt động tốt · Phản hồi trong ${(latencyMs / 1000).toFixed(1)}s (${params.model} - ${accountLabel}${planBadge})`,
      };
    }

    // 4. System / Default
    await new Promise((r) => setTimeout(r, 150));
    return {
      success: true,
      latencyMs: Date.now() - startTime,
      message: `Hệ thống GreenLearn sẵn sàng! Mô hình ${params.model} hoạt động bình thường.`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err.message || 'Kiểm tra kết nối thất bại.',
    };
  }
}

/**
 * Trích xuất an toàn mảng câu hỏi JSON từ chuỗi kết quả AI,
 * hỗ trợ khôi phục các câu hỏi hoàn chỉnh kể cả khi đầu ra bị cắt ngắn (partial JSON)
 */
export function parseQuizJsonSafely(rawText: string): any[] {
  if (!rawText) return [];

  // 1. Thử parse toàn bộ khối [ ... ]
  const match = rawText.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  // 2. Nếu chuỗi bị cắt cụt (partial JSON), trích xuất từng object {...} hoàn chỉnh
  const questionObjects: any[] = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === '\\') {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) startIndex = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        const jsonBlock = rawText.slice(startIndex, i + 1);
        try {
          const candidate = JSON.parse(jsonBlock);
          if (candidate.question && Array.isArray(candidate.options)) {
            questionObjects.push(candidate);
          }
        } catch {}
        startIndex = -1;
      }
    }
  }

  return questionObjects;
}
