'use client';

import React, { useState, useEffect } from 'react';
import { generateFlashcardsFromRules, Flashcard } from '@/lib/nonAiEngine';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useAuth } from '@/hooks/useAuth';
import { FlashcardService } from '@/services/FlashcardService';
import { ReviewQuality } from '@/lib/sm2';
import { 
  Layers, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  StickyNote,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

interface FlashcardTabProps {
  fullText: string;
  documentTitle: string;
}

export function FlashcardTab({ fullText, documentTitle }: FlashcardTabProps) {
  const { addStickyNote } = useStudySpace();
  const { user } = useAuth();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sm2Notice, setSm2Notice] = useState<string | null>(null);

  const handleGenerateFlashcards = () => {
    if (!fullText) return;
    const cards = generateFlashcardsFromRules(fullText, 8);
    setFlashcards(cards);
    setCurrentIdx(0);
    setIsFlipped(false);
    setSm2Notice(null);
  };

  const handleLoadDueCards = async () => {
    if (!user?.id) return;
    const dueReviews = await FlashcardService.getCardsForReview(user.id);
    if (dueReviews.length > 0) {
      setFlashcards(dueReviews.map((r) => ({ id: r.id, front: r.front, back: r.back })));
      setCurrentIdx(0);
      setIsFlipped(false);
      setSm2Notice(`Đã nạp ${dueReviews.length} thẻ đến hạn ôn tập hôm nay`);
    } else {
      setSm2Notice('Không có thẻ nào đến hạn ôn tập hôm nay');
    }
  };

  const handleRateCard = async (quality: ReviewQuality) => {
    if (!currentCard || !user?.id) {
      handleNext();
      return;
    }
    const result = await FlashcardService.submitReview(
      user.id,
      { front: currentCard.front, back: currentCard.back },
      quality
    );
    setSm2Notice(`Lịch ôn tiếp: ${result.interval} ngày nữa (${result.nextReviewDate})`);
    setTimeout(() => {
      setSm2Notice(null);
      handleNext();
    }, 800);
  };

  const handleNext = () => {
    if (currentIdx < flashcards.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleExportCardToDesk = () => {
    if (flashcards.length === 0) return;
    const card = flashcards[currentIdx];
    addStickyNote(`[FLASHCARD: ${documentTitle}]\n\nThuật ngữ: ${card.front}\n\nÝ nghĩa: ${card.back}`, 480, 260);
  };

  const currentCard = flashcards[currentIdx];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar font-sans text-slate-900 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Thẻ Ghi Nhớ Lặp Lại Ngắt Quãng (Spaced Repetition)</h4>
          <p className="text-xs text-slate-500">
            Tự động phát hiện các cấu trúc định nghĩa "là", "gồm có", "tập trung vào" để tạo thẻ ôn tập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={handleLoadDueCards}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Ôn tập hôm nay</span>
            </button>
          )}

          <button
            onClick={handleGenerateFlashcards}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            {flashcards.length > 0 ? 'Tạo Lại Thẻ' : 'Trích Xuất Flashcards'}
          </button>
        </div>
      </div>

      {sm2Notice && (
        <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-[#166534] font-semibold text-center animate-fade-in">
          {sm2Notice}
        </div>
      )}

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {currentCard ? (
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Card Frame */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-56 bg-white border-2 border-slate-300 hover:border-slate-800 rounded-2xl p-6 shadow-md cursor-pointer flex flex-col justify-between transition-all select-none relative group"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="font-bold text-slate-600 uppercase">
                  {isFlipped ? 'Mặt Sau (Định Nghĩa / Giải Thích)' : 'Mặt Trước (Thuật Ngữ)'}
                </span>
                <span className="flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                  <RotateCw className="w-3 h-3" /> Lật thẻ
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center text-center px-4">
                <p className={`text-slate-900 leading-relaxed font-sans ${isFlipped ? 'text-sm' : 'text-base font-bold'}`}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-mono">
                Thẻ {currentIdx + 1} trên {flashcards.length}
              </div>
            </div>

            {/* SM-2 Spaced Repetition Rating Buttons */}
            {isFlipped && (
              <div className="w-full mt-4 flex items-center justify-center gap-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleRateCard(1)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
                  title="Không nhớ / Lặp lại ngay"
                >
                  Quên (1 ngày)
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard(3)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-800 cursor-pointer transition-colors shadow-2xs"
                  title="Nhớ nhưng khó khăn"
                >
                  Khó
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard(4)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 cursor-pointer transition-colors shadow-2xs"
                  title="Nhớ tốt"
                >
                  Tốt
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard(5)}
                  className="flex-1 py-1.5 px-2 rounded-xl border border-green-300 bg-[#F0FDF4] hover:bg-green-100 text-[11px] font-bold text-[#16A34A] cursor-pointer transition-colors shadow-2xs"
                  title="Nhớ hoàn hảo"
                >
                  Dễ
                </button>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="p-2 rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>

              <span className="text-xs font-mono font-semibold text-slate-700">
                {currentIdx + 1} / {flashcards.length}
              </span>

              <button
                onClick={handleNext}
                disabled={currentIdx === flashcards.length - 1}
                className="p-2 rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Layers className="w-8 h-8 mb-2 text-slate-300" />
            <span>Nhấn "Trích Xuất Flashcards" để tạo bộ thẻ ghi nhớ thông minh</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {currentCard && (
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleExportCardToDesk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
            <span>Ghim Thẻ Này Lên Bàn Học</span>
          </button>

          <span className="text-[11px] text-slate-400 italic">
            Nhấp trực tiếp vào thẻ hoặc nhấn nút Lật để xem đáp án
          </span>
        </div>
      )}
    </div>
  );
}
