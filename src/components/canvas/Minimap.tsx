'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { X } from 'lucide-react';

interface MinimapProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const Minimap = React.memo(function Minimap({ isVisible = true, onClose }: MinimapProps) {
  const { activeSpace, transform, setTransform } = useStudySpace();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Minimap dimensions
  const miniWidth = 190;
  const miniHeight = 120;
  const pad = 10;

  // Window viewport representation
  const [viewSize, setViewSize] = useState(() => 
    typeof window !== 'undefined' 
      ? { width: window.innerWidth, height: window.innerHeight } 
      : { width: 1200, height: 800 }
  );

  useEffect(() => {
    setViewSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setViewSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute camera world viewport
  const camWorldLeft = -transform.x / transform.scale;
  const camWorldTop = -transform.y / transform.scale;
  const camWorldWidth = viewSize.width / transform.scale;
  const camWorldHeight = viewSize.height / transform.scale;
  const camWorldRight = camWorldLeft + camWorldWidth;
  const camWorldBottom = camWorldTop + camWorldHeight;

  // Compute bounding box encompassing all items AND the viewport
  const { minX, minY, scale, offsetX, offsetY } = useMemo(() => {
    let itemsMinX = 0;
    let itemsMaxX = 1200;
    let itemsMinY = 0;
    let itemsMaxY = 800;

    if (activeSpace.items.length > 0) {
      itemsMinX = Math.min(...activeSpace.items.map(i => i.x));
      itemsMaxX = Math.max(...activeSpace.items.map(i => i.x + (i.type === 'book' ? 940 : i.type === 'paper' ? 360 : 220)));
      itemsMinY = Math.min(...activeSpace.items.map(i => i.y));
      itemsMaxY = Math.max(...activeSpace.items.map(i => i.y + (i.type === 'book' ? 630 : i.type === 'paper' ? 440 : 200)));
    }

    const bMinX = Math.min(itemsMinX, camWorldLeft) - 200;
    const bMaxX = Math.max(itemsMaxX, camWorldRight) + 200;
    const bMinY = Math.min(itemsMinY, camWorldTop) - 200;
    const bMaxY = Math.max(itemsMaxY, camWorldBottom) + 200;

    const boundsW = Math.max(bMaxX - bMinX, 1000);
    const boundsH = Math.max(bMaxY - bMinY, 700);

    const usableW = miniWidth - pad * 2;
    const usableH = miniHeight - pad * 2;
    const s = Math.min(usableW / boundsW, usableH / boundsH);

    const ox = pad + (usableW - boundsW * s) / 2;
    const oy = pad + (usableH - boundsH * s) / 2;

    return { minX: bMinX, minY: bMinY, scale: s, offsetX: ox, offsetY: oy };
  }, [activeSpace.items, camWorldLeft, camWorldRight, camWorldTop, camWorldBottom]);

  if (!isVisible) return null;

  // World to Minimap converters
  const toMiniX = (wx: number) => offsetX + (wx - minX) * scale;
  const toMiniY = (wy: number) => offsetY + (wy - minY) * scale;
  const toWorldX = (mx: number) => minX + (mx - offsetX) / scale;
  const toWorldY = (my: number) => minY + (my - offsetY) / scale;

  // Viewport Frame coordinates on minimap
  const rectX = toMiniX(camWorldLeft);
  const rectY = toMiniY(camWorldTop);
  const rectW = Math.max(16, camWorldWidth * scale);
  const rectH = Math.max(12, camWorldHeight * scale);

  const moveCameraTo = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const targetWorldCenterX = toWorldX(clickX);
    const targetWorldCenterY = toWorldY(clickY);

    const newX = viewSize.width / 2 - targetWorldCenterX * transform.scale;
    const newY = viewSize.height / 2 - targetWorldCenterY * transform.scale;

    setTransform(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavigating(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    moveCameraTo(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isNavigating) return;
    e.preventDefault();
    e.stopPropagation();
    moveCameraTo(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsNavigating(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ width: miniWidth, height: miniHeight }}
      className="bg-white/95 border border-slate-300 rounded-xl relative overflow-hidden cursor-crosshair shadow-md backdrop-blur-md group select-none touch-none opacity-80 hover:opacity-100 transition-opacity duration-200"
      title="Bản đồ thu nhỏ bàn học (Kéo hoặc Click để điều hướng camera)"
    >
      {/* Collapse button */}
      {onClose && (
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Thu gọn bản đồ (Phím M)"
          className="absolute top-1 right-1 text-slate-400 hover:text-slate-800 p-0.5 rounded hover:bg-slate-100 transition-colors z-20 cursor-pointer pointer-events-auto"
        >
          <X className="w-3 h-3 stroke-[2.4]" />
        </button>
      )}

      {/* Subtle Radar Background Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px'
        }}
      />

      {/* Center crosshair */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200/80 pointer-events-none" />
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200/80 pointer-events-none" />

      {/* Desk Items on Minimap */}
      {activeSpace.items.map(item => {
        const itemRawW = item.width || (item.type === 'book' ? 980 : item.type === 'paper' ? 380 : item.type === 'code_block' ? 480 : item.type === 'mind_map' ? 240 : 200);
        const itemRawH = item.height || (item.type === 'book' ? 640 : item.type === 'paper' ? 490 : item.type === 'code_block' ? 200 : item.type === 'mind_map' ? 64 : 180);
        const itemW = itemRawW * scale;
        const itemH = itemRawH * scale;
        const itemX = toMiniX(item.x);
        const itemY = toMiniY(item.y);

        const getBgClass = () => {
          if (item.type === 'book') return 'bg-slate-800 border border-slate-600';
          if (item.type === 'paper') return 'bg-emerald-500/90 border border-emerald-600';
          if (item.type === 'code_block') return 'bg-[#060b1c] border border-cyan-500/80';
          if (item.type === 'mind_map') return 'bg-purple-500 border border-purple-400 rounded-full';
          if (item.type === 'sticker') return 'bg-amber-400 border border-amber-300';
          return 'bg-amber-400 border border-amber-500';
        };

        return (
          <div
            key={item.id}
            style={{
              left: itemX,
              top: itemY,
              width: Math.max(6, itemW),
              height: Math.max(4, itemH)
            }}
            className={`absolute rounded-[2px] shadow-xs pointer-events-none transition-all flex items-center justify-center ${getBgClass()}`}
          >
            {item.type === 'book' && (
              <div className="w-[1px] h-full bg-slate-500 opacity-60" />
            )}
          </div>
        );
      })}

      {/* Viewport Frame (Bounding Box Guarantee: Always within Minimap) */}
      <div
        style={{
          transform: `translate3d(${rectX}px, ${rectY}px, 0)`,
          width: rectW,
          height: rectH
        }}
        className="absolute top-0 left-0 border-2 border-cyan-500 bg-cyan-500/15 rounded-[3px] pointer-events-none shadow-[0_0_12px_rgba(6,182,212,0.4)] will-change-transform"
      >
        {/* Radar Corner Ticks */}
        <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-cyan-600" />
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t-2 border-r-2 border-cyan-600" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border-b-2 border-l-2 border-cyan-600" />
        <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b-2 border-r-2 border-cyan-600" />
      </div>

      <div className="absolute bottom-1.5 left-2 text-[9.5px] font-mono font-bold text-slate-700 pointer-events-none tracking-wider select-none">
        BẢN ĐỒ (Phím M)
      </div>
    </div>
  );
});
