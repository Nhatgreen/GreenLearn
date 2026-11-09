import { getSupabase } from '@/lib/supabase';
import { calculateNextReview, ReviewQuality, SM2Card } from '@/lib/sm2';

export interface FlashcardReview {
  id: string;
  userId: string;
  documentId?: string;
  cardHash: string;
  front: string;
  back: string;
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt: string | null;
}

export function generateCardHash(front: string, back: string): string {
  const combined = `${front.trim()}::${back.trim()}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

export class FlashcardService {
  static async getCardsForReview(userId: string): Promise<FlashcardReview[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', todayStr)
        .order('next_review_date', { ascending: true });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        documentId: row.document_id,
        cardHash: row.card_hash,
        front: row.front,
        back: row.back,
        easinessFactor: row.easiness_factor,
        intervalDays: row.interval_days,
        repetitions: row.repetitions,
        nextReviewDate: row.next_review_date,
        lastReviewedAt: row.last_reviewed_at,
      }));
    } catch {
      return [];
    }
  }

  static async submitReview(
    userId: string,
    card: { front: string; back: string; documentId?: string },
    quality: ReviewQuality
  ): Promise<SM2Card> {
    const hash = generateCardHash(card.front, card.back);
    const supabase = getSupabase();

    let currentCard: SM2Card = {
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
    };

    if (supabase) {
      const { data } = await supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('card_hash', hash)
        .maybeSingle();

      if (data) {
        currentCard = {
          easinessFactor: data.easiness_factor,
          interval: data.interval_days,
          repetitions: data.repetitions,
          nextReviewDate: data.next_review_date,
        };
      }
    }

    const nextSM2 = calculateNextReview(quality, currentCard);

    if (supabase) {
      await supabase.from('flashcard_reviews').upsert(
        {
          user_id: userId,
          document_id: card.documentId || null,
          card_hash: hash,
          front: card.front,
          back: card.back,
          easiness_factor: nextSM2.easinessFactor,
          interval_days: nextSM2.interval,
          repetitions: nextSM2.repetitions,
          next_review_date: nextSM2.nextReviewDate,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,card_hash' }
      );
    }

    return nextSM2;
  }
}
