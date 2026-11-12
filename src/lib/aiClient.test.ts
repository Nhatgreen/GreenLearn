import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askAi, testAiConnection, CHATGPT_MODEL_GROUPS, PROVIDER_MODELS, OPENAI_MODELS } from './aiClient';
import { ByokStore } from './byokStore';

describe('aiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    ByokStore.clear('openai');
  });

  it('should return helpful guidance when no API key is provided', async () => {
    const res = await askAi({
      prompt: 'Giải thích định lý Pythagoras',
      context: 'Tam giác vuông',
    });

    expect(res.reply).toContain('GreenLearn Trợ Lý Học Tập');
    expect(res.provider).toBe('byok_openai');
  });

  it('should call direct OpenAI if apiKey is supplied', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Định lý Pythagoras là a^2 + b^2 = c^2 trong tam giác vuông.',
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await askAi({
      apiKey: 'sk-test-key-12345',
      prompt: 'Pythagoras là gì',
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(res.reply).toBe('Định lý Pythagoras là a^2 + b^2 = c^2 trong tam giác vuông.');
  });

  it('handles 401 invalid key error with clear Vietnamese message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Incorrect API key' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(askAi({ apiKey: 'sk-invalid', prompt: 'test' })).rejects.toThrow(
      'Khóa API OpenAI không hợp lệ hoặc đã hết hạn'
    );
  });

  it('handles 429 rate limit error with clear Vietnamese message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limit reached' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(askAi({ apiKey: 'sk-quota-exceeded', prompt: 'test' })).rejects.toThrow(
      'Tài khoản OpenAI của bạn đã hết hạn mức credit'
    );
  });

  it('handles network / fetch failure with friendly message', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    vi.stubGlobal('fetch', mockFetch);

    await expect(askAi({ apiKey: 'sk-valid', prompt: 'test' })).rejects.toThrow(
      'Không thể kết nối đến máy chủ OpenAI'
    );
  });

  it('should test connection successfully with valid mock response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'OK' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await testAiConnection({
      apiKey: 'sk-valid-key',
      model: 'gpt-4o-mini',
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('Kết nối thành công');
  });

  it('handles 401 in testAiConnection gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await testAiConnection({
      apiKey: 'sk-bad',
      model: 'gpt-4o-mini',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Khóa API OpenAI không hợp lệ');
  });

  it('should call direct Google Gemini if Gemini API key is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Định lý Pythagoras từ Gemini' }] } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await askAi({
      provider: 'byok_gemini',
      apiKey: 'AIzaSy-test-gemini-key',
      prompt: 'Pythagoras là gì',
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(res.reply).toBe('Định lý Pythagoras từ Gemini');
    expect(res.provider).toBe('byok_gemini');
  });

  it('tests Gemini connection successfully with valid mock response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'OK' }] } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await testAiConnection({
      provider: 'byok_gemini',
      apiKey: 'AIzaSy-test-gemini-key',
      model: 'gemini-2.5-flash',
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('Kết nối thành công! Gemini');
  });

  describe('Model Catalogs (GPT-5.6 / ChatGPT / OpenAI)', () => {
    it('defines CHATGPT_MODEL_GROUPS with 3 groups and exactly 11 models matching UI specifications', () => {
      expect(CHATGPT_MODEL_GROUPS).toHaveLength(3);

      const groupNames = CHATGPT_MODEL_GROUPS.map((g) => g.group);
      expect(groupNames).toEqual([
        'Siêu suy luận & Chuyên sâu',
        'Cân bằng & Đa dụng',
        'Phản hồi nhanh & Tiết kiệm',
      ]);

      const totalModels = CHATGPT_MODEL_GROUPS.reduce((acc, g) => acc + g.models.length, 0);
      expect(totalModels).toBe(11);

      // Group 1 models
      const g1 = CHATGPT_MODEL_GROUPS[0].models;
      expect(g1.map((m) => m.id)).toEqual([
        'gpt-5.6-terra',
        'gpt-5.6-luna',
        'gpt-5.6-sol',
        'o3-mini',
        'o1',
      ]);
      expect(g1.find((m) => m.id === 'gpt-5.6-terra')?.desc).toBe(
        'Mạnh nhất, phù hợp bài toán nhiều bước'
      );

      // Group 2 models
      const g2 = CHATGPT_MODEL_GROUPS[1].models;
      expect(g2.map((m) => m.id)).toEqual([
        'gpt-5.5',
        'gpt-5',
        'gpt-4o',
        'chatgpt-4o-latest',
      ]);

      // Group 3 models
      const g3 = CHATGPT_MODEL_GROUPS[2].models;
      expect(g3.map((m) => m.id)).toEqual(['gpt-4o-mini', 'o1-mini']);
      expect(g3.find((m) => m.id === 'o1-mini')?.desc).toBe(
        'Suy luận nhanh cho bài tập ngắn'
      );
    });

    it('syncs PROVIDER_MODELS.oauth_chatgpt with all 11 ChatGPT models', () => {
      expect(PROVIDER_MODELS.oauth_chatgpt).toHaveLength(11);
      expect(PROVIDER_MODELS.oauth_chatgpt[0]).toEqual({
        id: 'gpt-5.6-terra',
        name: 'GPT-5.6 Terra',
        tag: 'Mạnh nhất, phù hợp bài toán nhiều bước',
      });
    });

    it('includes GPT-5.6 and GPT-5 models in OPENAI_MODELS catalog', () => {
      const ids = OPENAI_MODELS.map((m) => m.id);
      expect(ids).toContain('gpt-5.6-terra');
      expect(ids).toContain('gpt-5.6-luna');
      expect(ids).toContain('gpt-5.6-sol');
      expect(ids).toContain('gpt-5.5');
      expect(ids).toContain('gpt-5');
    });

    it('supports calling askAi with gpt-5.6-terra', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Giải pháp từ GPT-5.6 Terra',
              },
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await askAi({
        apiKey: 'sk-test-key-5-6',
        model: 'gpt-5.6-terra',
        prompt: 'Giải hệ phương trình bậc 3',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"gpt-5.6-terra"'),
        })
      );
      expect(res.reply).toBe('Giải pháp từ GPT-5.6 Terra');
    });
  });
});
