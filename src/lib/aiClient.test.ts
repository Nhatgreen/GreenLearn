import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askAi } from './aiClient';

describe('aiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return simulated response gracefully when supabase is null or no session', async () => {
    const res = await askAi({
      provider: 'system',
      prompt: 'Giải thích định lý Pythagoras',
      context: 'Tam giác vuông',
    });

    expect(res.reply).toContain('ViTudy');
    expect(res.provider).toBe('system');
  });

  it('should call direct Gemini if BYOK and apiKey is supplied without session', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Định lý Pythagoras là a^2 + b^2 = c^2' }] } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await askAi({
      provider: 'byok_gemini',
      apiKey: 'test-gemini-key',
      prompt: 'Pythagoras là gì',
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(res.reply).toBe('Định lý Pythagoras là a^2 + b^2 = c^2');
  });
});
