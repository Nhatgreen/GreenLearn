'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FileUp, Eye } from 'lucide-react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { DeskGrid } from './DeskGrid';
import { PaperSheet } from '../objects/PaperSheet';
import { BookSpread } from '../objects/BookSpread';
import { StickyNoteItem } from '../objects/StickyNoteItem';
import { CodeBlockItem } from '../objects/CodeBlockItem';
import { MindMapNodeItem } from '../objects/MindMapNodeItem';
import { StickerItem } from '../objects/StickerItem';
import { MindMapConnectors } from './MindMapConnectors';
import { VisualLinkThreads } from './VisualLinkThreads';
import { DeskDrawingCanvas } from './DeskDrawingCanvas';
import { DeskDrawingInteractionLayer } from './DeskDrawingInteractionLayer';
import { isItemVisible } from '@/lib/viewportCulling';
import { parsePdfFile } from '@/services/PdfParserService';

export function InfiniteDesk() {
  const { 
    activeSpace, 
    transform, 
    panBy, 
    zoomBy, 
    rotateDeskBy,
    resetDeskRotation,
    selectItem, 
    selectedItemId,
    addUploadedDocument,
    activeTool,
    isViewRotateMode,
    focusedItemId,
    isFocusNoticeVisible,
    triggerFocusNotice,
    exitFocusMode,
    setTransform,
    fitAllToScreen
  } = useStudySpace();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isRotatingView, setIsRotatingView] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active pointers map for multi-touch (pinch-to-zoom and 2-finger pan)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{
    dist: number;
    mid: { x: number; y: number };
  } | null>(null);

  // SVG Bi-directional View Rotation Cursor
  const rotateCursorSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M7 16 A 10 10 0 0 1 25 16" stroke="white" stroke-width="4.5" stroke-linecap="round"/><path d="M7 16 A 10 10 0 0 1 25 16" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><path d="M4 12 L7 16 L11 13" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12 L7 16 L11 13" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 12 L25 16 L21 13" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 12 L25 16 L21 13" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Keyboard navigation (WASD / Arrow Keys for Camera Pan)
  useEffect(() => {
    const activeKeys = new Set<string>();
    let animId: number | null = null;

    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        (el as HTMLElement).isContentEditable ||
        Boolean(el.closest('[contenteditable="true"]'))
      );
    };

    const updateMovement = () => {
      if (activeKeys.size === 0) {
        animId = null;
        return;
      }

      // WASD / Arrow keys for camera pan navigation
      let dx = 0;
      let dy = 0;
      const speed = 14;

      if (activeKeys.has('w') || activeKeys.has('arrowup')) dy += speed;
      if (activeKeys.has('s') || activeKeys.has('arrowdown')) dy -= speed;
      if (activeKeys.has('a') || activeKeys.has('arrowleft')) dx += speed;
      if (activeKeys.has('d') || activeKeys.has('arrowright')) dx -= speed;

      if (dx !== 0 || dy !== 0) {
        panBy(dx, dy);
      }

      animId = requestAnimationFrame(updateMovement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;

      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (focusedItemId) {
          e.preventDefault();
          triggerFocusNotice();
          return;
        }
        if (!activeKeys.has(k)) {
          activeKeys.add(k);
          if (!animId) {
            animId = requestAnimationFrame(updateMovement);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      activeKeys.delete(k);
    };

    const handleWindowBlur = () => {
      activeKeys.clear();
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [panBy, focusedItemId, triggerFocusNotice]);

  // Smooth RAF-coalesced Wheel Zoom: eliminates frame drops and lag
  const wheelZoomRafRef = useRef<number | null>(null);
  const pendingWheelFactorRef = useRef<number>(1);
  const wheelOriginRef = useRef<{ x: number; y: number } | null>(null);
  const zoomByRef = useRef(zoomBy);
  zoomByRef.current = zoomBy;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      // Prevent canvas zoom if scrolling inside an explicit modal dialog or active full overlay
      if (
        target.closest('[role="dialog"]') ||
        target.closest('[data-modal="true"]') ||
        target.closest('.fixed.inset-0') ||
        target.closest('[data-focus-notice="true"]')
      ) {
        return;
      }
      e.preventDefault();

      // Proportional zoom delta: smooth on trackpads, responsive on mouse wheels
      const delta = e.deltaY;
      const normalizedDelta = Math.max(-120, Math.min(120, delta));
      const factor = Math.exp(-normalizedDelta * 0.0016);

      pendingWheelFactorRef.current *= factor;
      wheelOriginRef.current = { x: e.clientX, y: e.clientY };

      if (!wheelZoomRafRef.current) {
        wheelZoomRafRef.current = requestAnimationFrame(() => {
          wheelZoomRafRef.current = null;
          const accumulatedFactor = pendingWheelFactorRef.current;
          const origin = wheelOriginRef.current;
          pendingWheelFactorRef.current = 1;
          wheelOriginRef.current = null;

          if (origin && Math.abs(accumulatedFactor - 1) > 0.0005) {
            zoomByRef.current(accumulatedFactor, origin.x, origin.y);
          }
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelZoomRafRef.current) {
        cancelAnimationFrame(wheelZoomRafRef.current);
      }
    };
  }, []);

  // Prevent default iOS Safari gesture zoom (pinch on screen) and Ctrl+wheel browser zoom
  useEffect(() => {
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const handleCtrlWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    window.addEventListener('wheel', handleCtrlWheel, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('wheel', handleCtrlWheel);
    };
  }, []);

  // Window pointer event listeners for 2-finger pinch-zoom/pan & 1-finger pan
  useEffect(() => {
    let rafId: number | null = null;
    let pendingFactor = 1;
    let pendingMid: { x: number; y: number } | null = null;
    let pendingDx = 0;
    let pendingDy = 0;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!activePointersRef.current.has(e.pointerId)) return;
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Two-finger Pinch-to-Zoom & Pan Gesture
      if (activePointersRef.current.size === 2 && pinchStartRef.current) {
        const pts = Array.from(activePointersRef.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const mid = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };

        const prevDist = pinchStartRef.current.dist;
        const prevMid = pinchStartRef.current.mid;

        const factor = dist / prevDist;
        const dx = mid.x - prevMid.x;
        const dy = mid.y - prevMid.y;

        pinchStartRef.current = { dist: Math.max(dist, 1), mid };

        pendingFactor *= factor;
        pendingMid = mid;
        pendingDx += dx;
        pendingDy += dy;

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            const curFactor = pendingFactor;
            const curMid = pendingMid;
            const curDx = pendingDx;
            const curDy = pendingDy;

            pendingFactor = 1;
            pendingMid = null;
            pendingDx = 0;
            pendingDy = 0;

            if (curMid) {
              setTransform(prev => {
                const MIN_SCALE = 0.4;
                const MAX_SCALE = 2.5;
                const targetScale = prev.scale * curFactor;
                const newScale = Math.min(Math.max(Number(targetScale.toFixed(3)), MIN_SCALE), MAX_SCALE);
                const scaleChange = newScale / prev.scale;

                // Zoom around the midpoint between the 2 fingers + pan offset
                const newX = Math.round(curMid.x - (curMid.x - prev.x) * scaleChange + curDx);
                const newY = Math.round(curMid.y - (curMid.y - prev.y) * scaleChange + curDy);

                return {
                  ...prev,
                  x: newX,
                  y: newY,
                  scale: newScale,
                };
              });
            }
          });
        }
        return;
      }

      // Single-finger or mouse canvas pan
      if (panStartRef.current && activePointersRef.current.size === 1) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panBy(dx, dy);
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);

      if (activePointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }

      if (activePointersRef.current.size === 1) {
        const remaining = Array.from(activePointersRef.current.values())[0];
        panStartRef.current = { x: remaining.x, y: remaining.y };
      } else {
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [panBy, setTransform]);

  // Global View Rotation when isViewRotateMode is toggled ON (User can drag anywhere to rotate)
  const handleMouseDownCapture = (e: React.MouseEvent) => {
    if (focusedItemId && isViewRotateMode && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      triggerFocusNotice();
      return;
    }

    if (isViewRotateMode && e.button === 0) {
      // Don't intercept clicks on HUD buttons or modals
      const target = e.target as HTMLElement;
      if (target.closest('button[title*="xoay"]') || target.closest('[data-hud="true"]') || target.closest('[data-focus-notice="true"]')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsRotatingView(true);
      let lastX = e.clientX;

      const handleRotateMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - lastX;
        lastX = moveEvent.clientX;
        // Dragging right rotates view left; dragging left rotates view right
        rotateDeskBy(-dx * 0.35);
      };

      const handleRotateMouseUp = () => {
        setIsRotatingView(false);
        window.removeEventListener('mousemove', handleRotateMouseMove);
        window.removeEventListener('mouseup', handleRotateMouseUp);
      };

      window.addEventListener('mousemove', handleRotateMouseMove);
      window.addEventListener('mouseup', handleRotateMouseUp);
    }
  };

  const handleDoubleClickCapture = (e: React.MouseEvent) => {
    if (isViewRotateMode) {
      e.preventDefault();
      e.stopPropagation();
      resetDeskRotation();
    }
  };

  // Background pointer down (Canvas Pan / Multi-touch gesture)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isViewRotateMode) return;
    if (activeTool !== 'cursor') return;

    const target = e.target as HTMLElement;

    // Don't pan if clicking an interactive control
    const isInteractive = Boolean(
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[data-focus-notice="true"]')
    );

    const isDeskItem = Boolean(target.closest('[data-desk-item="true"]'));

    if (isInteractive) return;

    if (focusedItemId) {
      triggerFocusNotice();
      return;
    }

    // Always register pointer for pinch tracking (even if on a desk item)
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // If 2 or more touches are detected, prioritize pinch-to-zoom & 2-finger pan
    if (activePointersRef.current.size === 2) {
      setIsPanning(false);
      panStartRef.current = null;
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      pinchStartRef.current = { dist: Math.max(dist, 1), mid };
      return;
    }

    // If 1 pointer on a desk item, let the item's own drag handler handle it
    if (isDeskItem) {
      return;
    }

    // Deselect active item when clicking empty space
    selectItem(null);

    // Single pointer on empty desk space -> pan canvas
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  // Double click while in rotate mode resets view rotation to 0°
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isViewRotateMode) {
      e.preventDefault();
      resetDeskRotation();
    }
  };

  // Drag and drop external file directly onto desk
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    for (const file of files) {
      const fileName = file.name;
      const rawName = fileName.replace(/\.[^/.]+$/, '');
      const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      const isText = file.type.includes('text') || fileName.endsWith('.md') || fileName.endsWith('.txt');

      try {
        if (isPdf) {
          const parsedPages = await parsePdfFile(file);
          if (parsedPages.length > 0) {
            addUploadedDocument(rawName, parsedPages);
            continue;
          }
        } else if (isImage) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          addUploadedDocument(rawName, [{
            title: rawName,
            text: '',
            image: dataUrl,
          }]);
          continue;
        } else if (isText) {
          const text = await file.text();
          const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
          const pages = paragraphs.length > 0 
            ? paragraphs.map((para, i) => ({ title: `Trang ${i + 1}`, text: para }))
            : [{ title: fileName, text }];
          addUploadedDocument(fileName, pages);
          continue;
        }

        // Fallback: try reading as text
        try {
          const text = await file.text();
          addUploadedDocument(fileName, [{ title: fileName, text }]);
        } catch {
          addUploadedDocument(fileName, [{ title: fileName, text: `Tệp ${fileName}` }]);
        }
      } catch (err) {
        console.error('Lỗi nạp tệp kéo thả vào bàn học:', err);
      }
    }
  };

  const getDeskCursor = () => {
    if (isRotatingView) return 'cursor-grabbing';
    if (isViewRotateMode) return 'cursor-grab';
    if (isPanning) return 'cursor-grabbing';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      onMouseDownCapture={handleMouseDownCapture}
      onDoubleClickCapture={handleDoubleClickCapture}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-screen h-[100dvh] overflow-hidden select-none touch-none overscroll-none ${getDeskCursor()}`}
      style={{
        touchAction: 'none',
        overscrollBehavior: 'none',
        cursor: isRotatingView
          ? 'grabbing'
          : isViewRotateMode
          ? `url('${rotateCursorSvg}') 16 16, grab`
          : undefined
      }}
    >
      {/* Visual Desk Grid Background */}
      <DeskGrid />

      {/* Drop Target Overlay Highlight (Clean White Miro Styling) */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-slate-900/5 border-4 border-dashed border-[#16A34A]/60 pointer-events-none flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-white/95 text-slate-800 font-semibold px-6 py-3.5 rounded-2xl border border-slate-300 shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <FileUp className="w-5 h-5 text-[#16A34A]" />
            <span>Thả tệp vào đây để mở trên bàn học</span>
          </div>
        </div>
      )}

      {/* 2.5D World Transform Container (Crisp Vector Font Rendering at All Zoom Levels) */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `translate(${Math.round(transform.x)}px, ${Math.round(transform.y)}px) rotate(${transform.rotation || 0}deg) scale(${transform.scale})`,
          transformOrigin: '0 0',
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Render all Desk Items (with Viewport Culling optimization) */}
        {activeSpace.items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const isFocused = focusedItemId === item.id;
          const isVisible =
            isSelected ||
            isFocused ||
            isItemVisible(
              {
                x: item.x,
                y: item.y,
                width: item.width || (item.type === 'book' ? 980 : item.type === 'paper' ? 480 : 260),
                height: item.height || (item.type === 'book' ? 640 : item.type === 'paper' ? 640 : 260),
                rotation: item.rotation,
              },
              {
                x: transform.x,
                y: transform.y,
                scale: transform.scale,
                viewportW: typeof window !== 'undefined' ? window.innerWidth : 1920,
                viewportH: typeof window !== 'undefined' ? window.innerHeight : 1080,
              },
              500
            );

          if (!isVisible) return null;

          if (item.type === 'book') {
            return <BookSpread key={item.id} item={item} isSelected={isSelected} />;
          }
          if (item.type === 'paper') {
            return <PaperSheet key={item.id} item={item} isSelected={isSelected} />;
          }
          if (item.type === 'sticky_note') {
            return <StickyNoteItem key={item.id} item={item} isSelected={isSelected} />;
          }
          if (item.type === 'code_block') {
            return <CodeBlockItem key={item.id} item={item} isSelected={isSelected} />;
          }
          if (item.type === 'mind_map') {
            return <MindMapNodeItem key={item.id} item={item} isSelected={isSelected} />;
          }
          if (item.type === 'sticker') {
            return <StickerItem key={item.id} item={item} isSelected={isSelected} />;
          }
          return null;
        })}

        {/* Dynamic Branch Lines Connecting Mind Map Parent and Child Nodes */}
        <MindMapConnectors />

        {/* Freehand Drawing & Highlighter Strokes Layer */}
        <DeskDrawingCanvas />

        {/* Physical Detective Red String Threads on TOP of items and pins */}
        <VisualLinkThreads />
      </div>

      {/* Top-Level Full-Screen Drawing, Creation & Eraser Layer */}
      {activeTool !== 'cursor' && (
        <DeskDrawingInteractionLayer />
      )}

      {/* Focus Mode Toast Notification when attempting to navigate/pan/zoom */}
      {isFocusNoticeVisible && (
        <div 
          data-focus-notice="true"
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 bg-white/95 text-slate-800 border border-slate-300/90 shadow-2xl rounded-full text-xs font-semibold backdrop-blur-md animate-fade-in pointer-events-auto select-none"
        >
          <Eye className="w-4 h-4 text-[#16A34A]" />
          <span>Đang tập trung</span>
          <button
            type="button"
            onClick={exitFocusMode}
            className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 ml-1"
          >
            (nhấn để thoát)
          </button>
        </div>
      )}
    </div>
  );
}
