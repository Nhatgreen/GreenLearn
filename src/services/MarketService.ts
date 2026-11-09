import { getSupabase } from '@/lib/supabase';
import { MarketItem, INITIAL_MARKET_ITEMS } from '@/data/marketMockData';

export interface ListingReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export class MarketService {
  static async getListings(filters?: {
    category?: string;
    type?: 'all' | 'book' | 'paper' | 'exam';
    minScore?: number;
    maxPrice?: number;
    search?: string;
    sort?: 'newest' | 'oldest' | 'score' | 'price_asc' | 'price_desc';
  }): Promise<MarketItem[]> {
    const supabase = getSupabase();
    let items: MarketItem[] = [...INITIAL_MARKET_ITEMS];

    if (supabase) {
      try {
        let query = supabase
          .from('know_inherit_listings')
          .select('*')
          .eq('status', 'published');

        if (filters?.category && filters.category !== 'all') {
          query = query.eq('tier', filters.category.toUpperCase());
        }

        if (filters?.type && filters.type !== 'all') {
          query = query.eq('item_type', filters.type);
        }

        if (filters?.search) {
          const safeSearch = filters.search.replace(/[%_]/g, '');
          query = query.or(`title.ilike.%${safeSearch}%,summary.ilike.%${safeSearch}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          // Merge database listings with mock listings
          const dbItems: MarketItem[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            author: d.author_name || 'Tác giả',
            aiScore: d.ai_score || 90,
            price: d.price || 15,
            type: d.item_type || 'book',
            category: d.tier?.toLowerCase() || 'ai_ml',
            date: new Date(d.created_at).toLocaleDateString('vi-VN'),
            summary: d.summary || '',
            previewText: d.preview_content || d.summary || '',
            pageCount: d.page_count || 1,
            downloadsCount: d.downloads_count || 0,
            isAuthorVerified: true,
            updatedDate: new Date(d.created_at).toLocaleDateString('vi-VN'),
          }));
          items = [...dbItems, ...INITIAL_MARKET_ITEMS];
        }
      } catch {}
    }

    // Apply in-memory search and filter for fallback consistency
    if (filters?.category && filters.category !== 'all') {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters?.type && filters.type !== 'all') {
      items = items.filter((item) => item.type === filters.type);
    }

    if (filters?.minScore && filters.minScore > 0) {
      items = items.filter((item) => item.aiScore >= filters.minScore!);
    }

    if (filters?.maxPrice && filters.maxPrice > 0) {
      items = items.filter((item) => item.price <= filters.maxPrice!);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filters?.sort === 'score') {
      items.sort((a, b) => b.aiScore - a.aiScore);
    } else if (filters?.sort === 'oldest') {
      items.sort((a, b) => {
        const partsA = a.date.split('/');
        const partsB = b.date.split('/');
        const timeA = partsA.length === 3 ? new Date(Number(partsA[2]), Number(partsA[1]) - 1, Number(partsA[0])).getTime() : 0;
        const timeB = partsB.length === 3 ? new Date(Number(partsB[2]), Number(partsB[1]) - 1, Number(partsB[0])).getTime() : 0;
        return timeA - timeB;
      });
    } else if (filters?.sort === 'price_asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (filters?.sort === 'price_desc') {
      items.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      items.sort((a, b) => {
        const partsA = a.date.split('/');
        const partsB = b.date.split('/');
        const timeA = partsA.length === 3 ? new Date(Number(partsA[2]), Number(partsA[1]) - 1, Number(partsA[0])).getTime() : 0;
        const timeB = partsB.length === 3 ? new Date(Number(partsB[2]), Number(partsB[1]) - 1, Number(partsB[0])).getTime() : 0;
        return timeB - timeA;
      });
    }

    return items;
  }

  static async getPreview(listingId: string, userId?: string): Promise<{
    previewContent: string;
    totalPages: number;
    isOwned: boolean;
  }> {
    const supabase = getSupabase();
    let isOwned = false;

    if (supabase && userId) {
      try {
        const { data } = await supabase
          .from('know_inherit_purchases')
          .select('id')
          .eq('listing_id', listingId)
          .eq('buyer_id', userId)
          .maybeSingle();

        if (data) isOwned = true;
      } catch {}
    }

    const item = INITIAL_MARKET_ITEMS.find((i) => i.id === listingId);
    return {
      previewContent: item?.previewText || item?.summary || 'Nội dung xem trước bản quyền.',
      totalPages: item?.pages?.length || 1,
      isOwned,
    };
  }

  static async getReviews(listingId: string): Promise<ListingReview[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('listing_reviews')
        .select(`
          id,
          reviewer_id,
          rating,
          comment,
          created_at,
          profiles:reviewer_id (display_name, avatar_url)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        reviewerId: d.reviewer_id,
        reviewerName: d.profiles?.display_name || 'Người học',
        reviewerAvatar: d.profiles?.avatar_url || null,
        rating: d.rating,
        comment: d.comment || '',
        createdAt: d.created_at,
      }));
    } catch {
      return [];
    }
  }

  static async submitReview(listingId: string, rating: number, comment: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.from('listing_reviews').insert({
      listing_id: listingId,
      rating,
      comment: comment.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}
