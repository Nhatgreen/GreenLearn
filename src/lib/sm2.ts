export interface SM2Card {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Thuật toán lặp lại ngắt quãng SuperMemo SM-2 chuẩn
 * @param quality Đánh giá mức độ nhớ từ 0 (quên sạch) đến 5 (nhớ hoàn hảo)
 * @param card Trạng thái thẻ hiện tại
 * @param currentDate Ngày đánh giá (mặc định hôm nay)
 */
export function calculateNextReview(
  quality: ReviewQuality,
  card: SM2Card,
  currentDate = new Date()
): SM2Card {
  let repetitions = card.repetitions;
  let interval = card.interval;
  let easinessFactor = card.easinessFactor;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Trả lời sai/không nhớ: reset chuỗi lặp
    repetitions = 0;
    interval = 1;
  }

  // Cập nhật hệ số dễ nhớ (Easiness Factor)
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Giới hạn an toàn: EF tối thiểu 1.3, interval tối thiểu 1 ngày
  easinessFactor = Math.max(1.3, Math.round(easinessFactor * 100) / 100);
  interval = Math.max(1, interval);

  // Tính ngày ôn tập kế tiếp
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}
