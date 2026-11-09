import { StickerPickerItem } from '@/data/stickersAndEmojis';

const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

interface GiphyImageVariant {
  url: string;
  width: string;
  height: string;
}

interface GiphyApiItem {
  id: string;
  title: string;
  images: {
    original?: GiphyImageVariant;
    downsized_medium?: GiphyImageVariant;
    fixed_height?: GiphyImageVariant;
    fixed_height_small?: GiphyImageVariant;
  };
}

export class GiphyService {
  /**
   * Search GIFs live from GIPHY
   */
  static async search(query: string, limit = 24): Promise<StickerPickerItem[]> {
    if (!query || !query.trim()) {
      return this.trending(limit);
    }

    try {
      const url = `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
        query.trim()
      )}&limit=${limit}&rating=g&lang=vi`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`GIPHY API HTTP ${res.status}`);
      }
      const data = await res.json();
      return this.mapGiphyResults(data.data || []);
    } catch (err) {
      console.warn('Giphy search error:', err);
      return [];
    }
  }

  /**
   * Fetch Trending GIFs from GIPHY
   */
  static async trending(limit = 24): Promise<StickerPickerItem[]> {
    try {
      const url = `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`GIPHY API HTTP ${res.status}`);
      }
      const data = await res.json();
      return this.mapGiphyResults(data.data || []);
    } catch (err) {
      console.warn('Giphy trending error:', err);
      return [];
    }
  }

  private static mapGiphyResults(items: GiphyApiItem[]): StickerPickerItem[] {
    return items.map((item) => {
      const original = item.images.original;
      const downsizedLarge = (item.images as any).downsized_large;
      const medium = item.images.downsized_medium;
      const preview = item.images.fixed_height;

      // Prefer high-definition original URL for crisp rendering on desk
      const highResUrl = original?.url || downsizedLarge?.url || medium?.url || preview?.url || '';

      const w = Number(original?.width) || 320;
      const h = Number(original?.height) || 240;
      const ratio = w / (h || 1);

      const targetW = 320;
      const targetH = Math.max(140, Math.min(420, Math.round(targetW / ratio)));

      return {
        id: `giphy-${item.id}`,
        name: item.title?.replace(/GIF.*$/i, '').trim() || 'GIPHY Animation',
        type: 'gif',
        content: '',
        url: highResUrl,
        width: targetW,
        height: targetH,
      };
    });
  }
}
