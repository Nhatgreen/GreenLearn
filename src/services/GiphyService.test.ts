import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GiphyService } from './GiphyService';

describe('GiphyService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps GIPHY API items to StickerPickerItem format with proper dimensions', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'test12345',
          title: 'Happy Dance GIF by Studio',
          images: {
            original: {
              url: 'https://media.giphy.com/media/test12345/giphy.gif',
              width: '480',
              height: '360',
            },
            downsized_medium: {
              url: 'https://media.giphy.com/media/test12345/giphy-downsized.gif',
              width: '400',
              height: '300',
            },
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    const results = await GiphyService.search('dance', 10);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('giphy-test12345');
    expect(results[0].type).toBe('gif');
    expect(results[0].name).toBe('Happy Dance');
    expect(results[0].url).toBe('https://media.giphy.com/media/test12345/giphy.gif');
    expect(results[0].width).toBe(320);
    expect(results[0].height).toBe(240); // 320 / (480 / 360) = 240
  });

  it('handles fetch errors without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const results = await GiphyService.search('fail');
    expect(results).toEqual([]);
  });
});
