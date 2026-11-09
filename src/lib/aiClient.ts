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

export async function askAi(req: AskAiRequest): Promise<AskAiResult> {
  const resolvedApiKey = req.apiKey || ByokStore.get('openai') || '';

  if (!resolvedApiKey) {
    return {
      reply: `[GreenLearn Trợ Lý Học Tập]
Chưa tìm thấy Khóa API OpenAI của bạn.
Để kích hoạt trợ lý AI thông minh:
1. Nhấp vào biểu tượng Bot AI ở góc trên bên phải màn hình (hoặc vào Trang cá nhân).
2. Dán Khóa API OpenAI (sk-proj-...) của bạn.
3. Khóa được lưu trực tiếp trên trình duyệt của bạn, hoàn toàn bảo mật và không gửi lên bất kỳ máy chủ trung gian nào.`,
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
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Lỗi HTTP ${res.status}`;
      if (res.status === 401) {
        throw new Error('Khóa API OpenAI không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại khóa API.');
      }
      if (res.status === 429) {
        throw new Error('Tài khoản OpenAI của bạn đã vượt quá giới hạn (Rate limit hoặc hết credit).');
      }
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
      throw new Error('Yêu cầu AI đã quá thời gian phản hồi (30 giây). Vui lòng thử lại.');
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
      message: 'Vui lòng nhập OpenAI API Key trước khi kiểm tra.',
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
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
      if (res.status === 401) {
        return {
          success: false,
          latencyMs,
          message: 'Khóa API không hợp lệ (401 Unauthorized). Hãy kiểm tra lại key.',
        };
      }
      if (res.status === 429) {
        return {
          success: false,
          latencyMs,
          message: 'Hết hạn mức hoặc bị giới hạn tần suất (429 Rate Limit).',
        };
      }
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
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err.message || 'Kiểm tra thất bại. Vui lòng kiểm tra kết nối mạng.',
    };
  }
}
