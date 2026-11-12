'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

export function DeskDrawingInteractionLayer() {
  const { 
    transform, 
    setTransform,
    panBy, 
    activeTool, 
    setActiveTool,
    penColor, 
    penWidthLevel,
    stickyCreationColor,
    setStickyCreationColor,
    stickyCreationTemplate,
    setStickyCreationTemplate,
    addStickyNote,
    addBook,
    addCodeBlock,
    addMindMapNode,
    addSticker,
    startStroke, 
    appendPoint, 
    finishStroke,
    cancelStroke,
    isFingerDrawingEnabled,
    removeStrokesInBox
  } = useStudySpace();

  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragBox, setDragBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // Active pointers map: pointerId -> { x, y, pointerType, isPrimary }
  const activePointersRef = useRef<Map<number, { x: number; y: number; pointerType: string; isPrimary: boolean }>>(new Map());

  // Multi-touch pinch-zoom baseline
  const pinchStartRef = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);
  const isMultiTouchRef = useRef<boolean>(false);

  // Stroke lifecycle references
  const strokeStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStrokeActiveRef = useRef<boolean>(false);
  const pendingStrokeDataRef = useRef<{
    pointerId: number;
    points: { x: number; y: number }[];
    color: string;
    width: number;
    isHighlighter: boolean;
  } | null>(null);

  const isHighlighter = activeTool === 'highlighter';
  const isPen = activeTool === 'pen' || activeTool === 'smart_shape';
  const isEraser = activeTool === 'eraser';
  const isAreaEraser = activeTool === 'area_eraser';
  const isCreateNote = activeTool === 'create_note';

  // Convert screen coordinates to world coordinates considering desk rotation & scale
  const screenToWorld = (clientX: number, clientY: number) => {
    const dx = clientX - transform.x;
    const dy = clientY - transform.y;
    const deskRad = (-(transform.rotation || 0) * Math.PI) / 180;
    const unrotX = dx * Math.cos(deskRad) - dy * Math.sin(deskRad);
    const unrotY = dx * Math.sin(deskRad) + dy * Math.cos(deskRad);
    return {
      x: unrotX / transform.scale,
      y: unrotY / transform.scale
    };
  };

  // Determine stroke width
  const currentStrokeWidth = (() => {
    if (isHighlighter) {
      if (penWidthLevel === 'small') return 10;
      if (penWidthLevel === 'large') return 28;
      return 18;
    }
    if (penWidthLevel === 'small') return 2;
    if (penWidthLevel === 'large') return 7;
    return 3.5;
  })();

  // Listen to keyboard Alt key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.altKey) setIsAltPressed(true);
      if (e.key === 'Escape') {
        setActiveTool('cursor');
        setStickyCreationColor(null);
        setStickyCreationTemplate?.(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.altKey) setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setActiveTool, setStickyCreationColor, setStickyCreationTemplate]);

  // Global window listeners to reset pointers and prevent stuck states
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size === 0) {
        isMultiTouchRef.current = false;
        pinchStartRef.current = null;
        panStartRef.current = null;
      }
    };

    const handleGlobalBlur = () => {
      activePointersRef.current.clear();
      isMultiTouchRef.current = false;
      pinchStartRef.current = null;
      panStartRef.current = null;
      if (strokeStartTimerRef.current) {
        clearTimeout(strokeStartTimerRef.current);
        strokeStartTimerRef.current = null;
      }
      if (isStrokeActiveRef.current) {
        isStrokeActiveRef.current = false;
        cancelStroke();
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleGlobalBlur);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleGlobalBlur);
      if (strokeStartTimerRef.current) {
        clearTimeout(strokeStartTimerRef.current);
      }
    };
  }, [cancelStroke]);

  // Auto-hide tooltip after 5 seconds of tool selection
  useEffect(() => {
    setShowTooltip(true);
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeTool]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only accept left mouse click (button 0), or touch/pen touches
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    // Register active pointer
    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
      isPrimary: e.isPrimary,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // MULTI-POINTER DETECTED (2 or more touches):
    // Immediately cancel any in-progress stroke and switch to 2-finger pinch-zoom/pan
    if (activePointersRef.current.size >= 2) {
      // 1. Cancel pending stroke delay timer
      if (strokeStartTimerRef.current) {
        clearTimeout(strokeStartTimerRef.current);
        strokeStartTimerRef.current = null;
        pendingStrokeDataRef.current = null;
      }

      // 2. Cancel in-progress stroke immediately without saving to history/undo
      if (isStrokeActiveRef.current) {
        isStrokeActiveRef.current = false;
        cancelStroke();
      }

      // 3. Mark multi-touch mode active
      isMultiTouchRef.current = true;
      setIsInteracting(false);
      setIsPanning(false);
      setDragBox(null);

      // 4. Initialize pinch baseline
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      pinchStartRef.current = { dist: Math.max(dist, 1), mid };

      // Release capture so touches track smoothly together
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      return;
    }

    // SINGLE POINTER (activePointersRef.current.size === 1)
    // If still in multi-touch sequence (waiting for all fingers to lift), do not draw!
    if (isMultiTouchRef.current) {
      return;
    }

    // If holding Alt, enter PAN MODE
    if (e.altKey || isAltPressed) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // If pointerType is touch AND finger drawing is disabled (Stylus Only mode): Touch only pans canvas
    if (e.pointerType === 'touch' && !isFingerDrawingEnabled) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Create note / area eraser drag box
    if (isCreateNote || isAreaEraser) {
      setIsInteracting(true);
      setDragBox({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY
      });
      return;
    }

    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);

    // Eraser tap
    if (isEraser) {
      setIsInteracting(true);
      removeStrokesInBox({
        x1: worldX - 14,
        y1: worldY - 14,
        x2: worldX + 14,
        y2: worldY + 14
      });
      return;
    }

    // Pen / Highlighter / Smart Shape
    if (isPen || isHighlighter) {
      const color = isHighlighter ? (penColor || '#facc15') : penColor;
      const width = currentStrokeWidth;

      // Touch pointer: delay ~40ms to detect if a second finger is landing (pinch gesture)
      if (e.pointerType === 'touch') {
        const pId = e.pointerId;
        pendingStrokeDataRef.current = {
          pointerId: pId,
          points: [{ x: e.clientX, y: e.clientY }],
          color,
          width,
          isHighlighter,
        };

        if (strokeStartTimerRef.current) {
          clearTimeout(strokeStartTimerRef.current);
        }

        strokeStartTimerRef.current = setTimeout(() => {
          strokeStartTimerRef.current = null;
          if (
            activePointersRef.current.size === 1 &&
            !isMultiTouchRef.current &&
            pendingStrokeDataRef.current
          ) {
            const data = pendingStrokeDataRef.current;
            isStrokeActiveRef.current = true;
            setIsInteracting(true);
            const startPt = screenToWorld(data.points[0].x, data.points[0].y);
            startStroke(startPt, data.color, data.width, data.isHighlighter);

            // Append any points that moved during the 40ms buffer
            for (let i = 1; i < data.points.length; i++) {
              const pt = screenToWorld(data.points[i].x, data.points[i].y);
              appendPoint(pt);
            }
          }
        }, 40);
        return;
      }

      // Pen (Stylus) or Mouse: start drawing immediately
      isStrokeActiveRef.current = true;
      setIsInteracting(true);
      startStroke({ x: worldX, y: worldY }, color, width, isHighlighter);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
      isPrimary: e.isPrimary,
    });

    // 1. MULTI-TOUCH PINCH-ZOOM & PAN (2 or more pointers)
    if (activePointersRef.current.size >= 2 || isMultiTouchRef.current) {
      // Ensure stroke is canceled
      if (strokeStartTimerRef.current) {
        clearTimeout(strokeStartTimerRef.current);
        strokeStartTimerRef.current = null;
        pendingStrokeDataRef.current = null;
      }
      if (isStrokeActiveRef.current) {
        isStrokeActiveRef.current = false;
        cancelStroke();
      }

      if (activePointersRef.current.size >= 2 && pinchStartRef.current) {
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

        setTransform(prev => {
          const MIN_SCALE = 0.4;
          const MAX_SCALE = 2.5;
          const targetScale = prev.scale * factor;
          const newScale = Math.min(Math.max(Number(targetScale.toFixed(3)), MIN_SCALE), MAX_SCALE);
          const scaleChange = newScale / prev.scale;

          const newX = Math.round(mid.x - (mid.x - prev.x) * scaleChange + dx);
          const newY = Math.round(mid.y - (mid.y - prev.y) * scaleChange + dy);

          return {
            ...prev,
            x: newX,
            y: newY,
            scale: newScale,
          };
        });
      }
      return;
    }

    // 2. BUFFERING TOUCH MOVE DURING ~40MS INITIAL DELAY
    if (strokeStartTimerRef.current && pendingStrokeDataRef.current) {
      pendingStrokeDataRef.current.points.push({ x: e.clientX, y: e.clientY });
      return;
    }

    // 3. PANNING (Alt held or Touch with finger drawing disabled)
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panBy(dx, dy);
      return;
    }

    // 4. DRAWING STROKE (Pen / Highlighter / Smart Shape)
    if (isStrokeActiveRef.current && (isPen || isHighlighter)) {
      const native = e.nativeEvent as PointerEvent;
      const coalesced = typeof native?.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : null;
      const events = coalesced && coalesced.length > 0 ? coalesced : [e];
      for (const ev of events) {
        const cx = typeof ev.clientX === 'number' ? ev.clientX : e.clientX;
        const cy = typeof ev.clientY === 'number' ? ev.clientY : e.clientY;
        const { x: wx, y: wy } = screenToWorld(cx, cy);
        appendPoint({ x: wx, y: wy });
      }
      return;
    }

    if (!isInteracting) return;

    // 5. CREATE NOTE / AREA ERASER DRAG BOX
    if (isCreateNote || isAreaEraser) {
      setDragBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      return;
    }

    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);

    // 6. ERASER DRAG
    if (isEraser) {
      removeStrokesInBox({
        x1: worldX - 14,
        y1: worldY - 14,
        x2: worldX + 14,
        y2: worldY + 14
      });
      return;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    activePointersRef.current.delete(e.pointerId);

    // If there was a pending stroke timer (e.g. fast single-finger tap < 40ms):
    if (strokeStartTimerRef.current && pendingStrokeDataRef.current) {
      clearTimeout(strokeStartTimerRef.current);
      strokeStartTimerRef.current = null;
      if (!isMultiTouchRef.current) {
        const data = pendingStrokeDataRef.current;
        const pt = screenToWorld(data.points[0].x, data.points[0].y);
        startStroke(pt, data.color, data.width, data.isHighlighter);
        appendPoint({ x: pt.x + 0.1, y: pt.y + 0.1 });
        finishStroke();
      }
      pendingStrokeDataRef.current = null;
    }

    // If stroke was actively drawing:
    if (isStrokeActiveRef.current) {
      isStrokeActiveRef.current = false;
      if (!isMultiTouchRef.current) {
        finishStroke();
      } else {
        cancelStroke();
      }
    }

    // If dragging note or area eraser:
    if (isInteracting) {
      if (isCreateNote && dragBox) {
        const p1 = screenToWorld(dragBox.startX, dragBox.startY);
        const p2 = screenToWorld(dragBox.currentX, dragBox.currentY);
        const wX1 = p1.x;
        const wY1 = p1.y;
        const wX2 = p2.x;
        const wY2 = p2.y;

        const rawW = Math.abs(wX2 - wX1);
        const rawH = Math.abs(wY2 - wY1);

        const template = stickyCreationTemplate;
        const defW = template?.width || 220;
        const defH = template?.height || 200;

        let finalW = Math.max(rawW, 180);
        let finalH = Math.max(rawH, 160);
        let finalX = Math.min(wX1, wX2);
        let finalY = Math.min(wY1, wY2);

        if (rawW < 20 && rawH < 20) {
          finalX = Math.round(wX1 - defW / 2);
          finalY = Math.round(wY1 - defH / 2);
          finalW = defW;
          finalH = defH;
        }

        const noteText = template?.text || '';
        const noteColor = template?.color || stickyCreationColor || '#fef08a';

        if (template?.itemType === 'code_block') {
          addCodeBlock(template.codeSnippet || '', finalX, finalY, template.codeLanguage || 'javascript');
        } else if (template?.itemType === 'mind_map') {
          addMindMapNode(template.text || '', finalX, finalY, undefined, template.mindMapColor || '#a855f7');
        } else if (template?.itemType === 'sticker' && template.stickerData) {
          addSticker(template.stickerData, finalX, finalY, finalW, finalH);
        } else if (template?.itemType === 'book') {
          addBook(template.title || 'Sổ tay bài học', finalX, finalY, template.coverColor || 'brown', template.pages);
        } else {
          addStickyNote(noteText, finalX, finalY, noteColor, finalW, finalH);
        }

        setDragBox(null);
        setActiveTool('cursor');
        setStickyCreationColor(null);
        setStickyCreationTemplate?.(null);
      } else if (isAreaEraser && dragBox) {
        const p1 = screenToWorld(dragBox.startX, dragBox.startY);
        const p2 = screenToWorld(dragBox.currentX, dragBox.currentY);
        const wX1 = Math.min(p1.x, p2.x);
        const wY1 = Math.min(p1.y, p2.y);
        const wX2 = Math.max(p1.x, p2.x);
        const wY2 = Math.max(p1.y, p2.y);

        removeStrokesInBox({ x1: wX1, y1: wY1, x2: wX2, y2: wY2 });
        setDragBox(null);
      }
      setIsInteracting(false);
    }

    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    // When ALL pointers have been lifted, fully reset multi-touch and pan states
    if (activePointersRef.current.size === 0) {
      isMultiTouchRef.current = false;
      setIsPanning(false);
      panStartRef.current = null;
      setIsInteracting(false);
      isStrokeActiveRef.current = false;
      pendingStrokeDataRef.current = null;
      if (strokeStartTimerRef.current) {
        clearTimeout(strokeStartTimerRef.current);
        strokeStartTimerRef.current = null;
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    activePointersRef.current.delete(e.pointerId);

    if (strokeStartTimerRef.current) {
      clearTimeout(strokeStartTimerRef.current);
      strokeStartTimerRef.current = null;
      pendingStrokeDataRef.current = null;
    }

    if (isStrokeActiveRef.current) {
      isStrokeActiveRef.current = false;
      cancelStroke();
    }

    setDragBox(null);

    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (activePointersRef.current.size === 0) {
      isMultiTouchRef.current = false;
      setIsPanning(false);
      panStartRef.current = null;
      setIsInteracting(false);
      isStrokeActiveRef.current = false;
      pendingStrokeDataRef.current = null;
    }
  };

  // SVG Dynamic cursor definition for Sticky Notes & Extra Tools
  const getCreateNoteCursorSvg = () => {
    if (!stickyCreationTemplate) {
      const color = stickyCreationColor || '#fef08a';
      const encodedColor = encodeURIComponent(color);
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${encodedColor}" stroke="%23b45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M15 3v6h6"/></svg>`;
    }

    const { typeLabel, itemType } = stickyCreationTemplate;
    if (itemType === 'code_block' || typeLabel.includes('Code')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%23060b1c" stroke="%2338bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="3" fill="%23060b1c"/><polyline points="8 10 5 12 8 14"/><polyline points="16 10 19 12 16 14"/><line x1="13" x2="11" y1="8" y2="16"/></svg>`;
    }
    if (typeLabel.includes('Table')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%23f8fafc" stroke="%23E0562D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="3" fill="%23f8fafc"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`;
    }
    if (itemType === 'mind_map' || typeLabel.includes('Mind')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23faf5ff" stroke="%23a855f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="5" fill="%23faf5ff"/><circle cx="12" cy="12" r="1.5" fill="%23a855f7"/></svg>`;
    }
    if (itemType === 'sticker' || typeLabel.includes('Hình dán')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23fef9c3" stroke="%23eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 8.5 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 8.5" fill="%23fef08a"/></svg>`;
    }
    if (itemType === 'book' || typeLabel.includes('Bìa da') || typeLabel.includes('bìa da') || typeLabel.includes('Sách')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%235c3920" stroke="%23f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 2v20"/><path d="M10 7h6"/><path d="M10 11h6"/></svg>`;
    }
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="%23fdf2f8" stroke="%23db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  };

  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing';
    if (isAltPressed) return 'cursor-grab';
    if (isCreateNote) return `url('${getCreateNoteCursorSvg()}') 4 4, crosshair`;
    if (isEraser) return 'cursor-cell';
    if (isAreaEraser) return 'cursor-crosshair';
    return 'cursor-crosshair';
  };

  // Calculate live visual preview box styles
  const previewBoxStyle = dragBox ? {
    left: Math.min(dragBox.startX, dragBox.currentX),
    top: Math.min(dragBox.startY, dragBox.currentY),
    width: Math.max(Math.abs(dragBox.currentX - dragBox.startX), 1),
    height: Math.max(Math.abs(dragBox.currentY - dragBox.startY), 1),
  } : null;

  return (
    <>
      {/* Full-Screen Interaction Capture Plane with touch-action: none */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          cursor: isCreateNote ? `url('${getCreateNoteCursorSvg()}') 4 4, crosshair` : undefined,
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
        className={`fixed inset-0 z-35 select-none touch-none overscroll-none ${getCursorStyle()}`}
      >
        {/* Live Dragging Bounding Box Preview */}
        {dragBox && previewBoxStyle && (
          <div
            style={{
              position: 'absolute',
              left: previewBoxStyle.left,
              top: previewBoxStyle.top,
              width: previewBoxStyle.width,
              height: previewBoxStyle.height,
              backgroundColor: isCreateNote ? (stickyCreationColor || '#fef08a') : 'rgba(239, 68, 68, 0.12)',
              opacity: isCreateNote ? 0.75 : 1,
              borderColor: isCreateNote ? '#d97706' : '#dc2626',
            }}
            className="border-2 border-dashed rounded-md pointer-events-none shadow-lg flex items-center justify-center"
          >
            <span className="bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow-sm">
              {Math.round(previewBoxStyle.width / transform.scale)} × {Math.round(previewBoxStyle.height / transform.scale)}
            </span>
          </div>
        )}
      </div>

      {/* Floating Mode Tooltip Guide */}
      {showTooltip && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2 bg-white/95 text-slate-800 text-xs px-4 py-2 rounded-full shadow-xl border border-slate-200/90 backdrop-blur-md animate-fade-in font-medium transition-opacity duration-300">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>
            {isCreateNote && (stickyCreationTemplate
              ? `Nhấp chuột vào bất kỳ vị trí nào trên bàn học để đặt: ${stickyCreationTemplate.typeLabel}`
              : 'Kéo thả chuột trên mặt bàn để tạo tờ note theo kích thước tùy ý (hoặc nhấp chuột để đặt note chuẩn)')}
            {activeTool === 'smart_shape' && 'Vẽ thông minh: Hãy phác thảo hình tròn, vuông, elip hoặc tam giác để AI tự động uốn nắn'}
            {activeTool === 'pen' && (isFingerDrawingEnabled ? 'Bút vẽ: Dùng 1 ngón hoặc bút để vẽ • Dùng 2 ngón để zoom/pan' : 'Bút vẽ (Stylus Only): Chỉ vẽ bằng bút cảm ứng • Dùng ngón tay để zoom/pan')}
            {activeTool === 'highlighter' && 'Bút dạ quang: Đánh dấu làm nổi bật tài liệu'}
            {activeTool === 'eraser' && 'Tẩy chạm: Nhấp chuột vào nét vẽ để xóa'}
            {activeTool === 'area_eraser' && 'Tẩy vùng: Kéo khung chữ nhật để xóa toàn bộ nét vẽ bên trong'}
          </span>
        </div>
      )}
    </>
  );
}
