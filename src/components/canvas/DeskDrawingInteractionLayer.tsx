'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

export function DeskDrawingInteractionLayer() {
  const { 
    transform, 
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
    addCodeBlock,
    addMindMapNode,
    addSticker,
    startStroke, 
    appendPoint, 
    finishStroke,
    removeStrokesInBox
  } = useStudySpace();

  const [isAltPressed, setIsAltPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragBox, setDragBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

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
  }, [setActiveTool, setStickyCreationColor]);

  // Auto-hide tooltip after 5 seconds of tool selection
  useEffect(() => {
    setShowTooltip(true);
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeTool]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // If holding Alt, enter PAN MODE
    if (e.altKey || isAltPressed) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    setIsInteracting(true);

    if (isCreateNote || isAreaEraser) {
      setDragBox({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY
      });
      return;
    }

    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);

    if (isEraser) {
      // Delete strokes under touch point
      removeStrokesInBox({
        x1: worldX - 14,
        y1: worldY - 14,
        x2: worldX + 14,
        y2: worldY + 14
      });
      return;
    }

    // Pen / Highlighter / Smart Shape
    startStroke(
      { x: worldX, y: worldY },
      isHighlighter ? (penColor || '#facc15') : penColor,
      currentStrokeWidth,
      isHighlighter
    );
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panBy(dx, dy);
      return;
    }

    if (!isInteracting) return;

    if (isCreateNote || isAreaEraser) {
      setDragBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
      return;
    }

    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);

    if (isEraser) {
      removeStrokesInBox({
        x1: worldX - 14,
        y1: worldY - 14,
        x2: worldX + 14,
        y2: worldY + 14
      });
      return;
    }

    // Coalesced smooth points for Drawing
    const native = e.nativeEvent as PointerEvent;
    const events = typeof native?.getCoalescedEvents === 'function' 
      ? native.getCoalescedEvents() 
      : [e];
    for (const ev of events) {
      const { x: wx, y: wy } = screenToWorld(ev.clientX, ev.clientY);
      appendPoint({ x: wx, y: wy });
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

    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    if (isInteracting) {
      setIsInteracting(false);

      if (isCreateNote && dragBox) {
        // Convert screen client box to world coords
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

        // If user merely clicked without dragging, spawn centered at click position!
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
        } else {
          addStickyNote(noteText, finalX, finalY, noteColor, finalW, finalH);
        }

        setDragBox(null);
        setActiveTool('cursor');
        setStickyCreationColor(null);
        setStickyCreationTemplate?.(null);
        return;
      }

      if (isAreaEraser && dragBox) {
        const p1 = screenToWorld(dragBox.startX, dragBox.startY);
        const p2 = screenToWorld(dragBox.currentX, dragBox.currentY);
        const wX1 = Math.min(p1.x, p2.x);
        const wY1 = Math.min(p1.y, p2.y);
        const wX2 = Math.max(p1.x, p2.x);
        const wY2 = Math.max(p1.y, p2.y);

        removeStrokesInBox({ x1: wX1, y1: wY1, x2: wX2, y2: wY2 });
        setDragBox(null);
        return;
      }

      if (isPen || isHighlighter) {
        finishStroke();
      }
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
      {/* Full-Screen Interaction Capture Plane */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: isCreateNote ? `url('${getCreateNoteCursorSvg()}') 4 4, crosshair` : undefined }}
        className={`fixed inset-0 z-35 select-none touch-none ${getCursorStyle()}`}
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

      {/* Floating Mode Tooltip Guide (Miro-style clean white) */}
      {showTooltip && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2 bg-white/95 text-slate-800 text-xs px-4 py-2 rounded-full shadow-xl border border-slate-200/90 backdrop-blur-md animate-fade-in font-medium transition-opacity duration-300">
          <span className="w-2 h-2 rounded-full bg-[#E0562D] animate-pulse" />
          <span>
            {isCreateNote && (stickyCreationTemplate
              ? `Nhấp chuột vào bất kỳ vị trí nào trên bàn học để đặt: ${stickyCreationTemplate.typeLabel}`
              : 'Kéo thả chuột trên mặt bàn để tạo tờ note theo kích thước tùy ý (hoặc nhấp chuột để đặt note chuẩn)')}
            {activeTool === 'smart_shape' && 'Vẽ thông minh: Hãy phác thảo hình tròn, vuông, elip hoặc tam giác để AI tự động uốn nắn'}
            {activeTool === 'pen' && 'Bút vẽ: Kéo chuột để vẽ • Giữ Alt để di chuyển bàn học'}
            {activeTool === 'highlighter' && 'Bút dạ quang: Đánh dấu làm nổi bật tài liệu'}
            {activeTool === 'eraser' && 'Tẩy chạm: Nhấp chuột vào nét vẽ để xóa'}
            {activeTool === 'area_eraser' && 'Tẩy vùng: Kéo khung chữ nhật để xóa toàn bộ nét vẽ bên trong'}
          </span>
        </div>
      )}
    </>
  );
}
