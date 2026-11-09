import { describe, it, expect } from 'vitest';
import { calculateNextReview, SM2Card } from './sm2';

describe('SM-2 Algorithm', () => {
  const baseCard: SM2Card = {
    easinessFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: '2026-11-08',
  };

  it('increases repetitions and sets interval to 1 on first successful review (quality 5)', () => {
    const next = calculateNextReview(5, baseCard, new Date('2026-11-08'));
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.easinessFactor).toBeGreaterThanOrEqual(2.5);
    expect(next.nextReviewDate).toBe('2026-11-09');
  });

  it('sets interval to 6 on second successful review', () => {
    const cardRep1: SM2Card = {
      easinessFactor: 2.6,
      interval: 1,
      repetitions: 1,
      nextReviewDate: '2026-11-09',
    };
    const next = calculateNextReview(4, cardRep1, new Date('2026-11-09'));
    expect(next.repetitions).toBe(2);
    expect(next.interval).toBe(6);
    expect(next.nextReviewDate).toBe('2026-11-15');
  });

  it('multiplies interval by EF on third successful review', () => {
    const cardRep2: SM2Card = {
      easinessFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReviewDate: '2026-11-15',
    };
    const next = calculateNextReview(5, cardRep2, new Date('2026-11-15'));
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(15); // 6 * 2.5 = 15
  });

  it('resets repetitions to 0 and interval to 1 on failed review (quality < 3)', () => {
    const matureCard: SM2Card = {
      easinessFactor: 2.5,
      interval: 30,
      repetitions: 5,
      nextReviewDate: '2026-11-08',
    };
    const failed = calculateNextReview(1, matureCard, new Date('2026-11-08'));
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);
    expect(failed.nextReviewDate).toBe('2026-11-09');
  });

  it('clamps easinessFactor to minimum 1.3 even after multiple consecutive fails', () => {
    let card: SM2Card = { ...baseCard, easinessFactor: 1.35 };
    for (let i = 0; i < 5; i++) {
      card = calculateNextReview(0, card, new Date('2026-11-08'));
    }
    expect(card.easinessFactor).toBe(1.3);
    expect(card.interval).toBe(1);
  });
});
