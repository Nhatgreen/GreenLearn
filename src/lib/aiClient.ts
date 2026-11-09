import { ByokStore } from './byokStore';

export type AiProvider = 'byok_openai';

export interface AskAiRequest {
  provider?: AiProvider;
  model?: string;
  prompt: string;
  context?: string;
  apiKey?: string;
  accessToken?: string;
  signal?: AbortSignal;
}

export interface AskAiResult {
  reply: string;
  provider: string;
  balanceAfter?: number;
}

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Khuyên dùng - Phản hồi nhanh & tiết kiệm chi phí' },
  { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship - Trả lời xuất sắc và chi tiết nhất' },
  { id: 'o3-mini', name: 'o3-mini', tag: 'Mô hình lý luận toán học & lập trình sâu' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'Đa nhiệm nâng cao' },
];

export async function askAi(req: AskAiRequest): Promise<AskAiResult> {
  const resolvedApiKey = req.apiKey || ByokStore.get('openai') || '';

  if (!resolvedApiKey) {
    return {
      reply: `[GreenLearn Trợ Lý Học Tập]
Chưa cấu hình Khóa API OpenAI.
Để kích hoạt trợ lý AI thông minh:
1. Bấm vào biểu tượng Bot AI ở góc trên bên phải màn hình (hoặc vào trang Hồ sơ cá nhân).
2. Dán Khóa API OpenAI (bắt đầu bằng sk-proj-... hoặc sk-...) của bạn.
3. Khóa chỉ lưu trực tiếp trên trình duyệt của bạn (localStorage), bảo mật 100% và không gửi lên máy chủ trung gian.`,
      provider: 'byok_openai',
    };
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
        'Authorization': `Bearer ${resolvedApiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1500,
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

export async function testAiConnection(params: {
  provider?: AiProvider;
  model: string;
  apiKey?: string;
  accessToken?: string;
}): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  const key = (params.apiKey || ByokStore.get('openai') || '').trim();

  if (!key) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Chưa cấu hình Khóa API OpenAI. Vui lòng nhập OpenAI API Key trước khi kiểm tra.',
    };
  }

  const model = params.model || 'gpt-4o-mini';

  try {
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
          message: 'Khóa API OpenAI không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại tại platform.openai.com.',
        };
      }
      if (res.status === 429) {
        return {
          success: false,
          latencyMs,
          message: 'Tài khoản OpenAI của bạn đã hết hạn mức credit hoặc vượt giới hạn tần suất. Vui lòng kiểm tra số dư tại platform.openai.com.',
        };
      }
      if (res.status >= 500) {
        return {
          success: false,
          latencyMs,
          message: 'Máy chủ OpenAI đang bận hoặc gặp sự cố tạm thời. Vui lòng thử lại sau giây lát.',
        };
      }
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
      return {
        success: false,
        latencyMs,
        message: `OpenAI API: ${msg}`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Kết nối thành công! OpenAI (${model}) phản hồi sau ${latencyMs}ms.`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      return {
        success: false,
        latencyMs,
        message: 'Không thể kết nối đến máy chủ OpenAI (api.openai.com). Vui lòng kiểm tra kết nối mạng hoặc tiện ích chặn quảng cáo/VPN.',
      };
    }
    return {
      success: false,
      latencyMs,
      message: err.message || 'Kiểm tra thất bại. Vui lòng kiểm tra kết nối mạng.',
    };
  }
}
