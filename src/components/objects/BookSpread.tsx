'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Trash2, 
  Scissors,
  Maximize2,
  X,
  Send,
  Loader2,
  Lightbulb,
  BookOpen,
  Eye,
  Palette,
  Check
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';
import { MathRenderer } from '../common/MathRenderer';
import { IntelineModal } from '../modals/IntelineModal';
import { StudyToolsModal } from '../modals/StudyToolsModal';
import { FullScreenDocModal } from '../modals/FullScreenDocModal';
import { paginateDocument, PaginatedLeaf } from '@/utils/pagination';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { useViToken } from '@/context/ViTokenContext';
import { askAi } from '@/lib/aiClient';
import { ItemDrawingOverlay } from '../canvas/ItemDrawingOverlay';

interface BookSpreadProps {
  item: DeskItem;
  isSelected: boolean;
}

export const BOOK_COVER_PRESETS = [
  {
    id: 'brown',
    name: 'Nâu Da',
    gradient: 'linear-gradient(135deg, #5c3920 0%, #462814 50%, #341c0c 100%)',
    border: '2px solid rgba(113, 67, 36, 0.85)',
    tabBg: '#78350f',
    swatch: '#5c3920'
  },
  {
    id: 'burgundy',
    name: 'Đỏ Đậm',
    gradient: 'linear-gradient(135deg, #6b1d28 0%, #4e121b 50%, #360a12 100%)',
    border: '2px solid rgba(140, 40, 55, 0.85)',
    tabBg: '#881337',
    swatch: '#6b1d28'
  },
  {
    id: 'navy',
    name: 'Xanh Nước Đậm',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #152843 50%, #0d1a2d 100%)',
    border: '2px solid rgba(45, 85, 135, 0.85)',
    tabBg: '#0369a1',
    swatch: '#1e3a5f'
  },
  {
    id: 'forest',
    name: 'Xanh Lá Đậm',
    gradient: 'linear-gradient(135deg, #1b4d3e 0%, #13382d 50%, #0c241d 100%)',
    border: '2px solid rgba(38, 105, 85, 0.85)',
    tabBg: '#047857',
    swatch: '#1b4d3e'
  },
  {
    id: 'plum',
    name: 'Hồng Đậm',
    gradient: 'linear-gradient(135deg, #5b2149 0%, #421634 50%, #2b0c21 100%)',
    border: '2px solid rgba(125, 45, 100, 0.85)',
    tabBg: '#9d174d',
    swatch: '#5b2149'
  }
];

export function BookSpreadComponent({ item, isSelected }: BookSpreadProps) {
  const { 
    selectItem, 
    removeDeskItem,
    turnBookPage,
    detachPageFromBinder,
    addStickyNote,
    setTransform,
    focusedItemId,
    enterFocusMode,
    exitFocusMode,
    updateBookCoverColor
  } = useStudySpace();

  const { spendTokens, aiConfig } = useViToken();

  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  const currentCover = BOOK_COVER_PRESETS.find(p => p.id === item.coverColor || p.gradient === item.coverColor) || BOOK_COVER_PRESETS[0];

  // Focus Reading Mode: True when this book is the focused item
  const isFocusReading = focusedItemId === item.id;

  const toggleFocusRead = () => {
    if (isFocusReading) {
      exitFocusMode();
    } else {
      enterFocusMode(item.id, item.x, item.y, 980, 640);
    }
  };
  
  // Full modal fallback for complex multi-turn Inteline
  const [intelineModalState, setIntelineModalState] = useState<{
    isOpen: boolean;
    pageNumber: number;
    selectedText: string;
  } | null>(null);

  // Floating Contextual Inteline Popover right at the end of selected text
  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
    text: string;
    pageNumber: number;
    question: string;
    answer: string | null;
    loading: boolean;
  } | null>(null);

  // 3D Realistic Page Drag & Curl state
  const [dragFlip, setDragFlip] = useState<{
    direction: 'next' | 'prev';
    progress: number;
    isDragging: boolean;
  } | null>(null);

  const bookRef = useRef<HTMLDivElement>(null);

  // Recalculate pagination when custom fonts finish loading
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready
        .then(() => setFontsReady(true))
        .catch(() => setFontsReady(true));
    }
  }, []);

  // Dynamic pagination: zero text loss, fits page height exactly
  const paginatedLeaves: PaginatedLeaf[] = useMemo(() => {
    return paginateDocument(item.pages);
  }, [item.pages, fontsReady]);

  const totalPages = Math.max(paginatedLeaves.length, 1);

  // Even index on left page, odd index on right page
  const leftPageIndex = item.currentPageIndex % 2 === 0 ? item.currentPageIndex : item.currentPageIndex - 1;
  const rightPageIndex = leftPageIndex + 1;

  const leftLeaf = paginatedLeaves[leftPageIndex] || null;
  const rightLeaf = paginatedLeaves[rightPageIndex] || null;

  // Pre-rendered underlying leaves so when flipping, the leaf underneath already shows the next page
  const underneathLeftLeaf = dragFlip?.direction === 'prev'
    ? (paginatedLeaves[leftPageIndex - 2] || null)
    : leftLeaf;

  const underneathRightLeaf = dragFlip?.direction === 'next'
    ? (paginatedLeaves[rightPageIndex + 2] || null)
    : rightLeaf;

  // Keyboard navigation for turning pages (always passes totalPages so it never gets stuck)
  useEffect(() => {
    if (!isSelected || isFullScreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turnBookPage(item.id, 'prev', totalPages);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        turnBookPage(item.id, 'next', totalPages);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isFullScreen, item.id, turnBookPage, totalPages]);

  // Hook for unified drag-and-move and continuous 360 rotation (width 980 to match 3x cover width)
  const { isDragging, handleMouseDown, handleRotateMouseDown, handleRotateDoubleClick } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width: 980,
    height: 640,
  });

  // Handle Text Selection: position Inteline card right at the end of the highlighted text
  const handlePageMouseUp = (pageNumber: number, e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (selection && text.length >= 3 && bookRef.current) {
      try {
        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        const lastRect = rects[rects.length - 1] || range.getBoundingClientRect();
        const bookRect = bookRef.current.getBoundingClientRect();

        const currentScale = (bookRect.width || 980) / 980;
        const clickX = (lastRect.right - bookRect.left) / currentScale;
        const clickY = (lastRect.bottom - bookRect.top) / currentScale + 8;

        setSelectionPopover({
          x: Math.max(120, Math.min(clickX, 840)),
          y: Math.max(60, Math.min(clickY, 520)),
          text,
          pageNumber,
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
      const prompt = `Bạn là trợ lý học tập ViTudy (Inteline). Hãy trả lời câu hỏi của học sinh về đoạn văn bản sau đây:
Đoạn trích: "${selectionPopover.text}"
Câu hỏi: "${q}"
Trả lời trực tiếp, ngắn gọn, súc tích, dễ hiểu nhất (tối đa 3-4 câu).`;

      spendTokens?.(2, 'Hỏi nhanh AI Inteline');

      const data = await askAi({
        provider: aiConfig?.provider || 'system',
        model: aiConfig?.model,
        apiKey: aiConfig?.apiKey,
        prompt: `Bạn là trợ lý học tập ViTudy (Inteline). Hãy trả lời câu hỏi của học sinh về đoạn văn bản sau đây:
Đoạn trích: "${selectionPopover.text}"
Câu hỏi: "${q}"
Trả lời trực tiếp, ngắn gọn, súc tích, dễ hiểu nhất (tối đa 3-4 câu).`,
      });

      const reply = data.reply || 'Không nhận được câu trả lời từ AI. Vui lòng thử lại.';
      setSelectionPopover(prev => prev ? { ...prev, loading: false, answer: reply } : null);
    } catch {
      setSelectionPopover(prev => prev ? {
        ...prev, 
        loading: false, 
        answer: 'Đã xảy ra lỗi khi kết nối AI. Vui lòng kiểm tra mạng hoặc thử lại.'
      } : null);
    }
  };

  // ================= 3D REALISTIC PAGE-FLIP DRAG CONTROLLER =================
  const startDragFlip = useCallback((direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (direction === 'next' && rightPageIndex >= totalPages - 1) return;
    if (direction === 'prev' && leftPageIndex <= 0) return;

    const startX = e.clientX;
    let currentProgress = 0.05;
    let didMove = false;

    setDragFlip({
      direction,
      progress: 0.05,
      isDragging: true
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      if (Math.abs(deltaX) > 4) didMove = true;

      let p = 0;
      if (direction === 'next') {
        p = Math.min(1, Math.max(0, -deltaX / 340));
      } else {
        p = Math.min(1, Math.max(0, deltaX / 340));
      }
      currentProgress = p;

      setDragFlip({
        direction,
        progress: currentProgress,
        isDragging: true
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const shouldTurn = !didMove || currentProgress > 0.28;

      if (shouldTurn) {
        setDragFlip({
          direction,
          progress: 1,
          isDragging: false
        });
        setTimeout(() => {
          turnBookPage(item.id, direction, totalPages);
          setDragFlip(null);
        }, 260);
      } else {
        setDragFlip({
          direction,
          progress: 0,
          isDragging: false
        });
        setTimeout(() => {
          setDragFlip(null);
        }, 220);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [rightPageIndex, leftPageIndex, totalPages, turnBookPage, item.id]);

  const cleanTitle = item.title.replace(/^Sổ tổng hợp:\s*/i, '');

  return (
    <>
      <div
        ref={bookRef}
        data-desk-item="true"
        style={{
          transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg)`,
          width: 980,
          height: 640,
          zIndex: item.zIndex || 1
        }}
        className={`absolute select-none group cursor-default ${
          isSelected ? 'ring-2 ring-stone-900/40 ring-offset-4 ring-offset-white' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          selectItem(item.id);
        }}
      >
        {/* In-Document Drawing Layer directly at outer book container (0, 0 to 980, 640) matching world transform coordinates */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible w-full h-full">
          <ItemDrawingOverlay itemId={item.id} />
        </div>

        {/* ================= RICH LEATHER HARDCOVER (3X HORIZONTAL MARGIN: 42PX - DRAGGABLE ON LEATHER) ================= */}
        <div 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleMouseDown(e);
            }
          }}
          className="w-full h-full rounded-2xl flex relative z-10 overflow-visible cursor-grab active:cursor-grabbing transition-colors duration-300"
          style={{
            background: currentCover.gradient,
            border: currentCover.border,
            boxShadow: '0 16px 40px -4px rgba(35, 18, 8, 0.45), 0 30px 60px -12px rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.4)',
            padding: '12px 42px' // Increased horizontal padding to 42px (3x from 14px)
          }}
        >
          {/* ================= 5 BOOKMARK INDEX TABS TUCKED UNDER PAPER (SLIDE OUT FROM INSIDE BOOK) ================= */}
          {/* Root tucked 8px under right paper edge, icon sits close to paper at idle; expands cleanly on hover */}
          <div 
            className="absolute top-10 flex flex-col gap-3 z-10 select-none pointer-events-auto"
            style={{ left: 'calc(100% - 50px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab 1: Green (Xanh lá) - Tóm tắt (STudy) */}
            <div className="relative group/tab flex items-center">
              <button
                onClick={() => setIsStudyOpen(true)}
                title="STudy: Tóm tắt thông minh & Ôn tập trắc nghiệm"
                className="h-8 w-[48px] group-hover/tab:w-[106px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-between pl-[16px] pr-4 gap-0 group-hover/tab:gap-2 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[60px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                  Tóm tắt
                </span>
                <Sparkles className="w-4 h-4 text-emerald-100 flex-shrink-0" />
              </button>
            </div>

            {/* Tab Focus: Indigo (Chàm) - Tập trung đọc (Giữ yên kéo ra khi đang bật) */}
            <div className="relative group/tab flex items-center">
              <button
                type="button"
                onClick={toggleFocusRead}
                title={isFocusReading ? "Thoát chế độ tập trung đọc" : "Chế độ tập trung đọc (Phóng to & Căn giữa sách)"}
                className={clsx(
                  "h-8 flex items-center justify-between pl-[16px] pr-4 gap-0 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden",
                  isFocusReading
                    ? "w-[116px] bg-indigo-700 text-white ring-2 ring-indigo-400/60"
                    : "w-[48px] group-hover/tab:w-[116px] bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white group-hover/tab:gap-2"
                )}
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                <span className={clsx(
                  "text-xs font-bold text-white tracking-wide whitespace-nowrap transition-all duration-200 overflow-hidden",
                  isFocusReading
                    ? "max-w-[70px] opacity-100 mr-2"
                    : "max-w-0 opacity-0 group-hover/tab:max-w-[70px] group-hover/tab:opacity-100"
                )}>
                  Tập trung
                </span>
                <Eye className="w-4 h-4 text-indigo-100 flex-shrink-0" />
              </button>
            </div>

            {/* Tab 2: Orange (Cam) - Phóng to / Toàn màn hình */}
            <div className="relative group/tab flex items-center">
              <button
                onClick={() => setIsFullScreen(true)}
                title="Đọc toàn màn hình (Xem chuẩn PDF Reader)"
                className="h-8 w-[48px] group-hover/tab:w-[110px] bg-orange-600 hover:bg-green-500 active:scale-95 text-white flex items-center justify-between pl-[16px] pr-4 gap-0 group-hover/tab:gap-2 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[65px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                  Phóng to
                </span>
                <Maximize2 className="w-4 h-4 text-orange-100 flex-shrink-0" />
              </button>
            </div>

            {/* Tab 3: Blue (Xanh lam) - Tách trang */}
            <div className="relative group/tab flex items-center">
              <button
                onClick={() => {
                  const targetPage = rightPageIndex < totalPages ? rightPageIndex : leftPageIndex;
                  detachPageFromBinder(item.id, targetPage);
                }}
                className="h-8 w-[48px] group-hover/tab:w-[124px] bg-sky-700 hover:bg-sky-600 active:scale-95 text-white flex items-center justify-between pl-[16px] pr-4 gap-0 group-hover/tab:gap-2 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
                title="Tách trang đang mở ra tờ rời trên bàn học"
              >
                <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[78px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                  Tách trang
                </span>
                <Scissors className="w-4 h-4 text-sky-100 flex-shrink-0" />
              </button>
            </div>

            {/* Tab 4: Brown (Nâu) - Xoay */}
            <div className="relative group/tab flex items-center">
              <button
                onMouseDown={handleRotateMouseDown}
                onDoubleClick={handleRotateDoubleClick}
                title="Kéo để xoay sách tự do 360°, nhấn đúp căn thẳng 0°"
                className="h-8 w-[48px] group-hover/tab:w-[92px] bg-[#78350f] hover:bg-[#92400e] active:scale-95 text-white flex items-center justify-between pl-[16px] pr-4 gap-0 group-hover/tab:gap-2 transition-[width] duration-200 ease-out shadow-md cursor-grab active:cursor-grabbing overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[45px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                  Xoay
                </span>
                <RotateTwoWay className="w-4 h-4 text-amber-100 flex-shrink-0" />
              </button>
            </div>

            {/* Tab: Màu bìa (icon -> Màu Bìa [icon] -> Bảng màu | Màu Bìa [icon]) */}
            <div className="relative group/tab flex items-center">
              <button
                type="button"
                onClick={() => setIsCoverPickerOpen(prev => !prev)}
                title="Đổi màu bìa sách (Bấm để mở 5 màu da cao cấp)"
                className={clsx(
                  "h-8 flex items-center justify-between pl-[14px] pr-4 gap-0 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden text-white",
                  isCoverPickerOpen
                    ? "w-[272px] bg-slate-900 ring-2 ring-amber-400/60"
                    : "w-[48px] group-hover/tab:w-[120px] bg-amber-800 hover:bg-amber-700 active:scale-95 group-hover/tab:gap-2"
                )}
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                {isCoverPickerOpen ? (
                  <div className="flex items-center gap-1.5 pr-2" onClick={(e) => e.stopPropagation()}>
                    {BOOK_COVER_PRESETS.map((c) => {
                      const isCur = c.id === currentCover.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={c.name}
                          onClick={() => {
                            updateBookCoverColor?.(item.id, c.id);
                          }}
                          style={{ background: c.gradient }}
                          className={`w-5 h-5 rounded-full border border-white/60 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer shadow-xs ${
                            isCur ? 'ring-2 ring-white scale-110' : 'opacity-85'
                          }`}
                        >
                          {isCur && <Check className="w-3 h-3 stroke-[3] text-white" />}
                        </button>
                      );
                    })}
                    <div className="w-[1px] h-4 bg-white/30 mx-1" />
                    <span className="text-xs font-bold text-amber-200 whitespace-nowrap">
                      Màu Bìa
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[70px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                    Màu bìa
                  </span>
                )}
                <Palette className="w-4 h-4 text-amber-100 flex-shrink-0" />
              </button>
            </div>

            {/* Mục đích riêng biệt: Vạch phân cách trước nút Xoá để chống bấm nhầm */}
            <div className="w-6 h-[1px] bg-amber-950/25 my-0.5 self-center" />

            {/* Tab 5: Red (Đỏ) - Xoá (Có xác nhận an toàn) */}
            <div className="relative group/tab flex items-center">
              <button
                onClick={() => setIsConfirmDelete(true)}
                title="Xóa cuốn sách này khỏi bàn học (Có xác nhận)"
                className="h-8 w-[48px] group-hover/tab:w-[86px] bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-between pl-[16px] pr-4 gap-0 group-hover/tab:gap-2 transition-[width] duration-200 ease-out shadow-md cursor-pointer overflow-hidden"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%)'
                }}
              >
                <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap max-w-0 opacity-0 group-hover/tab:max-w-[40px] group-hover/tab:opacity-100 transition-all duration-200 overflow-hidden">
                  Xoá
                </span>
                <Trash2 className="w-4 h-4 text-rose-100 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* ================= INNER PAGES CONTAINER (Z-20: OVERLAPS BOOKMARK TABS) ================= */}
          <div 
            className="w-full h-full rounded-xl flex relative overflow-visible shadow-inner bg-[#fdfbf7] z-20"
            style={{ perspective: '2000px' }}
          >
            {/* Spine Shadow & Crease Effect — CONFINED ONLY INSIDE THE PAPER CONTAINER */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 pointer-events-none z-20 bg-gradient-to-r from-black/15 via-black/35 to-black/15" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-stone-400 z-20 opacity-50" />

            {/* ================= LEFT PAGE ================= */}
            <div 
              style={{ backgroundColor: '#fdfbf7', color: '#0f172a' }}
              className="flex-1 rounded-l-md p-7 pr-8 flex flex-col justify-between shadow-inner relative border-r border-stone-300/80 overflow-hidden paper-texture book-page font-sans group/page"
              onMouseUp={(e) => handlePageMouseUp(underneathLeftLeaf?.pageNumber || leftPageIndex + 1, e)}
            >
              {underneathLeftLeaf ? (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chapter Header (Drag handle) */}
                    <div 
                      onMouseDown={handleMouseDown}
                      className="pb-2 mb-3 border-b border-stone-200/90 flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
                    >
                      <span className="text-xs font-bold tracking-tight text-slate-800 truncate font-sans block flex-1 pr-2">
                        {underneathLeftLeaf.chapterTitle}
                        {underneathLeftLeaf.isContinuation ? ' (tiếp)' : ''}
                      </span>
                    </div>

                    {/* Page Body Text or PDF Rendered Page Image */}
                    {underneathLeftLeaf.image ? (
                      <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                        <img
                          src={underneathLeftLeaf.image}
                          alt={`Trang ${underneathLeftLeaf.pageNumber}`}
                          className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                          draggable={false}
                        />
                        <div 
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-2 text-[13px] leading-relaxed overflow-y-auto no-scrollbar cursor-text select-text"
                          title="Bôi đen văn bản để hỏi Inteline / STudy"
                        >
                          <MathRenderer content={underneathLeftLeaf.text} />
                        </div>
                      </div>
                    ) : (
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line font-sans selection:bg-slate-200 selection:text-slate-900 flex-1 overflow-y-auto no-scrollbar cursor-text select-text"
                      >
                        <MathRenderer content={underneathLeftLeaf.text} />
                      </div>
                    )}
                  </div>

                  {/* Left Page Footer (Drag handle): Only Page Number in Bottom-Left Corner */}
                  <div 
                    onMouseDown={handleMouseDown}
                    className="flex-shrink-0 text-left text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200/80 mt-2 pl-2 select-none cursor-grab active:cursor-grabbing"
                  >
                    {underneathLeftLeaf.pageNumber}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-xs italic font-sans">
                  Trang trống
                </div>
              )}

              {/* Left Edge Interactive Grab & Turn Zone */}
              {leftPageIndex > 0 && (
                <div
                  className="absolute top-0 left-0 bottom-0 w-12 z-30 cursor-grab active:cursor-grabbing group/left-curl flex items-center justify-start pl-1 select-none"
                  title="Kéo sang phải hoặc bấm để lật trang trước"
                  onMouseDown={(e) => startDragFlip('prev', e)}
                >
                  <div className="w-5 h-9 rounded-r-md bg-stone-300/30 group-hover/left-curl:bg-stone-400/50 transition-colors pointer-events-none flex items-center justify-center">
                    <ChevronLeft className="w-3 h-3 text-stone-600" />
                  </div>
                </div>
              )}
            </div>

            {/* ================= RIGHT PAGE ================= */}
            <div 
              style={{ backgroundColor: '#fdfbf7', color: '#0f172a' }}
              className="flex-1 rounded-r-md p-7 pl-8 flex flex-col justify-between shadow-inner relative border-l border-stone-300/80 overflow-hidden paper-texture book-page font-sans group/page"
              onMouseUp={(e) => handlePageMouseUp(underneathRightLeaf?.pageNumber || rightPageIndex + 1, e)}
            >
              {underneathRightLeaf ? (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chapter Header (Drag handle) */}
                    <div 
                      onMouseDown={handleMouseDown}
                      className="pb-2 mb-3 border-b border-stone-200/90 flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
                    >
                      <span className="text-xs font-bold tracking-tight text-slate-800 truncate font-sans block flex-1 pr-2">
                        {underneathRightLeaf.chapterTitle}
                        {underneathRightLeaf.isContinuation ? ' (tiếp)' : ''}
                      </span>
                    </div>

                    {/* Page Body Text or PDF Rendered Page Image */}
                    {underneathRightLeaf.image ? (
                      <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center overflow-hidden bg-white/70 rounded">
                        <img
                          src={underneathRightLeaf.image}
                          alt={`Trang ${underneathRightLeaf.pageNumber}`}
                          className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                          draggable={false}
                        />
                        <div 
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity p-2 text-[13px] leading-relaxed overflow-y-auto no-scrollbar cursor-text select-text"
                          title="Bôi đen văn bản để hỏi Inteline / STudy"
                        >
                          <MathRenderer content={underneathRightLeaf.text} />
                        </div>
                      </div>
                    ) : (
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line font-sans selection:bg-slate-200 selection:text-slate-900 flex-1 overflow-y-auto no-scrollbar cursor-text select-text"
                      >
                        <MathRenderer content={underneathRightLeaf.text} />
                      </div>
                    )}
                  </div>

                  {/* Right Page Footer (Drag handle): Only Page Number in Bottom-Right Corner */}
                  <div 
                    onMouseDown={handleMouseDown}
                    className="flex-shrink-0 text-right text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200/80 mt-2 pr-2 select-none cursor-grab active:cursor-grabbing"
                  >
                    {underneathRightLeaf.pageNumber}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400 text-xs italic font-sans">
                  (Hết cuốn sách)
                </div>
              )}

              {/* Right Edge Interactive Grab & Turn Zone */}
              {rightPageIndex < totalPages - 1 && (
                <div
                  className="absolute top-0 right-0 bottom-0 w-12 z-30 cursor-grab active:cursor-grabbing group/right-curl flex items-center justify-end pr-1 select-none"
                  title="Kéo sang trái hoặc bấm để lật trang sau"
                  onMouseDown={(e) => startDragFlip('next', e)}
                >
                  <div className="w-5 h-9 rounded-l-md bg-stone-300/30 group-hover/right-curl:bg-stone-400/50 transition-colors pointer-events-none flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-stone-600" />
                  </div>
                </div>
              )}
            </div>

            {/* ================= 3D INTERACTIVE PAGE-CURL OVERLAY LAYER ================= */}
            {dragFlip && (
              <div 
                className="absolute inset-0 pointer-events-none z-40 overflow-visible"
                style={{ perspective: '2200px', transformStyle: 'preserve-3d' }}
              >
                {dragFlip.direction === 'next' ? (
                  /* Flipping Forward: Right Page Turning to Left */
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-10px',
                      width: '50%',
                      height: 'calc(100% + 20px)',
                      transformOrigin: 'left center',
                      transform: `rotateY(${-180 * dragFlip.progress}deg)`,
                      transformStyle: 'preserve-3d',
                      transition: dragFlip.isDragging ? 'none' : 'transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.32))'
                    }}
                  >
                    {/* Front Face: Current Right Leaf */}
                    <div 
                      className="absolute inset-0 p-7 pl-8 flex flex-col justify-between paper-texture book-page font-sans border-l border-stone-300 rounded-r-lg overflow-hidden"
                      style={{
                        backgroundColor: '#fdfbf7',
                        backfaceVisibility: 'hidden',
                        color: '#0f172a'
                      }}
                    >
                      {rightLeaf && (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="pb-2 mb-3 border-b border-stone-200/90 text-xs font-bold text-slate-800 flex-shrink-0">
                              {rightLeaf.chapterTitle}
                            </div>
                            {rightLeaf.image ? (
                              <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
                                <img
                                  src={rightLeaf.image}
                                  alt={`Trang ${rightLeaf.pageNumber}`}
                                  className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                                />
                              </div>
                            ) : (
                              <p className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line line-clamp-12">
                                {rightLeaf.text}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200 flex-shrink-0">
                            {rightLeaf.pageNumber}
                          </div>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to right, rgba(0,0,0,${Math.sin(dragFlip.progress * Math.PI) * 0.25}), transparent 40%)`
                        }}
                      />
                    </div>

                    {/* Back Face: Upcoming Left Leaf (Mirrored 180deg) */}
                    <div 
                      className="absolute inset-0 p-7 pr-8 flex flex-col justify-between paper-texture book-page font-sans border-r border-stone-300 rounded-l-lg overflow-hidden"
                      style={{
                        backgroundColor: '#fdfbf7',
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        color: '#0f172a'
                      }}
                    >
                      {paginatedLeaves[rightPageIndex + 1] ? (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="pb-2 mb-3 border-b border-stone-200/90 text-xs font-bold text-slate-800 flex-shrink-0">
                              {paginatedLeaves[rightPageIndex + 1].chapterTitle}
                            </div>
                            {paginatedLeaves[rightPageIndex + 1].image ? (
                              <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
                                <img
                                  src={paginatedLeaves[rightPageIndex + 1].image}
                                  alt={`Trang ${paginatedLeaves[rightPageIndex + 1].pageNumber}`}
                                  className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                                />
                              </div>
                            ) : (
                              <p className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line line-clamp-12">
                                {paginatedLeaves[rightPageIndex + 1].text}
                              </p>
                            )}
                          </div>
                          <div className="text-left text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200 flex-shrink-0">
                            {paginatedLeaves[rightPageIndex + 1].pageNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-stone-400 text-xs italic">
                          (Hết sách)
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to left, rgba(0,0,0,${Math.sin(dragFlip.progress * Math.PI) * 0.25}), transparent 40%)`
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Flipping Backward: Left Page Turning to Right */
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '-10px',
                      width: '50%',
                      height: 'calc(100% + 20px)',
                      transformOrigin: 'right center',
                      transform: `rotateY(${180 * dragFlip.progress}deg)`,
                      transformStyle: 'preserve-3d',
                      transition: dragFlip.isDragging ? 'none' : 'transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.32))'
                    }}
                  >
                    {/* Front Face: Current Left Leaf */}
                    <div 
                      className="absolute inset-0 p-7 pr-8 flex flex-col justify-between paper-texture book-page font-sans border-r border-stone-300 rounded-l-lg overflow-hidden"
                      style={{
                        backgroundColor: '#fdfbf7',
                        backfaceVisibility: 'hidden',
                        color: '#0f172a'
                      }}
                    >
                      {leftLeaf && (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="pb-2 mb-3 border-b border-stone-200/90 text-xs font-bold text-slate-800 flex-shrink-0">
                              {leftLeaf.chapterTitle}
                            </div>
                            {leftLeaf.image ? (
                              <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
                                <img
                                  src={leftLeaf.image}
                                  alt={`Trang ${leftLeaf.pageNumber}`}
                                  className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                                />
                              </div>
                            ) : (
                              <p className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line line-clamp-12">
                                {leftLeaf.text}
                              </p>
                            )}
                          </div>
                          <div className="text-left text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200 flex-shrink-0">
                            {leftLeaf.pageNumber}
                          </div>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to left, rgba(0,0,0,${Math.sin(dragFlip.progress * Math.PI) * 0.25}), transparent 40%)`
                        }}
                      />
                    </div>

                    {/* Back Face: Previous Right Leaf (Mirrored 180deg) */}
                    <div 
                      className="absolute inset-0 p-7 pl-8 flex flex-col justify-between paper-texture book-page font-sans border-l border-stone-300 rounded-r-lg overflow-hidden"
                      style={{
                        backgroundColor: '#fdfbf7',
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        color: '#0f172a'
                      }}
                    >
                      {paginatedLeaves[leftPageIndex - 1] && (
                        <div className="flex-1 flex flex-col justify-between overflow-hidden">
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="pb-2 mb-3 border-b border-stone-200/90 text-xs font-bold text-slate-800 flex-shrink-0">
                              {paginatedLeaves[leftPageIndex - 1].chapterTitle}
                            </div>
                            {paginatedLeaves[leftPageIndex - 1].image ? (
                              <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
                                <img
                                  src={paginatedLeaves[leftPageIndex - 1].image}
                                  alt={`Trang ${paginatedLeaves[leftPageIndex - 1].pageNumber}`}
                                  className="max-w-full max-h-full object-contain pointer-events-none select-none rounded-xs"
                                />
                              </div>
                            ) : (
                              <p className="text-[14.5px] leading-[1.72] text-slate-900 font-medium whitespace-pre-line line-clamp-12">
                                {paginatedLeaves[leftPageIndex - 1].text}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs font-mono font-semibold text-stone-600 pt-2 border-t border-stone-200 flex-shrink-0">
                            {paginatedLeaves[leftPageIndex - 1].pageNumber}
                          </div>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(to right, rgba(0,0,0,${Math.sin(dragFlip.progress * Math.PI) * 0.25}), transparent 40%)`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= BOTTOM TITLE BADGE (Drag handle - Miro-style clean white) ================= */}
        <div 
          onMouseDown={handleMouseDown}
          className="absolute top-full mt-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-white/95 text-slate-800 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md border border-slate-200/90 backdrop-blur-md pointer-events-auto select-none transition-all duration-200 z-20 cursor-grab active:cursor-grabbing hover:border-slate-300"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate max-w-[340px]">
            {cleanTitle}
          </span>
        </div>

        {/* ================= INLINE INTELINE POPOVER AT THE END OF HIGHLIGHTED TEXT ================= */}
        {selectionPopover && (
          <div 
            data-inteline-popover="true"
            style={{ left: selectionPopover.x, top: selectionPopover.y }}
            className="absolute -translate-x-1/2 z-50 animate-fade-in pointer-events-auto w-[340px] bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-300/90 p-3 select-text font-sans"
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
            <p className="text-[11.5px] italic text-stone-700 line-clamp-2 mb-2.5 bg-stone-50 p-2 rounded-lg border border-stone-200/80 leading-relaxed">
              &ldquo;{selectionPopover.text}&rdquo;
            </p>

            {/* AI Answer Box if answered */}
            {selectionPopover.answer && (
              <div className="mb-2.5 p-3 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] text-xs leading-relaxed text-[#15803D]">
                <div className="font-bold text-[#15803D] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#15803D]" />
                    <span>Cơ sở lý thuyết & Phân tích:</span>
                  </span>
                  <button
                    onClick={() => {
                      addStickyNote(`[Inteline Q&A]\n${selectionPopover.text.slice(0, 50)}...\n\n${selectionPopover.answer}`, item.x + 1000, item.y + 40, '#fef08a');
                      setSelectionPopover(null);
                    }}
                    className="text-[10px] text-[#15803D] hover:underline font-bold bg-white px-2 py-0.5 rounded border border-[#A7F3D0]"
                  >
                    + Ghim Note
                  </button>
                </div>
                <p className="whitespace-pre-line text-slate-900 font-medium">{selectionPopover.answer}</p>
              </div>
            )}

            {/* Quick Suggestion Pills (Warm Coral/Amber Accents) */}
            {!selectionPopover.answer && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                <button
                  disabled={selectionPopover.loading}
                  onClick={() => handleQuickAsk('Giải thích ngắn gọn đoạn này')}
                  className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[11px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
                >
                  Giải thích ngắn
                </button>
                <button
                  disabled={selectionPopover.loading}
                  onClick={() => handleQuickAsk('Cho ví dụ thực tế về đoạn này')}
                  className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[11px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
                >
                  Cho ví dụ
                </button>
                <button
                  disabled={selectionPopover.loading}
                  onClick={() => handleQuickAsk('Tóm 1 ý chính quan trọng nhất')}
                  className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[11px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
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
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#16A34A] focus:bg-white text-slate-900"
              />
              <button
                onClick={() => handleQuickAsk()}
                disabled={selectionPopover.loading || !selectionPopover.question.trim()}
                className="p-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
              >
                {selectionPopover.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safe Delete Confirmation Dialog */}
      {isConfirmDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmDelete(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-300 max-w-sm w-full text-slate-900 animate-fade-in font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3 mx-auto">
              <Trash2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5 text-center">Xóa sách khỏi bàn học?</h4>
            <p className="text-xs text-slate-500 mb-4 text-center leading-relaxed">
              Bạn có chắc muốn cất cuốn sách <strong className="text-slate-800">&ldquo;{cleanTitle}&rdquo;</strong>? Bạn có thể mở lại bất cứ lúc nào từ Chợ Tài Liệu hoặc menu trên cùng.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsConfirmDelete(false)} 
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsConfirmDelete(false);
                  removeDeskItem(item.id);
                }} 
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Full Screen Document Reader Modal */}
      {isFullScreen && (
        <FullScreenDocModal
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          item={item}
          initialPageIndex={leftPageIndex}
        />
      )}

      {/* STudy Tools Modal */}
      <StudyToolsModal
        item={item}
        isOpen={isStudyOpen}
        onClose={() => setIsStudyOpen(false)}
      />

      {/* Full Inteline Modal for expanded multi-turn chat if needed */}
      {intelineModalState && (
        <IntelineModal
          sourceItem={item}
          pageNumber={intelineModalState.pageNumber}
          selectedText={intelineModalState.selectedText}
          isOpen={intelineModalState.isOpen}
          onClose={() => setIntelineModalState(null)}
        />
      )}
    </>
  );
}

export const BookSpread = React.memo(BookSpreadComponent);
