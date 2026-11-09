'use client';

import React, { useState, useRef } from 'react';
import { DeskItem, ExamQuestion } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { normalizeNFC } from '@/utils/textNormalization';
import { 
  HelpCircle, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  RotateCcw, 
  Sparkles, 
  Maximize2, 
  Trash2, 
  Pencil,
  BookOpen
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';
import { MathRenderer } from '../common/MathRenderer';
import { ItemDrawingOverlay } from '../canvas/ItemDrawingOverlay';
import { ActivityService } from '@/services/ActivityService';

interface ExamQuizCardProps {
  item: DeskItem;
  isSelected: boolean;
}

// Pastel note colors matching sticky notes
const NOTE_PALETTE = [
  { bg: '#fef08a', border: '#fde047', accent: '#ca8a04', name: 'Vàng nắng' },
  { bg: '#fed7aa', border: '#fdba74', accent: '#ea580c', name: 'Cam nhạt' },
  { bg: '#bbf7d0', border: '#86efac', accent: '#16a34a', name: 'Xanh lá nhạt' },
  { bg: '#bae6fd', border: '#7dd3fc', accent: '#0284c7', name: 'Xanh dương nhạt' },
  { bg: '#fbcfe8', border: '#f472b6', accent: '#db2777', name: 'Hồng phấn' },
  { bg: '#ddd6fe', border: '#c4b5fd', accent: '#7c3aed', name: 'Tím nhạt' },
  { bg: '#ffffff', border: '#e2e8f0', accent: '#475569', name: 'Trắng' },
  { bg: '#e2e8f0', border: '#cbd5e1', accent: '#334155', name: 'Xám sáng' },
];

export function ExamQuizCardComponent({ item, isSelected }: ExamQuizCardProps) {
  const { 
    selectItem, 
    removeDeskItem,
    updateExamAnswer,
    gradeExam,
    resetExam,
    updateItemTitle,
    updateStickyNoteColor
  } = useStudySpace();

  const cardRef = useRef<HTMLDivElement>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Dimensions: Compact rectangular flashcard size
  const CARD_WIDTH = 380;
  const CARD_HEIGHT = 490;

  // Unified drag-and-move and continuous 360 rotation
  const { isDragging, handleMouseDown, handleRotateMouseDown, handleRotateDoubleClick } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  });

  const exam = item.examData || {
    questions: [],
    userAnswers: {},
    isGraded: false
  };

  const questions: ExamQuestion[] = exam.questions || [];
  const totalQuestions = questions.length;

  // Consistent pastel background color from note palette
  const cardColor = (() => {
    if (item.stickyColor) return item.stickyColor;
    const hash = Math.abs(item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
    return NOTE_PALETTE[hash % NOTE_PALETTE.length].bg;
  })();

  // Card view state: 'intro' (Cover) -> 'question' (Taking quiz) -> 'summary' (Scores & Review)
  const [view, setView] = useState<'intro' | 'question' | 'summary'>(
    exam.isGraded ? 'summary' : 'intro'
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [confirmedQuestions, setConfirmedQuestions] = useState<Record<string, boolean>>({});
  const [viewingFromSummary, setViewingFromSummary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 3D Flip animation state machine:
  // Phase 'idle' -> 'out' (0deg -> -90deg/90deg) -> snap opposite (90deg/-90deg) -> 'in' (-> 0deg) -> 'idle'
  const [flipState, setFlipState] = useState<{
    phase: 'idle' | 'out' | 'in';
    angle: number;
    withTransition: boolean;
  }>({
    phase: 'idle',
    angle: 0,
    withTransition: false
  });

  const cleanTitle = (item.title || '')
    .replace(/^Đề thi:\s*/i, '')
    .replace(/^Đề Thi:\s*/i, '')
    .replace(/^TỜ TÓM TẮT NHANH:\s*/i, '')
    .trim() || 'Bài tập trắc nghiệm';

  const [titleInput, setTitleInput] = useState(cleanTitle);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && updateItemTitle) {
      updateItemTitle(item.id, normalizeNFC(trimmed));
    }
    setIsEditingTitle(false);
  };

  // Perform clean 2-phase 3D flip transition without ghost box or mid-tilt content jump
  const triggerFlip = (direction: 'forward' | 'backward', callback: () => void) => {
    if (flipState.phase !== 'idle') return;

    const outAngle = direction === 'forward' ? -90 : 90;
    const inAngle = direction === 'forward' ? 90 : -90;

    // Phase 1: Turn out edge-on (accelerate to 90deg, 160ms)
    setFlipState({ phase: 'out', angle: outAngle, withTransition: true });

    setTimeout(() => {
      // Midpoint: card is perpendicular and invisible
      callback();
      // Snap instantly to opposite edge-on without transition
      setFlipState({ phase: 'in', angle: inAngle, withTransition: false });

      // Phase 2: Turn in from opposite edge-on to 0deg (decelerate into place, 180ms)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlipState({ phase: 'in', angle: 0, withTransition: true });

          setTimeout(() => {
            setFlipState({ phase: 'idle', angle: 0, withTransition: false });
          }, 190);
        });
      });
    }, 160);
  };

  // Start exam from Intro screen
  const handleStartExam = () => {
    triggerFlip('forward', () => {
      setView('question');
      setCurrentQuestionIndex(0);
      setViewingFromSummary(false);
    });
  };

  // Confirm current question answer
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const currentSelectedAnswer = currentQuestion ? exam.userAnswers[currentQuestion.id] : undefined;
  const isCurrentConfirmed = currentQuestion ? !!confirmedQuestions[currentQuestion.id] : false;

  const handleConfirmAnswer = () => {
    if (currentSelectedAnswer === undefined || !currentQuestion) return;
    setConfirmedQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: true
    }));
  };

  // Navigate to Next question or Complete
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      triggerFlip('forward', () => {
        setCurrentQuestionIndex(prev => prev + 1);
      });
    } else {
      // Completed all questions -> Flip to Summary
      gradeExam(item.id);
      if (questions.length > 0) {
        const correct = questions.filter(q => exam.userAnswers[q.id] === q.correctAnswer).length;
        const score = Math.round((correct / Math.max(1, totalQuestions)) * 100) / 10;
        ActivityService.submitExamAttempt({
          documentId: item.id,
          score,
          total: totalQuestions,
          correct
        }).catch(() => {});
      }
      triggerFlip('forward', () => {
        setView('summary');
        setViewingFromSummary(false);
      });
    }
  };

  // Direct question jump from bottom bar or summary grid
  const handleJumpToQuestion = (targetIdx: number, fromSummary = false) => {
    if (targetIdx < 0 || targetIdx >= totalQuestions) return;
    const direction = targetIdx >= currentQuestionIndex ? 'forward' : 'backward';
    triggerFlip(direction, () => {
      setView('question');
      setCurrentQuestionIndex(targetIdx);
      if (fromSummary) {
        setViewingFromSummary(true);
      }
    });
  };

  // Back to summary from reviewing question
  const handleBackToSummary = () => {
    triggerFlip('backward', () => {
      setView('summary');
      setViewingFromSummary(false);
    });
  };

  // Reset exam to start over
  const handleResetExam = () => {
    resetExam(item.id);
    setConfirmedQuestions({});
    triggerFlip('backward', () => {
      setView('intro');
      setCurrentQuestionIndex(0);
      setViewingFromSummary(false);
    });
  };

  // Calculate score statistics
  const correctCount = questions.reduce((acc, q) => {
    return acc + (exam.userAnswers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const score10Scale = totalQuestions > 0 ? (correctCount / totalQuestions * 10).toFixed(1) : '0';

  return (
    <div
      ref={cardRef}
      data-desk-item="true"
      data-exam-card="true"
      style={{
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: item.zIndex,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      }}
      className="absolute select-none group cursor-default"
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
    >
      {/* 3D Flip Perspective Container: only active during 3D flip to prevent font blurriness */}
      <div 
        style={{
          perspective: flipState.phase !== 'idle' ? '1200px' : undefined,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Card Shell with Pastel Note Background: drops 3D layer at idle for razor-sharp vector text */}
        <div
          style={{
            backgroundColor: cardColor,
            transform: flipState.phase !== 'idle' 
              ? `rotateY(${flipState.angle}deg) scale(0.96)` 
              : undefined,
            transition: flipState.withTransition
              ? flipState.phase === 'out'
                ? 'transform 0.16s cubic-bezier(0.4, 0, 0.7, 0.2)'
                : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.4, 1)'
              : undefined,
            transformStyle: flipState.phase !== 'idle' ? 'preserve-3d' : undefined,
            transformOrigin: 'center center',
            backfaceVisibility: flipState.phase !== 'idle' ? 'hidden' : undefined,
            WebkitBackfaceVisibility: flipState.phase !== 'idle' ? 'hidden' : undefined,
            textRendering: 'geometricPrecision',
            WebkitFontSmoothing: 'antialiased',
          }}
          className={`w-full h-full rounded-2xl flex flex-col justify-between border border-black/10 relative overflow-hidden font-sans text-slate-900 transition-shadow ${
            isSelected && flipState.phase === 'idle'
              ? 'shadow-2xl'
              : 'shadow-xl'
          }`}
        >
          {/* Drawing Ink Overlay permanently bound to card */}
          <ItemDrawingOverlay itemId={item.id} />

          {/* ========================================================= */}
          {/* SCREEN 1: BÌA BỘ ĐỀ TRẮC NGHIỆM ('intro')                 */}
          {/* ========================================================= */}
          {view === 'intro' && (
            <div className="flex-1 flex flex-col justify-between p-5 select-none">
              {/* Header: Drag handle & Editable Title */}
              <div 
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between border-b border-black/10 pb-2.5 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E0562D] flex-shrink-0 shadow-xs" />
                  {isEditingTitle ? (
                    <input
                      autoFocus
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') {
                          setTitleInput(cleanTitle);
                          setIsEditingTitle(false);
                        }
                      }}
                      className="text-xs font-black text-slate-900 bg-white/80 px-2 py-0.5 rounded-lg outline-none border border-slate-300 w-full"
                    />
                  ) : (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }}
                      title="Bấm để đổi tên bộ đề"
                      className="flex items-center gap-1.5 group/editTitle cursor-pointer truncate"
                    >
                      <span className="text-xs font-black text-slate-900 tracking-tight truncate group-hover/editTitle:text-[#E0562D]">
                        {cleanTitle}
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover/editTitle:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black/5 rounded-full text-slate-700">
                  Trắc nghiệm
                </span>
              </div>

              {/* Card Center: Title, Questions Count, Badge */}
              <div className="my-auto text-center px-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/90 border border-black/10 flex items-center justify-center mx-auto shadow-sm">
                  <HelpCircle className="w-7 h-7 text-[#E0562D] stroke-[2.4]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-3">
                    {cleanTitle}
                  </h3>
                  <p className="text-xs font-medium text-slate-700">
                    Bộ câu hỏi trắc nghiệm củng cố kiến thức trọng tâm
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-white/80 border border-black/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-2xs font-mono">
                  <span>Tổng số:</span>
                  <span className="text-[#E0562D] font-black">{totalQuestions} câu hỏi</span>
                  <span>•</span>
                  <span>{exam.timeLimitMinutes || 15} phút</span>
                </div>
              </div>

              {/* Card Bottom: Start Button in the Center */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleStartExam}
                  className="w-full max-w-[240px] mx-auto py-2.5 px-6 bg-[#E0562D] hover:bg-[#c9451e] active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu làm bài</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 2: MÀN HÌNH LÀM BÀI / XEM CÂU HỎI ('question')     */}
          {/* ========================================================= */}
          {view === 'question' && currentQuestion && (
            <div className="flex-1 flex flex-col justify-between select-none overflow-hidden">
              {/* Question Header */}
              <div 
                onMouseDown={handleMouseDown}
                className="px-4 pt-3 pb-2 border-b border-black/10 flex items-center justify-between cursor-grab active:cursor-grabbing bg-black/[0.02]"
              >
                {viewingFromSummary ? (
                  <button
                    type="button"
                    onClick={handleBackToSummary}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#E0562D] bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-black/10 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Quay lại tổng kết</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 bg-white/80 px-2.5 py-1 rounded-lg border border-black/10 shadow-2xs font-mono">
                      Câu {currentQuestionIndex + 1} / {totalQuestions}
                    </span>
                  </div>
                )}

                <span className="text-[10px] font-bold text-slate-600 font-mono">
                  {cleanTitle.slice(0, 22)}{cleanTitle.length > 22 ? '...' : ''}
                </span>
              </div>

              {/* Question Body: Prompt & Options */}
              <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2.5 no-scrollbar">
                {/* Question Prompt (Math KaTeX supported) */}
                <div className="bg-white/85 p-3 rounded-xl border border-black/10 text-xs font-bold text-slate-900 leading-snug shadow-2xs">
                  <MathRenderer content={currentQuestion.question} />
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isChosen = currentSelectedAnswer === oIdx;
                    const isCorrect = oIdx === currentQuestion.correctAnswer;
                    const isConfirmed = isCurrentConfirmed || exam.isGraded;

                    let btnStyle = 'bg-white/80 hover:bg-white border-black/10 text-slate-800';
                    let badgeStyle = 'bg-black/5 text-slate-700 border-black/10';

                    if (isConfirmed) {
                      if (isCorrect) {
                        btnStyle = 'bg-[#ECFDF5] border-[#15803D] text-[#15803D] font-bold shadow-xs';
                        badgeStyle = 'bg-[#15803D] text-white border-[#15803D]';
                      } else if (isChosen && !isCorrect) {
                        btnStyle = 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] font-bold shadow-xs';
                        badgeStyle = 'bg-[#DC2626] text-white border-[#DC2626]';
                      }
                    } else if (isChosen) {
                      btnStyle = 'bg-white border-[#E0562D] text-slate-900 font-bold ring-2 ring-[#E0562D]/30 shadow-xs';
                      badgeStyle = 'bg-[#E0562D] text-white border-[#E0562D]';
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={isConfirmed}
                        onClick={() => updateExamAnswer(item.id, currentQuestion.id, oIdx)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10.5px] font-bold flex-shrink-0 font-mono ${badgeStyle}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1 truncate leading-snug">
                            <MathRenderer content={opt} />
                          </span>
                        </div>

                        {/* Status Icon */}
                        {isConfirmed && isCorrect && (
                          <span className="text-[10.5px] font-black text-[#15803D] bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>ĐÚNG</span>
                          </span>
                        )}
                        {isConfirmed && isChosen && !isCorrect && (
                          <span className="text-[10.5px] font-black text-[#DC2626] bg-rose-100/80 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                            <X className="w-3 h-3 stroke-[3]" />
                            <span>SAI</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box when confirmed */}
                {(isCurrentConfirmed || exam.isGraded) && currentQuestion.explanation && (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-black/10 text-[11px] text-slate-700 leading-relaxed shadow-2xs animate-fade-in">
                    <span className="font-bold text-[#E0562D] mr-1">Giải thích:</span>
                    <span>{currentQuestion.explanation}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="px-4 py-2 flex items-center justify-between gap-2 bg-black/[0.02]">
                <div className="text-[11px] text-slate-600 font-medium">
                  {currentSelectedAnswer === undefined ? (
                    <span>Chọn 1 đáp án để xác nhận</span>
                  ) : !isCurrentConfirmed ? (
                    <span>Đã chọn đáp án {String.fromCharCode(65 + currentSelectedAnswer)}</span>
                  ) : currentSelectedAnswer === currentQuestion.correctAnswer ? (
                    <span className="text-[#15803D] font-bold">Chính xác!</span>
                  ) : (
                    <span className="text-[#DC2626] font-bold">Chưa chính xác</span>
                  )}
                </div>

                <div>
                  {!isCurrentConfirmed && !exam.isGraded ? (
                    <button
                      type="button"
                      disabled={currentSelectedAnswer === undefined}
                      onClick={handleConfirmAnswer}
                      className="px-4 py-1.5 bg-[#E0562D] hover:bg-[#c9451e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      Xác nhận
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-4 py-1.5 bg-[#E0562D] hover:bg-[#c9451e] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <span>{currentQuestionIndex < totalQuestions - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Navigation Strip (List ngang các ô sát mép đáy) */}
              <div className="border-t border-black/10 px-2 py-1.5 bg-black/[0.04] flex items-center justify-between gap-1 w-full overflow-hidden select-none">
                {/* Nút lùi câu hỏi */}
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => handleJumpToQuestion(currentQuestionIndex - 1)}
                  title="Câu trước"
                  className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed border border-black/10 flex items-center justify-center text-slate-800 transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Dải các ô số câu hỏi */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar justify-center flex-1 px-1">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = exam.userAnswers[q.id] !== undefined;
                    const isConfirmed = !!confirmedQuestions[q.id] || exam.isGraded;
                    const isCorrect = isAnswered && exam.userAnswers[q.id] === q.correctAnswer;

                    let cellStyle = 'bg-white text-slate-800 border-black/10';

                    if (isCurrent) {
                      // Ô hiện tại: tô xám như lúc chọn công cụ
                      cellStyle = 'bg-slate-300 text-slate-900 font-black border-slate-400 ring-1 ring-slate-400 shadow-xs';
                    } else if (isConfirmed) {
                      if (isCorrect) {
                        cellStyle = 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-2xs';
                      } else {
                        cellStyle = 'bg-rose-600 text-white font-bold border-rose-700 shadow-2xs';
                      }
                    } else if (isAnswered) {
                      cellStyle = 'bg-orange-100 text-[#E0562D] font-bold border-orange-300';
                    }

                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => handleJumpToQuestion(idx)}
                        className={`w-6 h-6 rounded-md text-[10.5px] border flex items-center justify-center transition-all cursor-pointer font-mono flex-shrink-0 ${cellStyle}`}
                        title={`Câu ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Nút tới câu hỏi */}
                <button
                  type="button"
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  onClick={() => handleJumpToQuestion(currentQuestionIndex + 1)}
                  title="Câu sau"
                  className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed border border-black/10 flex items-center justify-center text-slate-800 transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN 3: MÀN HÌNH TỔNG KẾT ĐIỂM ('summary')               */}
          {/* ========================================================= */}
          {view === 'summary' && (
            <div className="flex-1 flex flex-col justify-between p-4 select-none overflow-hidden">
              {/* Header */}
              <div 
                onMouseDown={handleMouseDown}
                className="border-b border-black/10 pb-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#E0562D]" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Kết Quả Luyện Tập
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {totalQuestions} câu hỏi
                </span>
              </div>

              {/* Top Center: Prominent Big Score */}
              <div className="text-center py-2 space-y-1">
                <div className="text-4xl font-black font-mono text-[#E0562D] tracking-tight">
                  {score10Scale} <span className="text-lg font-bold text-slate-700">/ 10</span>
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {scorePercent >= 80 ? 'Xuất sắc! Nắm vững kiến thức.' : scorePercent >= 50 ? 'Khá tốt! Hãy ôn lại các câu sai.' : 'Cần rèn luyện thêm!'}
                </div>
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600 font-mono">
                  <span className="text-[#15803D] font-bold">✓ {correctCount} đúng</span>
                  <span>•</span>
                  <span className="text-[#DC2626] font-bold">✕ {totalQuestions - correctCount} sai</span>
                  <span>•</span>
                  <span>{scorePercent}%</span>
                </div>
              </div>

              {/* Bottom Section: Question Answer Grid */}
              <div className="bg-white/85 p-3 rounded-xl border border-black/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Bảng câu trả lời:</span>
                  <span className="text-[10px] font-normal text-slate-500">Bấm ô để xem lại chi tiết</span>
                </div>

                {/* Grid of question number buttons */}
                <div className="grid grid-cols-5 gap-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                  {questions.map((q, idx) => {
                    const isCorrect = exam.userAnswers[q.id] === q.correctAnswer;

                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => handleJumpToQuestion(idx, true)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-bold font-mono transition-all flex items-center justify-between cursor-pointer hover:scale-105 shadow-2xs ${
                          isCorrect
                            ? 'bg-[#ECFDF5] border-[#15803D] text-[#15803D]'
                            : 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
                        }`}
                        title={`Câu ${idx + 1}: ${isCorrect ? 'Đúng' : 'Sai'} (Bấm để xem lại)`}
                      >
                        <span>{idx + 1}</span>
                        {isCorrect ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <X className="w-3 h-3 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Reset Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResetExam}
                  className="w-full py-2 bg-slate-900 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white stroke-[2.4]" />
                  <span>Làm lại bộ đề này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Toolbar on Hover / Selection (White Miro-style, hidden during 3D flip) */}
      <div 
        className={`absolute ${item.y < 80 ? 'top-full mt-3' : '-top-11'} left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-slate-700 px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur-md transition-opacity duration-150 z-30 ${
          isSelected && flipState.phase === 'idle'
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color Palette Selector matching Sticky Note */}
        <div className="relative flex items-center pr-1 border-r border-slate-200">
          <button
            title="Đổi màu nền thẻ trắc nghiệm"
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            style={{ backgroundColor: cardColor }}
            className="w-5 h-5 rounded-full border-2 border-white shadow-xs ring-1 ring-black/20 hover:scale-115 transition-transform cursor-pointer flex items-center justify-center flex-shrink-0"
          />

          {isColorPickerOpen && (
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 grid grid-cols-4 gap-1.5 z-50 animate-fade-in w-40"
              onClick={(e) => e.stopPropagation()}
            >
              {NOTE_PALETTE.map((c) => {
                const isCur = cardColor.toLowerCase() === c.bg.toLowerCase();
                return (
                  <button
                    key={c.bg}
                    title={c.name}
                    onClick={() => {
                      updateStickyNoteColor?.(item.id, c.bg);
                      setIsColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: c.bg }}
                    className="w-7 h-7 rounded-full border border-black/10 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer shadow-2xs relative"
                  >
                    {isCur && (
                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nút Xoay 360 */}
        <button
          title="Kéo để xoay thẻ trắc nghiệm 360°, nhấn đúp căn thẳng 0°"
          onMouseDown={handleRotateMouseDown}
          onDoubleClick={handleRotateDoubleClick}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-grab active:cursor-grabbing"
        >
          <RotateTwoWay className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Nút Xóa khỏi bàn học */}
        <button
          title="Xóa bộ trắc nghiệm khỏi bàn học"
          onClick={() => removeDeskItem(item.id)}
          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const ExamQuizCard = React.memo(ExamQuizCardComponent);
