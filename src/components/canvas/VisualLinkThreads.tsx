'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

export const VisualLinkThreads = React.memo(function VisualLinkThreads() {
  const { activeSpace, threads, transform, updateThreadSourceOffset } = useStudySpace();

  const transformRef = useRef(transform);
  transformRef.current = transform;

  const [draggingPin, setDraggingPin] = useState<{
    threadId: string;
    sourceItemId: string;
    startClientX: number;
    startClientY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    currentOffsetX: number;
    currentOffsetY: number;
  } | null>(null);

  const dragRef = useRef(draggingPin);
  dragRef.current = draggingPin;

  // Window listeners for smooth global drag of pushpin
  useEffect(() => {
    if (!draggingPin) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cur = dragRef.current;
      if (!cur) return;

      const currentScale = transformRef.current.scale || 1;
      const deltaX = (e.clientX - cur.startClientX) / currentScale;
      const deltaY = (e.clientY - cur.startClientY) / currentScale;

      const nextOffset = {
        x: Math.round(cur.initialOffsetX + deltaX),
        y: Math.round(cur.initialOffsetY + deltaY)
      };

      setDraggingPin(prev => prev ? {
        ...prev,
        currentOffsetX: nextOffset.x,
        currentOffsetY: nextOffset.y
      } : null);

      updateThreadSourceOffset(cur.threadId, nextOffset);
    };

    const handleMouseUp = () => {
      setDraggingPin(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPin, updateThreadSourceOffset]);

  if (!threads || threads.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 100 }}
    >
      <defs>
        {/* Soft shadow for physical detective pinned thread */}
        <filter id="threadShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.3" />
        </filter>
      </defs>

      {threads.map(thread => {
        const sourceItem = activeSpace.items.find(i => i.id === thread.sourceItemId);
        const targetSticky = activeSpace.items.find(i => i.id === thread.targetStickyId);

        if (!sourceItem || !targetSticky) return null;

        const defaultOffsetX = sourceItem.type === 'book' ? 640 : 300;
        const defaultOffsetY = 140;

        const offsetX = draggingPin && draggingPin.threadId === thread.id
          ? draggingPin.currentOffsetX
          : (thread.sourceOffset?.x ?? defaultOffsetX);

        const offsetY = draggingPin && draggingPin.threadId === thread.id
          ? draggingPin.currentOffsetY
          : (thread.sourceOffset?.y ?? defaultOffsetY);

        // Source anchor on book / paper
        const startX = sourceItem.x + offsetX;
        const startY = sourceItem.y + offsetY;

        // Target anchor on sticky note header pin
        const endX = targetSticky.x + 24;
        const endY = targetSticky.y + 16;

        // Realistic hanging thread curve: Smart routing avoiding document text
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.hypot(deltaX, deltaY);

        // If thread originates inside a book and heads right, route gracefully above the book header
        const isCrossingBookPages = sourceItem.type === 'book' && endX > sourceItem.x + 480;

        let cp1X: number, cp1Y: number, cp2X: number, cp2Y: number;

        if (isCrossingBookPages) {
          // Arch above the top margin of the book so it NEVER cuts across text
          const archApexY = Math.min(sourceItem.y - 22, startY - 40, endY - 30);
          cp1X = startX + deltaX * 0.25;
          cp1Y = archApexY;
          cp2X = startX + deltaX * 0.75;
          cp2Y = Math.min(archApexY + 12, endY - 15);
        } else {
          const sag = Math.min(distance * 0.1, 28);
          cp1X = startX + deltaX * 0.35;
          cp1Y = startY + deltaY * 0.25 + sag;
          cp2X = startX + deltaX * 0.65;
          cp2Y = startY + deltaY * 0.75 + sag;
        }

        const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        const isThisPinDragging = draggingPin?.threadId === thread.id;

        // Calculate cubic Bezier curve midpoint for relationship label badge
        const t = 0.5;
        const midX = Math.round((1-t)**3 * startX + 3*(1-t)**2 * t * cp1X + 3*(1-t) * t**2 * cp2X + t**3 * endX);
        const midY = Math.round((1-t)**3 * startY + 3*(1-t)**2 * t * cp1Y + 3*(1-t) * t**2 * cp2Y + t**3 * endY);

        return (
          <g key={thread.id} className="transition-all duration-75">
            {/* Thread Shadow under the yarn */}
            <path
              d={pathData}
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.8"
              strokeOpacity="0.12"
              filter="url(#threadShadow)"
            />

            {/* Realistic Red Detective String (Mảnh hơn & Nửa trong suốt để chống rối mắt) */}
            <path
              d={pathData}
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />

            {/* Subtle fiber texture line */}
            <path
              d={pathData}
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              strokeOpacity="0.5"
            />

            {/* Source Physical Pushpin with Dedicated Small Hitbox */}
            <g 
              transform={`translate(${startX}, ${startY})`}
              className="pointer-events-auto"
              style={{ cursor: isThisPinDragging ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                setDraggingPin({
                  threadId: thread.id,
                  sourceItemId: thread.sourceItemId,
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  initialOffsetX: offsetX,
                  initialOffsetY: offsetY,
                  currentOffsetX: offsetX,
                  currentOffsetY: offsetY
                });
              }}
            >
              {/* Invisible Small Hitbox Circle (r=12) */}
              <circle r="12" fill="transparent" />

              {/* Pushpin visuals (Đầu ghim nhỏ tinh tế r=4) */}
              <circle r="4.5" fill="#000000" opacity="0.25" cx="0.5" cy="1.5" />
              <circle 
                r="4" 
                fill={isThisPinDragging ? '#b91c1c' : '#dc2626'} 
                stroke="#991b1b" 
                strokeWidth="1" 
                className="transition-transform hover:scale-125"
              />
              <circle r="1.5" fill="#fca5a5" cx="-0.8" cy="-0.8" />
            </g>

            {/* Target Physical Pushpin on Sticky Note */}
            <g transform={`translate(${endX}, ${endY})`}>
              <circle r="4.5" fill="#000000" opacity="0.2" cx="0.5" cy="1.5" />
              <circle r="4" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
              <circle r="1.5" fill="#fca5a5" cx="-0.8" cy="-0.8" />
            </g>
          </g>
        );
      })}
    </svg>
  );
});
