'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { Plus, Trash2, Bold, Type } from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';

interface MindMapNodeItemProps {
  item: DeskItem;
  isSelected: boolean;
}

const COLOR_PRESETS = [
  { name: 'Tím', value: '#a855f7', bg: '#faf5ff' },
  { name: 'Xanh dương', value: '#0ea5e9', bg: '#f0f9ff' },
  { name: 'Xanh lục', value: '#10b981', bg: '#ecfdf5' },
  { name: 'Cam', value: '#f97316', bg: '#fff7ed' },
  { name: 'Hồng', value: '#ec4899', bg: '#fdf2f8' },
  { name: 'Đen', value: '#334155', bg: '#f8fafc' },
];

export const MindMapNodeItem = React.memo(function MindMapNodeItem({ item, isSelected }: MindMapNodeItemProps) {
  const { selectItem, removeDeskItem, addMindMapNode, updateMindMapNode } = useStudySpace();

  const [text, setText] = useState(item.stickyText ?? '');
  const [color, setColor] = useState(item.mindMapColor || '#a855f7');
  const [isBold, setIsBold] = useState(item.isBold ?? false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    width: item.width || 240,
    height: item.height || 64,
  });

  useEffect(() => {
    if (item.stickyText !== undefined && item.stickyText !== text) {
      setText(item.stickyText);
    }
  }, [item.stickyText]);

  useEffect(() => {
    if (item.mindMapColor) {
      setColor(item.mindMapColor);
    }
  }, [item.mindMapColor]);

  const handleAddChild = (direction: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => {
    e.stopPropagation();
    const w = item.width || 240;
    const h = item.height || 64;

    let targetX = item.x;
    let targetY = item.y;

    if (direction === 'right') {
      targetX = item.x + w + 80;
      targetY = item.y;
    } else if (direction === 'bottom') {
      targetX = item.x;
      targetY = item.y + h + 60;
    } else if (direction === 'left') {
      targetX = item.x - w - 80;
      targetY = item.y;
    } else if (direction === 'top') {
      targetX = item.x;
      targetY = item.y - h - 60;
    }

    addMindMapNode('', targetX, targetY, item.id, color);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    updateMindMapNode(item.id, val, color);
  };

  const handleColorChange = (newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColor(newColor);
    updateMindMapNode(item.id, text, newColor);
    setIsColorPickerOpen(false);
  };

  const toggleBold = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBold(!isBold);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeDeskItem(item.id);
  };

  const nodeWidth = item.width || 240;
  const nodeHeight = item.height || 64;

  return (
    <div
      data-desk-item="true"
      data-item-id={item.id}
      data-item-type="mind_map"
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
        zIndex: isSelected ? 50 : item.zIndex || 15,
        width: nodeWidth,
        height: nodeHeight,
        textRendering: 'geometricPrecision'
      }}
      className={`group select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Floating Toolbar: Matches Image 2 exactly when node is selected/focused */}
      {isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 shadow-xl rounded-full text-slate-700 text-xs font-medium z-60 animate-fade-in select-none whitespace-nowrap"
        >
          {/* Shape Icon */}
          <div
            title="Hình dạng node"
            className="w-5 h-3.5 border-2 border-slate-700 rounded-full flex items-center justify-center cursor-default"
          />

          {/* Branch Connector indicator */}
          <span className="text-slate-400 font-mono text-sm mx-0.5">├─</span>

          {/* Auto toggle */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
            Auto
          </div>

          <div className="w-px h-3.5 bg-slate-200 mx-0.5" />

          {/* Color Picker trigger */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsColorPickerOpen(!isColorPickerOpen);
              }}
              title="Đổi màu viền node"
              className="w-5 h-5 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            />
            {isColorPickerOpen && (
              <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-white border border-slate-200 shadow-xl rounded-xl z-70">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={(e) => handleColorChange(p.value, e)}
                    className="w-5 h-5 rounded-full border border-white shadow-xs transition-transform hover:scale-125"
                    style={{ backgroundColor: p.value }}
                    title={p.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-0.5 text-slate-600 text-[11px] font-semibold px-1">
            <Type className="w-3 h-3 text-slate-400" />
            <span>{fontSize}</span>
          </div>

          {/* Bold */}
          <button
            onClick={toggleBold}
            title="In đậm chữ"
            className={`p-1 rounded-md transition-colors ${
              isBold ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-slate-200 mx-0.5" />

          {/* Rotate Tool */}
          <button
            onPointerDown={handleRotateMouseDown}
            onDoubleClick={handleRotateDoubleClick}
            title="Xoay node (nhấp đúp căn 0°)"
            className="p-1 rounded-md text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors cursor-grab"
          >
            <RotateTwoWay className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            title="Xoá node"
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Pill-shaped Node: Matches Image 2 exactly (Crisp vector text rendering) */}
      <div
        className="w-full h-full rounded-full bg-white flex items-center justify-center px-6 shadow-xs"
        style={{
          border: `2.5px solid ${color}`,
          textRendering: 'geometricPrecision'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Nhập nội dung node..."
          spellCheck={false}
          className={`w-full text-center bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm tracking-tight cursor-text ${
            isBold ? 'font-bold' : 'font-medium'
          }`}
          style={{ 
            fontSize: `${fontSize}px`,
            textRendering: 'geometricPrecision'
          }}
        />
      </div>

      {/* 4 Directional Quick-Add Branch Buttons (+): Matches Image 2 exactly */}
      {/* Top (+) */}
      <button
        onClick={(e) => handleAddChild('top', e)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Thêm nhánh phía trên"
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-500 hover:bg-purple-50 shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 opacity-70 group-hover:opacity-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
      </button>

      {/* Right (+) */}
      <button
        onClick={(e) => handleAddChild('right', e)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Thêm nhánh bên phải"
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-500 hover:bg-purple-50 shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 opacity-70 group-hover:opacity-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
      </button>

      {/* Bottom (+) */}
      <button
        onClick={(e) => handleAddChild('bottom', e)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Thêm nhánh phía dưới"
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-500 hover:bg-purple-50 shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 opacity-70 group-hover:opacity-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
      </button>

      {/* Left (+) */}
      <button
        onClick={(e) => handleAddChild('left', e)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Thêm nhánh bên trái"
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-purple-600 hover:border-purple-500 hover:bg-purple-50 shadow-xs flex items-center justify-center transition-all duration-150 hover:scale-110 opacity-70 group-hover:opacity-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
      </button>
    </div>
  );
});
