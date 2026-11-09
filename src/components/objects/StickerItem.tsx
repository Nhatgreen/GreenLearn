'use client';

import React from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { Trash2 } from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';

interface StickerItemProps {
  item: DeskItem;
  isSelected: boolean;
}

export const StickerItem = React.memo(function StickerItem({ item, isSelected }: StickerItemProps) {
  const { selectItem, removeDeskItem, transform, updateItemDimensions } = useStudySpace();

  const width = item.width || 100;
  const height = item.height || 100;

  const {
    isDragging,
    handleMouseDown,
    handleRotateMouseDown,
    handleRotateDoubleClick
  } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width,
    height,
  });

  const sticker = item.stickerData;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeDeskItem(item.id);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startW = width;
    const startH = height;
    const ratio = startW / (startH || 1);
    const scale = transform.scale || 1;

    const handleMouseMove = (moveEv: MouseEvent) => {
      const dx = (moveEv.clientX - startClientX) / scale;
      const dy = (moveEv.clientY - startClientY) / scale;
      const delta = (dx + dy) / 2;
      const newW = Math.max(48, Math.min(600, Math.round(startW + delta)));
      const newH = Math.round(newW / ratio);
      updateItemDimensions?.(item.id, newW, newH);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      data-desk-item="true"
      data-item-id={item.id}
      data-item-type="sticker"
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        selectItem(item.id);
        handleMouseDown(e);
      }}
      style={{
        position: 'absolute',
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg)`,
        transformOrigin: '0 0',
        zIndex: isSelected ? 50 : item.zIndex || 20,
        width,
        height
      }}
      className={`group select-none flex items-center justify-center ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Action controls appear when hovered or selected */}
      {(isSelected || isDragging) && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-slate-200/90 shadow-md rounded-full text-slate-600 text-xs z-50 animate-fade-in select-none"
        >
          <button
            onMouseDown={handleRotateMouseDown}
            onDoubleClick={handleRotateDoubleClick}
            title="Xoay (Kéo để xoay, nhấp đúp về 0°)"
            className="p-1 rounded-full text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-grab"
          >
            <RotateTwoWay className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            title="Xoá hình dán"
            className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Visual outline on hover/select */}
      <div
        className={`w-full h-full flex items-center justify-center p-1 rounded-2xl ${
          isSelected
            ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/15'
            : 'group-hover:border group-hover:border-dashed group-hover:border-slate-300'
        }`}
      >
        {/* Render High-Res Image / Animated GIF / Vector SVG / Unicode Emoji */}
        {sticker?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sticker.url}
            alt={sticker.name || 'sticker'}
            className="w-full h-full object-contain pointer-events-none select-none"
            style={{ imageRendering: 'auto' }}
            draggable={false}
            onError={(e) => {
              // Graceful fallback to text emoji if offline/CDN error
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Fallback Unicode representation if no URL or error */}
        {sticker?.url && (
          <div 
            style={{ 
              display: 'none',
              fontSize: `${Math.round(Math.min(width, height) * 0.72)}px`,
              lineHeight: 1,
              textRendering: 'geometricPrecision'
            }}
            className="select-none items-center justify-center pointer-events-none"
          >
            {sticker?.content || '⭐'}
          </div>
        )}

        {!sticker?.url && sticker?.isSvg ? (
          <div
            className="w-full h-full flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: sticker.content }}
          />
        ) : !sticker?.url ? (
          <div 
            style={{ 
              fontSize: `${Math.round(Math.min(width, height) * 0.72)}px`,
              lineHeight: 1,
              textRendering: 'geometricPrecision'
            }}
            className="select-none flex items-center justify-center"
          >
            {sticker?.content || '⭐'}
          </div>
        ) : null}
      </div>

      {/* Resize corner handle (Image & Emoji scaling) */}
      {isSelected && (
        <div
          onMouseDown={handleResizeStart}
          title="Kéo góc để phóng to/thu nhỏ kích thước"
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-md cursor-nwse-resize flex items-center justify-center hover:scale-125 transition-transform z-50 pointer-events-auto"
        />
      )}
    </div>
  );
});
