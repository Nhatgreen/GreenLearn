'use client';

import React, { useState, useRef } from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { askAi } from '@/lib/aiClient';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { normalizeNFC } from '@/utils/textNormalization';
import { 
  Trash2, 
  Sparkles, 
  Award, 
  Clock,
  Maximize2,
  RotateCcw,
  Lightbulb,
  X,
  Send,
  Pencil,
  Layers,
  FileText,
  HelpCircle,
  BookOpen,
  BookmarkPlus
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';
import { MathRenderer } from '../common/MathRenderer';
import { SummaryTab } from '../modals/study-tools/SummaryTab';
import { QuizTab } from '../modals/study-tools/QuizTab';
import { FullScreenDocModal } from '../modals/FullScreenDocModal';
import { ActivityService } from '@/services/ActivityService';
import { ItemDrawingOverlay } from '../canvas/ItemDrawingOverlay';
import { generateFlashcardsFromRules } from '@/lib/nonAiEngine';
import { ExamQuizCard } from './ExamQuizCard';

interface PaperSheetProps {
  item: DeskItem;
  isSelected: boolean;
}

export function PaperSheetComponent({ item, isSelected }: PaperSheetProps) {
  if (item.isExamSheet && item.examData) {
    return <ExamQuizCard item={item} isSelected={isSelected} />;
  }

  const { 
    selectItem, 
    removeDeskItem,
    activeSpace,
    combineIntoBinder,
    updateExamAnswer,
    gradeExam,
    resetExam,
    updateItemTitle,
    addStickyNote,
    focusedItemId,
    enterFocusMode,
    exitFocusMode
  } = useStudySpace();

  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [paperStudyTab, setPaperStudyTab] = useState<'summary' | 'quiz'>('summary');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const isFocusReading = focusedItemId === item.id;

  // Focus Reading Mode: Automatically centers and scales paper smoothly
  const handleFocusRead = () => {
    if (isFocusReading) {
      exitFocusMode();
    } else {
      const w = isExam ? 460 : 360;
      const h = isExam ? 620 : 500;
      enterFocusMode(item.id, item.x, item.y, w, h);
    }
  };
  
  const cleanTitle = (item.title || '')
    .replace(/^TỜ TÓM TẮT NHANH:\s*/i, '')
    .replace(/^Sổ tổng hợp:\s*/i, '')
    .trim();

  const [titleInput, setTitleInput] = useState(cleanTitle);

  // Immediate Flashcard Extraction without any overlay directly onto the desk next to document
  const handleQuickExtractFlashcards = () => {
    const fullText = item.pages.map(p => `${p.title ? p.title + '\n' : ''}${p.text}`).join('\n\n');
    const cards = generateFlashcardsFromRules(fullText, 4);
    const cardContent = cards.length > 0
      ? cards.map((c, i) => `📌 Thẻ ${i + 1}: ${c.front}\n👉 Ý nghĩa: ${c.back}`).join('\n\n')
      : `📌 Khái niệm: ${cleanTitle}\n👉 Ghi nhớ: ${item.pages[0]?.text.slice(0, 150)}...`;
    
    const targetX = item.x + (isExam ? 460 : 360) + 30;
    const targetY = item.y;
    addStickyNote(`[THẺ GHI NHỚ: ${cleanTitle}]\n\n${cardContent}`, targetX, targetY);
  };

  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
    text: string;
    question: string;
    answer: string | null;
    loading: boolean;
  } | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);

  // Hook for unified drag-and-move and continuous 360 rotation
  const { isDragging, handleMouseDown, handleRotateMouseDown, handleRotateDoubleClick } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width: item.isExamSheet ? 460 : 360,
    height: item.isExamSheet ? 620 : 500,
    onDropCheck: (latestX, latestY) => {
      const paperW = item.isExamSheet ? 460 : 360;
      const paperH = item.isExamSheet ? 620 : 500;
      const paperCenterX = latestX + paperW / 2;
      const paperCenterY = latestY + paperH / 2;

      // Find any book or binder on the desk overlapping this dropped paper
      const targetBook = activeSpace.items.find(other => {
        if (other.id === item.id) return false;
        if (other.type !== 'book' && !other.isBinder) return false;
        const bW = other.width || 980;
        const bH = other.height || 640;
        return (
          paperCenterX >= other.x &&
          paperCenterX <= other.x + bW &&
          paperCenterY >= other.y &&
          paperCenterY <= other.y + bH
        );
      });

      if (targetBook) {
        combineIntoBinder(targetBook.id, item.id);
      }
    }
  });

  const activePage = item.pages[0] || {
    id: 'empty',
    pageNumber: 1,
    title: item.title,
    text: 'Tài liệu chưa có nội dung...'
  };

  // Text selection handler for inline Inteline card
  const handlePageMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    if (text.length > 3 && paperRef.current) {
      try {
        const paperRect = paperRef.current.getBoundingClientRect();
        const clickX = e.clientX - paperRect.left;
        const clickY = e.clientY - paperRect.top;

        setSelectionPopover({
          x: Math.max(100, Math.min(clickX, 260)),
          y: Math.max(40, Math.min(clickY, 420)),
          text,
          question: '',
          answer: null,
          loading: false
        });
      } catch {
        setSelectionPopover(null);
      }
    } else {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-inteline-popover="true"]')) {
        setSelectionPopover(null);
      }
    }
  };

  // Inline Quick Inteline Ask
  const handleQuickAsk = async (customQ?: string) => {
    if (!selectionPopover) return;
    const q = customQ || selectionPopover.question.trim();
    if (!q) return;

    setSelectionPopover(prev => prev ? { ...prev, loading: true, question: q } : null);

    try {
      const prompt = `Bạn là trợ lý học tập GreenLearn (Inteline). Hãy trả lời câu hỏi của học sinh về đoạn văn bản sau đây:
Đoạn trích: "${selectionPopover.text}"
Câu hỏi: "${q}"
Trả lời trực tiếp, ngắn gọn, súc tích, dễ hiểu nhất (tối đa 3-4 câu).`;

      const data = await askAi({
        prompt,
      });

      const reply = data.reply || 'Không nhận được câu trả lời từ AI. Vui lòng thử lại.';
      setSelectionPopover(prev => prev ? { ...prev, loading: false, answer: reply } : null);
    } catch {
      setSelectionPopover(prev => prev ? { ...prev, loading: false, answer: 'Lỗi kết nối máy chủ AI.' } : null);
    }
  };

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && updateItemTitle) {
      updateItemTitle(item.id, normalizeNFC(trimmed));
    }
    setIsEditingTitle(false);
  };

  // Dynamic font scaling to guarantee zero scrollbars
  const textLength = activePage.text.length;
  const dynamicFontSize = (() => {
    if (textLength > 600) return 'text-[10.5px] leading-[1.35]';
    if (textLength > 450) return 'text-[11.5px] leading-[1.42]';
    if (textLength > 300) return 'text-[12.5px] leading-[1.52]';
    if (textLength > 180) return 'text-[13.5px] leading-[1.62]';
    return 'text-[14.5px] leading-[1.72]';
  })();

  const isExam = !!item.isExamSheet && !!item.examData;
  const exam = item.examData;

  return (
    <div
      ref={paperRef}
      data-desk-item="true"
      style={{
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: item.zIndex,
        width: isExam ? 460 : 360,
        height: isExam ? 620 : 500,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
      className={`absolute select-none group cursor-default rounded-sm ${
        isSelected ? 'ring-2 ring-slate-900 shadow-xl' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
      onMouseUp={handlePageMouseUp}
    >
      {/* Main Paper Sheet (White Monochromatic / Exam Sheet) */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          color: '#0f172a',
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased'
        }}
        className={`w-full h-full rounded-sm p-5 shadow-md flex flex-col justify-between border border-slate-300 relative overflow-hidden font-sans ${
          isExam ? 'border-t-4 border-t-slate-800' : ''
        }`}
      >
        {/* In-Document Drawing Layer (strokes permanently attached to this paper) */}
        <ItemDrawingOverlay itemId={item.id} />

        {/* In-Situ STudy Overlay directly covering the PaperSheet */}
        {isStudyOpen && !isExam && (
          <div 
            data-overlay="true"
            onWheel={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-white rounded-sm border border-slate-300 flex flex-col overflow-hidden shadow-2xl font-sans text-slate-900 animate-fade-in"
          >
            {/* Header: [Icon] STudy + Nút đóng X */}
            <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#16A34A] stroke-[2.4]" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">STudy</h3>
              </div>
              <button
                onClick={() => setIsStudyOpen(false)}
                title="Đóng STudy"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2 Tabs 50/50: Tóm tắt & Trắc nghiệm */}
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 select-none">
              <button
                onClick={() => setPaperStudyTab('summary')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  paperStudyTab === 'summary'
                    ? 'border-[#16A34A] text-[#16A34A] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Tóm Tắt</span>
              </button>
              <button
                onClick={() => setPaperStudyTab('quiz')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  paperStudyTab === 'quiz'
                    ? 'border-[#16A34A] text-[#16A34A] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Trắc Nghiệm</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 flex flex-col overflow-hidden p-3 bg-white" onWheel={(e) => e.stopPropagation()}>
              {paperStudyTab === 'summary' ? (
                <SummaryTab 
                  fullText={activePage.text} 
                  documentTitle={item.title} 
                  isPaper={true}
                  targetPos={{ x: item.x + (isExam ? 460 : 360) + 30, y: item.y }}
                />
              ) : (
                <QuizTab 
                  fullText={activePage.text} 
                  documentTitle={item.title} 
                  onCloseModal={() => setIsStudyOpen(false)} 
                  isPaper={true}
                  targetPos={{ x: item.x + (isExam ? 460 : 360) + 30, y: item.y }}
                />
              )}
            </div>
          </div>
        )}
        {isExam && exam ? (
          /* ================= A4 EXAM PAPER SHEET ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Exam Header (Drag handle) */}
            <div 
              onMouseDown={handleMouseDown}
              className="border-b border-slate-200 pb-2.5 mb-3 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  BÀI LUYỆN TẬP
                </span>
                <span className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3 text-[#16A34A]" /> {exam.timeLimitMinutes || 15} phút
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Tổng: {exam.questions.length} câu</span>
                <span>Thí sinh: Tự do</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Mã: 104</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar text-xs">
              {exam.questions.map((q, qIdx) => {
                const selectedAns = exam.userAnswers[q.id];
                const isCorrect = selectedAns === q.correctAnswer;

                return (
                  <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="font-bold text-slate-900 mb-2.5 flex items-start justify-between gap-2">
                      <span className="leading-snug">Câu {qIdx + 1}: {q.question}</span>
                      {exam.isGraded && (
                        isCorrect ? (
                          <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#15803D] border border-[#A7F3D0] rounded-full text-[10px] font-bold flex-shrink-0">
                            Đúng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded-full text-[10px] font-bold flex-shrink-0">
                            Sai
                          </span>
                        )
                      )}
                    </div>

                    {/* Options A, B, C, D */}
                    <div className="grid grid-cols-1 gap-2 pl-0.5">
                      {q.options.map((opt, oIdx) => {
                        const isChosen = selectedAns === oIdx;
                        const isRightAnswer = exam.isGraded && q.correctAnswer === oIdx;
                        const isWrongChoice = exam.isGraded && isChosen && !isCorrect;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={exam.isGraded}
                            onClick={() => updateExamAnswer(item.id, q.id, oIdx)}
                            className={`group relative flex items-center justify-between p-2 rounded-[10px] text-left text-xs transition-all duration-150 border-[1.5px] ${
                              isRightAnswer 
                                ? 'bg-[#ECFDF5] border-[#15803D] text-[#15803D] font-bold anim-correct-pulse'
                                : isWrongChoice
                                ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] font-bold anim-wrong-shake'
                                : isChosen
                                ? 'bg-[#F0FDF4] border-[#16A34A] text-slate-900 font-bold shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:translate-x-1 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-transform ${
                                isRightAnswer
                                  ? 'bg-[#15803D] border-[#15803D] text-white'
                                  : isWrongChoice
                                  ? 'bg-[#DC2626] border-[#DC2626] text-white'
                                  : isChosen
                                  ? 'bg-[#16A34A] border-[#16A34A] text-white anim-badge-pop'
                                  : 'bg-slate-50 border-slate-300 text-slate-700 group-hover:border-slate-400'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1 truncate">{opt}</span>
                            </div>
                            {/* Verdict Pill */}
                            {isRightAnswer && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#15803D] text-white rounded-full anim-verdict-pop flex-shrink-0 ml-2">
                                ĐÚNG ✓
                              </span>
                            )}
                            {isWrongChoice && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#DC2626] text-white rounded-full anim-verdict-pop flex-shrink-0 ml-2">
                                SAI ✕
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exam Grading Footer */}
            <div className="border-t border-slate-200 pt-2.5 mt-2 flex items-center justify-between">
              {exam.isGraded ? (
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#16A34A] text-white px-3 py-1.5 rounded-xl text-center flex-shrink-0 shadow-xs">
                      <div className="text-[9px] text-green-100 font-bold uppercase">Điểm thi</div>
                      <div className="text-base font-black text-white">{exam.score} / 10</div>
                    </div>
                    <div className="text-xs text-slate-700 italic max-w-[200px] leading-tight">
                      {exam.teacherNote}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetExam(item.id)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>Làm lại</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Đã chọn: <strong className="text-[#16A34A]">{Object.keys(exam.userAnswers).length}</strong> / {exam.questions.length} câu
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      gradeExam(item.id);
                      if (exam.questions.length > 0) {
                        const total = exam.questions.length;
                        const correct = exam.questions.filter(q => exam.userAnswers[q.id] === q.correctAnswer).length;
                        const score = Math.round((correct / Math.max(1, total)) * 100) / 10;
                        ActivityService.submitExamAttempt({
                          documentId: item.id,
                          score,
                          total,
                          correct
                        }).catch(() => {});
                      }
                    }}
                    className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-[0_4px_16px_rgba(224,86,45,0.35)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-white" />
                    <span>Nộp bài & Chấm điểm</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= REGULAR DOCUMENT SINGLE PAPER SHEET ================= */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header (Drag handle & Click-to-Edit Title) */}
              <div 
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2.5 cursor-grab active:cursor-grabbing select-none"
              >
                <div 
                  className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2" 
                  onMouseDown={(e) => {
                    if (isEditingTitle) e.stopPropagation();
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-800 flex-shrink-0" />
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
                      className="text-xs font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded outline-none border border-stone-300 w-full"
                    />
                  ) : (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                      }}
                      title="Bấm để đổi tên tài liệu"
                      className="flex items-center gap-1.5 group/editTitle cursor-pointer truncate"
                    >
                      <span className="text-xs font-bold text-stone-800 tracking-tight truncate group-hover/editTitle:text-[#16A34A]">
                        {cleanTitle}
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-stone-400 group-hover/editTitle:text-[#16A34A] opacity-0 group-hover/editTitle:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              {activePage.title && activePage.title !== cleanTitle && (
                <h4 className="text-xs font-bold text-stone-700 mb-1.5 leading-snug">
                  {activePage.title}
                </h4>
              )}

              {/* Reading Text Layer (or PDF Rendered Page Image) */}
              {activePage.image ? (
                <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                  <img
                    src={activePage.image}
                    alt={activePage.title || 'Trang tài liệu'}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                    draggable={false}
                  />
                  <div 
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-2 text-xs overflow-y-auto no-scrollbar cursor-text select-text"
                    title="Bôi đen văn bản để hỏi Inteline / STudy"
                  >
                    <MathRenderer content={activePage.text} />
                  </div>
                </div>
              ) : (
                <div 
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ textRendering: 'geometricPrecision', WebkitFontSmoothing: 'antialiased' }}
                  className={`${dynamicFontSize} text-slate-900 font-medium whitespace-pre-line font-sans selection:bg-slate-200 selection:text-slate-900 overflow-hidden flex-1 cursor-text select-text`}
                >
                  <MathRenderer content={activePage.text} />
                </div>
              )}
            </div>

            {/* Paper Sheet Footer (Drag Handle & WCAG-compliant Contrast) */}
            <div 
              onMouseDown={handleMouseDown}
              className="pt-2 border-t border-stone-200 mt-2 flex items-center justify-between text-[10px] text-slate-600 font-semibold font-mono select-none cursor-grab active:cursor-grabbing"
            >
              <span>GreenLearn Doc</span>
              <span>1 trang</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Toolbar on Hover / Selection with Invisible Hover Bridge (Miro-style Clean White Bar) */}
      <div 
        className={`absolute ${item.y < 90 ? 'top-full mt-3.5 before:-top-3.5' : '-top-11 before:-bottom-3.5'} left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-slate-700 px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur-md transition-opacity duration-150 z-30 before:absolute before:inset-x-0 before:h-4 before:content-[''] ${
          isSelected 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isExam && (
          <>
            {/* Nút STudy: Hiện mỗi icon thôi không kèm text, thêm tooltip thay vào đó */}
            <button
              title="STudy: Tóm tắt & Trắc nghiệm"
              onClick={() => setIsStudyOpen(true)}
              className="p-1.5 hover:bg-[#F0FDF4] rounded-lg text-[#16A34A] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#16A34A] stroke-[2.4]" />
            </button>

            {/* Thẻ Ghi Nhớ: Ấn là trích xuất ngay ra bàn học cạnh tài liệu không hiện overlay */}
            <button
              title="Trích xuất Thẻ Ghi Nhớ ra cạnh tài liệu (Không hiện popup)"
              onClick={handleQuickExtractFlashcards}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 stroke-[2.4]" />
            </button>

            {/* 1 gạch phân vùng với 2 icon xoay góc phóng to */}
            <div className="w-[1px] h-4 bg-slate-200" />
          </>
        )}
        {/* Dán vào bìa sách: Gộp trang này vào cuốn sách gần nhất */}
        {activeSpace.items.some(i => i.id !== item.id && (i.type === 'book' || i.isBinder)) && (
          <button
            title="Dán tờ giấy này vào bìa sách gần nhất trên bàn học"
            onClick={() => {
              const books = activeSpace.items.filter(i => i.id !== item.id && (i.type === 'book' || i.isBinder));
              let closestBook = books[0];
              let minDist = Infinity;
              for (const b of books) {
                const dist = Math.hypot(b.x - item.x, b.y - item.y);
                if (dist < minDist) {
                  minDist = dist;
                  closestBook = b;
                }
              }
              if (closestBook) {
                combineIntoBinder(closestBook.id, item.id);
              }
            }}
            className="p-1.5 hover:bg-green-50 rounded-lg text-slate-700 hover:text-[#16A34A] transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 stroke-[2.4]" />
          </button>
        )}
        <button
          title="Tập trung đọc: Căn giữa và phóng to tài liệu vừa vặn màn hình"
          onClick={handleFocusRead}
          className="p-1.5 hover:bg-green-50 rounded-lg text-slate-700 hover:text-[#16A34A] transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 stroke-[2.4]" />
        </button>
        <button
          title="Đọc toàn màn hình (Xem như file PDF)"
          onClick={() => setIsFullScreen(true)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 stroke-[2.4]" />
        </button>
        <button
          title="Kéo để xoay tài liệu tự do, nhấn đúp để xoay thẳng ngay ngắn (0°)"
          onMouseDown={handleRotateMouseDown}
          onDoubleClick={handleRotateDoubleClick}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-grab active:cursor-grabbing"
        >
          <RotateTwoWay className="w-4 h-4 stroke-[2.4]" />
        </button>
        <div className="w-[1px] h-4 bg-slate-200" />
        <button
          title="Xóa khỏi bàn học"
          onClick={() => removeDeskItem(item.id)}
          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>

      {/* ================= INLINE INTELINE POPOVER AT THE END OF HIGHLIGHTED TEXT ================= */}
      {selectionPopover && (
        <div 
          data-inteline-popover="true"
          style={{ left: selectionPopover.x, top: selectionPopover.y }}
          className="absolute -translate-x-1/2 z-50 animate-fade-in pointer-events-auto w-[320px] bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-300/90 p-3 select-text font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Lightbulb className="w-4 h-4 text-[#16A34A]" />
              <span className="text-xs font-black tracking-tight">Inteline — Hỏi đáp & Phân tích</span>
            </div>
            <button 
              onClick={() => setSelectionPopover(null)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected Quote Preview */}
          <p className="text-[11px] italic text-stone-700 line-clamp-2 mb-2 bg-stone-50 p-2 rounded-lg border border-stone-200/80 leading-relaxed">
            &ldquo;{selectionPopover.text}&rdquo;
          </p>

          {/* AI Answer Box if answered */}
          {selectionPopover.answer && (
            <div className="mb-2 p-2.5 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] text-xs leading-relaxed text-[#15803D]">
              <div className="font-bold text-[#15803D] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#15803D]" />
                  <span>Phân tích:</span>
                </span>
                <button
                  onClick={() => {
                    addStickyNote(`[Inteline Q&A]\n${selectionPopover.text.slice(0, 50)}...\n\n${selectionPopover.answer}`, item.x + 380, item.y + 40, '#fef08a');
                    setSelectionPopover(null);
                  }}
                  className="text-[10px] text-[#15803D] hover:underline font-bold bg-white px-2 py-0.5 rounded border border-[#A7F3D0]"
                >
                  + Ghim Note
                </button>
              </div>
              <p className="whitespace-pre-line text-slate-900 font-medium text-[11.5px]">{selectionPopover.answer}</p>
            </div>
          )}

          {/* Quick Suggestion Pills */}
          {!selectionPopover.answer && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <button
                disabled={selectionPopover.loading}
                onClick={() => handleQuickAsk('Giải thích ngắn gọn đoạn này')}
                className="px-2 py-0.5 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[10.5px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
              >
                Giải thích ngắn
              </button>
              <button
                disabled={selectionPopover.loading}
                onClick={() => handleQuickAsk('Cho ví dụ thực tế về đoạn này')}
                className="px-2 py-0.5 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[10.5px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
              >
                Cho ví dụ
              </button>
              <button
                disabled={selectionPopover.loading}
                onClick={() => handleQuickAsk('Tóm 1 ý chính quan trọng nhất')}
                className="px-2 py-0.5 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[10.5px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
              >
                Ý chính
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              spellCheck={false}
              placeholder={selectionPopover.loading ? 'AI đang phân tích...' : 'Đặt câu hỏi về đoạn này...'}
              value={selectionPopover.question}
              onChange={(e) => {
                const val = e.target.value;
                setSelectionPopover(prev => prev ? { ...prev, question: val } : null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAsk();
                }
              }}
              disabled={selectionPopover.loading}
              className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#16A34A] focus:bg-white text-slate-900"
            />
            <button
              onClick={() => handleQuickAsk()}
              disabled={selectionPopover.loading || !selectionPopover.question.trim()}
              className="p-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Document Reader Modal */}
      {isFullScreen && (
        <FullScreenDocModal
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          item={item}
          initialPageIndex={0}
        />
      )}





      {/* Drag & Merge Hint */}
      {!isExam && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-white/90 border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
          Kéo thả vào sách để gộp trang
        </div>
      )}
    </div>
  );
}

export const PaperSheet = React.memo(PaperSheetComponent);
