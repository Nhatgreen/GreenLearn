'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DeskItem } from '@/types/studyspace';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  BookOpen, 
  FileText, 
  Clock,
  CheckCircle2,
  XCircle,
  PanelLeft,
  Printer
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';
import { paginateDocument, PaginatedLeaf } from '@/utils/pagination';
import { MathRenderer } from '../common/MathRenderer';

interface FullScreenDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DeskItem;
  initialPageIndex?: number;
}

export function FullScreenDocModal({
  isOpen,
  onClose,
  item,
  initialPageIndex = 0
}: FullScreenDocModalProps) {
  const [currentPage, setCurrentPage] = useState(initialPageIndex);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isTwoPageSpread, setIsTwoPageSpread] = useState(item.type === 'book');
  const [pageRotation, setPageRotation] = useState(0); // 0, 90, 180, 270
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isExam = !!item.isExamSheet && !!item.examData;
  const exam = item.examData;

  // Use dynamic paginated leaves for books and documents
  const leaves: PaginatedLeaf[] = paginateDocument(item.pages);
  const totalLeaves = Math.max(leaves.length, 1);

  const leftIndex = isTwoPageSpread ? (currentPage % 2 === 0 ? currentPage : currentPage - 1) : currentPage;
  const rightIndex = leftIndex + 1;

  const leftLeaf = leaves[leftIndex] || null;
  const rightLeaf = isTwoPageSpread ? (leaves[rightIndex] || null) : null;

  const handlePrev = () => {
    const step = isTwoPageSpread ? 2 : 1;
    setCurrentPage(prev => Math.max(0, prev - step));
  };

  const handleNext = () => {
    const step = isTwoPageSpread ? 2 : 1;
    setCurrentPage(prev => Math.min(totalLeaves - 1, prev + step));
  };

  const handleRotatePage = () => {
    setPageRotation(prev => (prev + 90) % 360);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentPage(initialPageIndex);
  }, [initialPageIndex, isOpen]);

  // Handle ESC and Arrow keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isTwoPageSpread, currentPage, totalLeaves]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[100] bg-[#e8ebf0] flex flex-col select-none text-slate-900 font-sans animate-fade-in"
      onClick={onClose}
    >
      {/* ================= 1. BROWSER PDF VIEWER TOP TOOLBAR (HUD White / Monochromatic) ================= */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-300 flex-shrink-0 z-30 shadow-xs select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Sidebar Toggle & Document Info */}
        <div className="flex items-center gap-3 overflow-hidden max-w-md">
          {/* Sidebar Thumbnails Toggle Button */}
          {!isExam && (
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? "Ẩn danh sách trang thu nhỏ" : "Hiện danh sách trang thu nhỏ"}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isSidebarOpen 
                  ? 'bg-slate-200 text-slate-900 border-slate-300' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <PanelLeft className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}

          <div className="w-[1px] h-5 bg-slate-200" />

          {/* Doc Title */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 text-[#16A34A]">
              {isExam ? (
                <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
              ) : item.type === 'book' ? (
                <BookOpen className="w-3.5 h-3.5 stroke-[2.4]" />
              ) : (
                <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                {item.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-mono">
                <span>{isExam ? `${exam?.questions.length || 0} câu` : `${totalLeaves} trang`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: PDF Navigation & Zoom / View Toolbar */}
        {!isExam && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
            {/* Page Jump: [ < ]  1 / 23  [ > ] */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={leftIndex <= 0}
                title="Trang trước (←)"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.4]" />
              </button>

              <div className="flex items-center gap-1 text-xs font-mono font-bold px-1.5">
                <span className="text-[#16A34A]">{isTwoPageSpread ? `${leftIndex + 1}${rightLeaf ? `-${Math.min(rightIndex + 1, totalLeaves)}` : ''}` : currentPage + 1}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-700">{totalLeaves}</span>
              </div>

              <button
                onClick={handleNext}
                disabled={isTwoPageSpread ? rightIndex >= totalLeaves - 1 : currentPage >= totalLeaves - 1}
                title="Trang sau (→)"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            {/* Zoom Controls: [ - ] 100% [ + ] [ Reset ] */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                title="Thu nhỏ"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5 stroke-[2.4]" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-800 w-11 text-center">
                {zoomLevel}%
              </span>

              <button
                onClick={() => setZoomLevel(prev => Math.min(180, prev + 10))}
                title="Phóng to"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5 stroke-[2.4]" />
              </button>

              <button
                onClick={() => setZoomLevel(100)}
                title="Khôi phục 100%"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 stroke-[2.4]" />
              </button>
            </div>

            <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

            {/* Page Rotation (0° / 90° / 180° / 270°) */}
            <button
              onClick={handleRotatePage}
              title={`Xoay trang (${pageRotation}°) • Bấm để xoay tiếp 90°`}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <RotateTwoWay className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>

            {/* View Mode Toggle: 2-page spread vs 1-page (for books) */}
            {item.type === 'book' && (
              <>
                <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                <button
                  onClick={() => setIsTwoPageSpread(!isTwoPageSpread)}
                  title={isTwoPageSpread ? "Chuyển sang xem 1 trang" : "Chuyển sang xem 2 trang"}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    isTwoPageSpread 
                      ? 'bg-white border-slate-300 text-slate-900 shadow-2xs' 
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isTwoPageSpread ? '2 Trang' : '1 Trang'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Right: Print & Close Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            title="In tài liệu (Print)"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs border border-slate-300 hover:border-rose-200 shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Đóng chế độ phóng to (Phím Esc)"
          >
            <X className="w-4 h-4 stroke-[2.4]" />
            <span>Thoát</span>
            <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-mono ml-0.5 border border-slate-200">Esc</kbd>
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN VIEWER LAYOUT: THUMBNAIL SIDEBAR + CENTER READING DESK ================= */}
      <div 
        className="flex-1 flex overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Thumbnails Sidebar (Browser PDF style: preview cards + page numbers) */}
        {!isExam && isSidebarOpen && (
          <div className="w-56 bg-slate-100/95 border-r border-slate-300 flex flex-col overflow-y-auto p-3 gap-3 select-none flex-shrink-0 no-scrollbar shadow-inner animate-fade-in">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">
              Trang thu nhỏ ({totalLeaves})
            </div>

            {leaves.map((leaf, lIdx) => {
              const isSelectedPage = isTwoPageSpread 
                ? (lIdx === leftIndex || lIdx === rightIndex)
                : lIdx === currentPage;

              return (
                <div 
                  key={leaf.pageNumber || lIdx}
                  onClick={() => setCurrentPage(lIdx)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  {/* Miniature Page Card */}
                  <div 
                    className={`w-full aspect-[1/1.3] bg-white rounded-md p-2.5 flex flex-col justify-between border transition-all overflow-hidden ${
                      isSelectedPage
                        ? 'ring-2 ring-[#16A34A] border-[#16A34A] shadow-md scale-102'
                        : 'border-slate-300 hover:border-slate-400 shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    {leaf.image ? (
                      <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                        <img 
                          src={leaf.image} 
                          alt={`Trang ${leaf.pageNumber}`}
                          className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-[9px] font-bold text-slate-900 line-clamp-1 border-b border-slate-100 pb-1 mb-1">
                            {leaf.chapterTitle || `Trang ${leaf.pageNumber}`}
                          </div>
                          <div className="text-[7.5px] leading-tight text-slate-500 line-clamp-6 select-none pointer-events-none">
                            {leaf.text}
                          </div>
                        </div>
                        <div className="w-full text-right text-[8px] font-mono text-slate-400">
                          {leaf.pageNumber}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Page Label */}
                  <span className={`text-[10.5px] font-mono font-bold transition-colors ${
                    isSelectedPage ? 'text-[#16A34A]' : 'text-slate-600 group-hover:text-slate-900'
                  }`}>
                    Trang {leaf.pageNumber}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Center Document Canvas Pane */}
        <div 
          className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#e8ebf0] cursor-default relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{ 
              transform: `scale(${zoomLevel / 100}) rotate(${pageRotation}deg)`, 
              transformOrigin: 'center center' 
            }}
            className="transition-transform duration-200 ease-out flex items-center justify-center"
          >
            {isExam && exam ? (
              /* ================= FULL SCREEN EXAM SHEET ================= */
              <div 
                style={{ width: 680, minHeight: 900, backgroundColor: '#ffffff', color: '#0f172a' }}
                className="rounded-sm p-8 shadow-2xl border border-slate-300 font-sans flex flex-col justify-between"
              >
                <div>
                  <div className="border-b-2 border-slate-900 pb-3 mb-5 text-center">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 mb-1">
                      <span>VITUDY EDUCATION SYSTEM</span>
                      <span className="flex items-center gap-1 text-slate-900">
                        <Clock className="w-3.5 h-3.5" /> Thời gian: {exam.timeLimitMinutes || 15} phút
                      </span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                      {item.title}
                    </h1>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 border-t border-slate-200 pt-2">
                      <span>Tổng số câu: {exam.questions.length} câu</span>
                      <span>Thí sinh: Thí sinh tự do</span>
                      <span className="font-mono font-semibold">Mã đề: 104</span>
                    </div>
                  </div>

                  {/* Question List */}
                  <div className="space-y-6 text-sm">
                    {exam.questions.map((q, qIdx) => {
                      const selectedAns = exam.userAnswers[q.id];
                      const isCorrect = selectedAns === q.correctAnswer;

                      return (
                        <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                          <div className="font-bold text-slate-900 mb-3 flex items-start gap-2">
                            <span className="text-slate-500 font-mono">Câu {qIdx + 1}:</span>
                            <span className="flex-1">
                              <MathRenderer content={q.question} />
                            </span>
                            {exam.isGraded && (
                              selectedAns !== undefined ? (
                                isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 ml-auto" />
                                )
                              ) : null
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, optIdx) => {
                              const isSelectedOption = selectedAns === optIdx;
                              const isAnswerCorrect = q.correctAnswer === optIdx;

                              let optClass = "border-slate-200 bg-white hover:border-slate-400 text-slate-800";
                              if (isSelectedOption && !exam.isGraded) {
                                optClass = "border-[#16A34A] bg-[#F0FDF4] text-[#166534] font-semibold";
                              } else if (exam.isGraded) {
                                if (isAnswerCorrect) {
                                  optClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                                } else if (isSelectedOption && !isAnswerCorrect) {
                                  optClass = "border-rose-400 bg-rose-50 text-rose-900 line-through";
                                }
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${optClass}`}
                                >
                                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px]">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1">
                                    <MathRenderer content={opt} />
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {exam.isGraded && exam.score !== undefined && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-lg">
                        {exam.score}đ
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">KẾT QUẢ ĐÁNH GIÁ</div>
                        <div className="text-xs text-slate-600">{exam.teacherNote}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isTwoPageSpread ? (
              /* ================= FULL SCREEN 2-PAGE SPREAD ================= */
              <div 
                style={{ width: 1040, minHeight: 700 }}
                className="flex rounded-md shadow-2xl overflow-hidden border border-slate-300 bg-white text-slate-900"
              >
                {/* Left Page */}
                <div className="flex-1 p-10 flex flex-col justify-between border-r border-slate-200 relative bg-[#fdfbf7]">
                  {leftLeaf ? (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="pb-2 mb-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                          <span className="text-xs font-bold text-slate-600 truncate">
                            {leftLeaf.chapterTitle}
                          </span>
                        </div>
                        {leftLeaf.image ? (
                          <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                            <img
                              src={leftLeaf.image}
                              alt={`Trang ${leftLeaf.pageNumber}`}
                              className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                            />
                            <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-3 text-xs leading-relaxed overflow-y-auto cursor-text select-text">
                              <MathRenderer content={leftLeaf.text} />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[15.5px] leading-[1.8] text-slate-900 font-sans selection:bg-orange-100 flex-1 overflow-y-auto no-scrollbar">
                            <MathRenderer content={leftLeaf.text} />
                          </div>
                        )}
                      </div>
                      <div className="text-center text-xs font-mono text-slate-500 pt-4 border-t border-slate-200 flex-shrink-0">
                        {leftLeaf.pageNumber}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
                      Trang trống
                    </div>
                  )}
                </div>

                {/* Central Spine Seam Shadow */}
                <div className="w-[3px] bg-gradient-to-r from-stone-400/30 via-stone-500/40 to-stone-400/30 shadow-inner" />

                {/* Right Page */}
                <div className="flex-1 p-10 flex flex-col justify-between relative bg-[#fdfbf7]">
                  {rightLeaf ? (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="pb-2 mb-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                          <span className="text-xs font-bold text-slate-600 truncate">
                            {rightLeaf.chapterTitle}
                          </span>
                        </div>
                        {rightLeaf.image ? (
                          <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                            <img
                              src={rightLeaf.image}
                              alt={`Trang ${rightLeaf.pageNumber}`}
                              className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                            />
                            <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-3 text-xs leading-relaxed overflow-y-auto cursor-text select-text">
                              <MathRenderer content={rightLeaf.text} />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[15.5px] leading-[1.8] text-slate-900 font-sans selection:bg-orange-100 flex-1 overflow-y-auto no-scrollbar">
                            <MathRenderer content={rightLeaf.text} />
                          </div>
                        )}
                      </div>
                      <div className="text-center text-xs font-mono text-slate-500 pt-4 border-t border-slate-200 flex-shrink-0">
                        {rightLeaf.pageNumber}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
                      (Hết tài liệu)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ================= FULL SCREEN SINGLE PAGE (A4 Document) ================= */
              <div 
                style={{ width: 640, minHeight: 840 }}
                className="rounded-sm shadow-2xl p-10 border border-slate-300 bg-white text-slate-900 flex flex-col justify-between"
              >
                {leftLeaf ? (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="pb-2 mb-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                        <span className="text-xs font-bold text-slate-600 truncate">
                          {leftLeaf.chapterTitle}
                        </span>
                      </div>
                      {leftLeaf.image ? (
                        <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                          <img
                            src={leftLeaf.image}
                            alt={`Trang ${leftLeaf.pageNumber}`}
                            className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                          />
                          <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-3 text-xs leading-relaxed overflow-y-auto cursor-text select-text">
                            <MathRenderer content={leftLeaf.text} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[16px] leading-[1.8] text-slate-900 font-sans selection:bg-orange-100 flex-1 overflow-y-auto no-scrollbar">
                          <MathRenderer content={leftLeaf.text} />
                        </div>
                      )}
                    </div>
                    <div className="text-center text-xs font-mono text-slate-500 pt-4 border-t border-slate-200 flex-shrink-0">
                      {leftLeaf.pageNumber}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
                    Trang trống
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
