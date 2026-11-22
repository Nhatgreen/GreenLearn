'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  X,
  StickyNote,
  Users,
} from 'lucide-react';
import type { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { MathRenderer } from '@/components/common/MathRenderer';
import { ItemDrawingOverlay } from '@/components/canvas/ItemDrawingOverlay';

interface PresentationItemProps {
  item: DeskItem;
  isSelected: boolean;
}

export const PresentationItem = React.memo(function PresentationItem({
  item,
  isSelected,
}: PresentationItemProps) {
  const { updateDeskItem, removeDeskItem, selectItem, bringToFront, transform } = useStudySpace();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; itemX: number; itemY: number } | null>(null);

  const slides = item.presentationData?.slides?.length
    ? item.presentationData.slides
    : item.pages.map((p, idx) => ({
        id: p.id,
        slideNumber: idx + 1,
        title: p.title || `Slide ${idx + 1}`,
        body: p.text,
        notes: p.notes,
        image: p.image,
      }));

  const currentIdx = Math.min(
    Math.max(0, item.presentationData?.currentSlideIndex ?? item.currentPageIndex ?? 0),
    Math.max(0, slides.length - 1)
  );
  const currentSlide = slides[currentIdx];
  const isMultiplayerRoom =
    typeof window !== 'undefined' && window.location.search.includes('room=');

  const w = item.width || 620;
  const h = item.height || 400;

  const goToSlide = (nextIndex: number) => {
    const clamped = Math.min(Math.max(0, nextIndex), Math.max(0, slides.length - 1));
    updateDeskItem(item.id, {
      currentPageIndex: clamped,
      presentationData: {
        slides,
        currentSlideIndex: clamped,
        sourceUrl: item.presentationData?.sourceUrl,
      },
    });
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToSlide(currentIdx + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(currentIdx - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, currentIdx, slides.length]);

  const handleHeaderPointerDown = (e: React.PointerEvent | React.MouseEvent) => {
    if ('button' in e && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    selectItem(item.id);
    bringToFront(item.id);

    const pointerId = 'pointerId' in e ? (e as React.PointerEvent).pointerId : null;
    const targetEl = e.currentTarget as HTMLElement;
    if (pointerId !== null && targetEl && targetEl.setPointerCapture) {
      try {
        targetEl.setPointerCapture(pointerId);
      } catch (err) {}
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };

    const handleMove = (ev: PointerEvent | MouseEvent) => {
      if (!dragRef.current) return;
      if ('cancelable' in ev && ev.cancelable) {
        ev.preventDefault();
      }
      const dx = (ev.clientX - dragRef.current.startX) / transform.scale;
      const dy = (ev.clientY - dragRef.current.startY) / transform.scale;
      updateDeskItem(item.id, {
        x: Math.round(dragRef.current.itemX + dx),
        y: Math.round(dragRef.current.itemY + dy),
      });
    };

    const handleUp = () => {
      dragRef.current = null;
      if (pointerId !== null && targetEl && targetEl.releasePointerCapture) {
        try {
          targetEl.releasePointerCapture(pointerId);
        } catch (err) {}
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          selectItem(item.id);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          selectItem(item.id);
        }}
        style={{
          position: 'absolute',
          left: item.x,
          top: item.y,
          width: w,
          height: h,
          transform: `rotate(${item.rotation || 0}deg) scale(${item.scale || 1})`,
          transformOrigin: 'top left',
          zIndex: item.zIndex,
        }}
        className={`bg-white rounded-xl border flex flex-col overflow-hidden shadow-lg select-text ${
          isSelected ? 'border-[#16A34A] ring-2 ring-[#16A34A]/25 shadow-xl' : 'border-slate-300'
        }`}
      >
        {/* Header Bar */}
        <div
          onPointerDown={handleHeaderPointerDown}
          onMouseDown={handleHeaderPointerDown}
          className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-green-50 text-[#16A34A] border border-green-200 flex items-center justify-center flex-shrink-0">
              <Presentation className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
            <span className="text-[10px] font-semibold text-[#16A34A] bg-green-50 border border-green-200 px-1.5 py-0.5 rounded flex-shrink-0">
              Slide {currentIdx + 1}/{slides.length}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Trình chiếu toàn màn hình"
              className="px-2 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Trình chiếu</span>
            </button>
            <button
              type="button"
              onClick={() => removeDeskItem(item.id)}
              title="Xóa bài trình chiếu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Slide Stage */}
        <div
          data-scrollable="true"
          className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-center"
        >
          {currentSlide?.image ? (
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="max-h-full max-w-full object-contain mx-auto rounded-lg"
            />
          ) : (
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 leading-snug border-b border-slate-200 pb-2">
                {currentSlide?.title}
              </h3>
              {currentSlide?.body && (
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  <MathRenderer content={currentSlide.body} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide Controls */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => goToSlide(currentIdx - 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={currentIdx >= slides.length - 1}
              onClick={() => goToSlide(currentIdx + 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
            {slides.map((sl, idx) => (
              <button
                key={sl.id || idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 cursor-pointer transition-colors ${
                  idx === currentIdx
                    ? 'bg-green-50 text-[#16A34A] border border-[#16A34A]'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {isMultiplayerRoom && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
              <Users className="w-3 h-3" />
              Đồng bộ
            </span>
          )}
        </div>

        <ItemDrawingOverlay itemId={item.id} />
      </div>

      {/* Fullscreen Presentation Mode */}
      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-overlay="true"
            className="fixed inset-0 z-[9996] bg-slate-950/95 flex flex-col text-white select-none"
          >
            {/* Top Bar */}
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Presentation className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                <span className="text-sm font-bold truncate">{item.title}</span>
                <span className="text-xs font-mono text-slate-400">
                  Slide {currentIdx + 1} / {slides.length}
                </span>
                {isMultiplayerRoom && (
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Đang trình chiếu đồng bộ phòng học
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentSlide?.notes && (
                  <button
                    type="button"
                    onClick={() => setShowNotes((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border ${
                      showNotes
                        ? 'bg-green-500/20 border-[#16A34A] text-green-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    Ghi chú
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main 16:9 Stage */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
              <div className="w-full max-w-5xl aspect-video bg-white text-slate-900 rounded-2xl shadow-2xl p-8 md:p-12 flex flex-col justify-center overflow-y-auto select-text">
                {currentSlide?.image ? (
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="max-h-full max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 border-b-2 border-slate-200 pb-4">
                      {currentSlide?.title}
                    </h2>
                    {currentSlide?.body && (
                      <div className="text-base md:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                        <MathRenderer content={currentSlide.body} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Speaker Notes Drawer */}
            {showNotes && currentSlide?.notes && (
              <div className="mx-auto mb-3 max-w-4xl w-full px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200">
                <span className="font-bold text-[#16A34A] mr-2">Ghi chú diễn giả:</span>
                {currentSlide.notes}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => goToSlide(currentIdx - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Slide trước
              </button>
              <span className="text-xs text-slate-400">Phím ← / → hoặc Space để chuyển slide · Esc để thoát</span>
              <button
                type="button"
                disabled={currentIdx >= slides.length - 1}
                onClick={() => goToSlide(currentIdx + 1)}
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Slide tiếp
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
});
