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
});
