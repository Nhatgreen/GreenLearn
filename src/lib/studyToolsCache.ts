/**
 * Bộ nhớ đệm toàn cục cho các công cụ học tập STudy (Summary, Quiz, Flashcards, Roadmap).
 * Ngăn chặn việc mất sạch kết quả AI, câu hỏi trắc nghiệm và đáp án đang làm dở
 * khi người học chuyển tab hoặc đóng/mở lại buồng lái học tập.
 */

export interface StudyToolsDocCache {
  summary?: {
    resultText: string;
    useAi: boolean;
  };
  quiz?: {
    questions: any[];
    userAnswers: Record<number, number>;
    showResults: boolean;
    questionCount?: 3 | 5 | 10;
    difficulty?: 'easy' | 'medium' | 'hard';
    scope?: 'current_page' | 'all_pages';
  };
  flashcards?: {
    cards: Array<{ front: string; back: string }>;
  };
  lastActiveTab?: string;
  updatedAt?: number;
}

const memoryCache = new Map<string, StudyToolsDocCache>();

/**
 * Lấy dữ liệu cache theo mã định danh tài liệu (docId hoặc docTitle)
 */
export function getStudyToolsCache(docKey: string): StudyToolsDocCache | undefined {
  if (!docKey) return undefined;
  return memoryCache.get(docKey);
}

/**
 * Cập nhật một phần dữ liệu cache cho tài liệu
 */
export function updateStudyToolsCache(docKey: string, partial: Partial<StudyToolsDocCache>): void {
  if (!docKey) return;
  const current = memoryCache.get(docKey) || {};
  memoryCache.set(docKey, {
    ...current,
    ...partial,
    updatedAt: Date.now()
  });
}

/**
 * Xóa cache của một tài liệu hoặc toàn bộ cache
 */
export function clearStudyToolsCache(docKey?: string): void {
  if (docKey) {
    memoryCache.delete(docKey);
  } else {
    memoryCache.clear();
  }
}
