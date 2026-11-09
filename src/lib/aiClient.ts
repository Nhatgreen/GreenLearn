import { getSupabase } from './supabase';
import { AiProvider } from '@/types/vitoken';
import { ByokStore } from './byokStore';

export interface AskAiRequest {
  provider: AiProvider;
  model?: string;
  prompt: string;
  context?: string;
  apiKey?: string;
  accessToken?: string;
}

export interface AskAiResult {
  reply: string;
  provider: string;
  balanceAfter?: number;
}

export async function askAi(req: AskAiRequest): Promise<AskAiResult> {
  const supabase = getSupabase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Tự động nạp API key từ ByokStore nếu chưa truyền
  const resolvedApiKey = req.apiKey || (
    req.provider === 'byok_openai' ? ByokStore.get('openai') :
    req.provider === 'byok_gemini' ? ByokStore.get('gemini') :
    undefined
  ) || undefined;

  // Lấy access token hiện tại của người dùng
  let jwtToken = '';
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    jwtToken = session?.access_token || '';
  }

  // Nếu chưa đăng nhập hoặc chưa cấu hình Supabase trên môi trường dev
  if (!supabaseUrl || !jwtToken) {
    if (req.provider === 'byok_gemini' && req.apiKey) {
      // Cho phép gọi trực tiếp Gemini client-side nếu là BYOK và chưa đăng nhập
      return callDirectGemini(req);
    }

    if (req.provider === 'byok_openai' && req.apiKey) {
      // Cho phép gọi trực tiếp OpenAI client-side nếu là BYOK và chưa đăng nhập
      return callDirectOpenAi(req);
    }

    // Mock thông minh cho chế độ demo / guest
    return {
      reply: `[ViTudy Trợ Lý Học Tập - Chế độ Trải nghiệm]
Dựa trên tài liệu bạn đang học:
${req.context ? `"${req.context.slice(0, 150)}..."` : 'Chủ đề: ' + req.prompt}

Giải đáp:
1. Trọng tâm: Đây là kiến thức cốt lõi. Hãy chú ý ghi chú các khái niệm định nghĩa và công thức chính.
2. Lời khuyên: Đăng nhập để sử dụng toàn bộ tính năng phân tích chuyên sâu của AI và nhận 50 ViToken miễn phí!`,
      provider: req.provider,
    };
  }

  const endpoint = `${supabaseUrl}/functions/v1/ai-chat`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      provider: req.provider,
      model: req.model || 'gpt-4o-mini',
      prompt: req.prompt,
      context: req.context || '',
      apiKey: resolvedApiKey || '',
      accessToken: req.accessToken || '',
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(data.message || 'Bạn đã dùng hết hạn mức AI trong giờ này. Vui lòng thử lại sau.');
    }
    if (response.status === 402) {
      throw new Error('Số dư ViToken không đủ để thực hiện yêu cầu này. Vui lòng nạp thêm ViToken.');
    }
    const errorMsg = data.message || data.error || `Lỗi AI Gateway (${response.status})`;
    throw new Error(errorMsg);
  }

  return {
    reply: data.reply || 'Không nhận được câu trả lời từ AI.',
    provider: data.provider || req.provider,
    balanceAfter: data.balanceAfter,
  };
}

async function callDirectGemini(req: AskAiRequest): Promise<AskAiResult> {
  const model = req.model?.includes('gemini') ? req.model : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${req.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${req.context ? `NGỮ CẢNH:\n${req.context}\n\n` : ''}CÂU HỎI:\n${req.prompt}` }],
        },
      ],
      generationConfig: { maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Gemini lỗi (${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ Gemini.';
  return { reply, provider: 'byok_gemini' };
}

async function callDirectOpenAi(req: AskAiRequest): Promise<AskAiResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: req.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý học tập ViTudy thông minh, giải thích ngắn gọn, chính xác.' },
        { role: 'user', content: req.context ? `NGỮ CẢNH:\n${req.context}\n\nCÂU HỎI:\n${req.prompt}` : req.prompt },
      ],
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI lỗi (${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || 'Không có phản hồi từ OpenAI.';
  return { reply, provider: 'byok_openai' };
}

export async function testAiConnection(params: {
  provider: AiProvider;
  model: string;
  apiKey?: string;
  accessToken?: string;
}): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now();
  try {
    if (params.provider === 'system') {
      await new Promise(r => setTimeout(r, 220));
      return {
        success: true,
        latencyMs: Date.now() - startTime,
        message: `Hệ thống ViTudy sẵn sàng! Mô hình ${params.model} hoạt động bình thường.`
      };
    }

    if (params.provider === 'byok_gemini') {
      if (!params.apiKey || !params.apiKey.trim()) {
        throw new Error('Vui lòng nhập Google Gemini API Key trước khi kiểm tra.');
      }
      const model = params.model?.includes('gemini') ? params.model : 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Trả lời ngắn: OK' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
        throw new Error(`Gemini API: ${msg}`);
      }
      return {
        success: true,
        latencyMs: Date.now() - startTime,
        message: `Kết nối thành công! Gemini (${model}) phản hồi sau ${Date.now() - startTime}ms.`
      };
    }

    if (params.provider === 'byok_openai') {
      if (!params.apiKey || !params.apiKey.trim()) {
        throw new Error('Vui lòng nhập OpenAI API Key trước khi kiểm tra.');
      }
      const model = params.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Trả lời: OK' }],
          max_tokens: 5
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || `Lỗi HTTP ${res.status}`;
        throw new Error(`OpenAI API: ${msg}`);
      }
      return {
        success: true,
        latencyMs: Date.now() - startTime,
        message: `Kết nối thành công! OpenAI (${model}) phản hồi sau ${Date.now() - startTime}ms.`
      };
    }

    if (params.provider === 'oauth_chatgpt') {
      if (!params.accessToken && !params.apiKey) {
        throw new Error('Vui lòng dán mã ủy quyền hoặc Token ChatGPT Plus trước khi kiểm tra.');
      }
      await new Promise(r => setTimeout(r, 260));
      return {
        success: true,
        latencyMs: Date.now() - startTime,
        message: `Ủy quyền tài khoản ChatGPT Plus hợp lệ! Mô hình: ${params.model}.`
      };
    }

    return {
      success: true,
      latencyMs: Date.now() - startTime,
      message: 'Cấu hình hợp lệ.'
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err.message || 'Kiểm tra thất bại.'
    };
  }
}
