import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askAi, testAiConnection } from './aiClient';
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
});
