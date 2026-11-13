import { describe, it, expect, beforeEach } from 'vitest';
import { getStudyToolsCache, updateStudyToolsCache, clearStudyToolsCache } from './studyToolsCache';

describe('studyToolsCache', () => {
  beforeEach(() => {
    clearStudyToolsCache();
  });

  it('stores and retrieves AI summary cache', () => {
    const docKey = 'Giao Trinh Giai Tich 1';
    updateStudyToolsCache(docKey, {
      summary: {
        resultText: '- Định lý Lagrange\n- Định lý Cauchy',
        useAi: true,
      },
    });

    const cached = getStudyToolsCache(docKey);
    expect(cached).toBeDefined();
    expect(cached?.summary?.resultText).toContain('Lagrange');
    expect(cached?.summary?.useAi).toBe(true);
  });

  it('stores and retrieves Quiz questions and answers', () => {
    const docKey = 'doc-123';
    updateStudyToolsCache(docKey, {
      quiz: {
        questions: [{ id: 'q1', question: '1+1=?', options: ['1', '2', '3', '4'], correctIndex: 1, explanation: 'Toán' }],
        userAnswers: { 0: 1 },
        showResults: true,
        questionCount: 5,
        difficulty: 'medium',
      },
    });

    const cached = getStudyToolsCache(docKey);
    expect(cached?.quiz?.questions.length).toBe(1);
    expect(cached?.quiz?.userAnswers[0]).toBe(1);
    expect(cached?.quiz?.showResults).toBe(true);
  });

  it('preserves other tools data on partial update', () => {
    const docKey = 'doc-456';
    updateStudyToolsCache(docKey, {
      summary: { resultText: 'Tóm tắt bài học', useAi: false },
    });

    updateStudyToolsCache(docKey, {
      flashcards: { cards: [{ front: 'A', back: 'B' }] },
    });

    const cached = getStudyToolsCache(docKey);
    expect(cached?.summary?.resultText).toBe('Tóm tắt bài học');
    expect(cached?.flashcards?.cards.length).toBe(1);
  });
});
