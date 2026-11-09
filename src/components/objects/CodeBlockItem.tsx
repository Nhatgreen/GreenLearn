'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { Copy, Check, Trash2 } from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';

interface CodeBlockItemProps {
  item: DeskItem;
  isSelected: boolean;
}

export const CodeBlockItem = React.memo(function CodeBlockItem({ item, isSelected }: CodeBlockItemProps) {
  const { selectItem, removeDeskItem, updateCodeBlock } = useStudySpace();

  const [code, setCode] = useState(item.codeSnippet ?? 'print screen\nhello;');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    width: item.width || 480,
    height: item.height || 200,
  });

  useEffect(() => {
    if (item.codeSnippet !== undefined) {
      setCode(item.codeSnippet);
    }
  }, [item.codeSnippet]);

  // Auto-resize textarea height to fit content nicely
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [code]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeDeskItem(item.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      updateCodeBlock(item.id, newCode, item.codeLanguage);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateCodeBlock(item.id, newCode, item.codeLanguage);
  };

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 3);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      data-desk-item="true"
      data-item-id={item.id}
      data-item-type="code_block"
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
      style={{
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg)`,
        transformOrigin: '0 0',
        zIndex: isSelected ? 50 : item.zIndex || 10,
        width: item.width || 480,
        textRendering: 'geometricPrecision'
      }}
      className={`absolute select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Title Label: Drag handle matching StickyNoteItem behavior */}
      <div 
        onMouseDown={(e) => {
          e.stopPropagation();
          selectItem(item.id);
          handleMouseDown(e);
        }}
        className="flex items-center justify-between px-1 mb-1.5 select-none cursor-grab active:cursor-grabbing"
      >
        <span className="text-slate-600 font-semibold text-sm tracking-tight" style={{ textRendering: 'geometricPrecision' }}>
          Code block
        </span>

        {/* Action icons appear cleanly on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            title="Sao chép mã"
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.4]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onMouseDown={handleRotateMouseDown}
            onDoubleClick={handleRotateDoubleClick}
            title="Xoay (Kéo để xoay, nhấp đúp về 0°)"
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-amber-700 hover:bg-slate-50 shadow-xs transition-colors cursor-grab"
          >
            <RotateTwoWay className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            title="Xoá khối mã nguồn"
            className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Editor Container: Deep Navy/Black Background matching Image 3 (Crisp vector rendering without layer blur) */}
      <div
        style={{
          textRendering: 'geometricPrecision'
        }}
        className={`relative rounded-xl border ${
          isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800/90 hover:border-slate-700'
        } bg-[#060b1c]`}
      >
        <div className="flex py-3.5 px-3">
          {/* Line Numbers Column */}
          <div 
            style={{ textRendering: 'geometricPrecision' }}
            className="flex flex-col select-none text-right pr-3.5 border-r border-slate-800/70 text-slate-400 font-mono text-xs md:text-sm leading-6"
          >
            {lineNumbers.map((num) => (
              <span key={num} className="block select-none opacity-60">
                {num}
              </span>
            ))}
          </div>

          {/* Code Input Area */}
          <div className="flex-1 pl-3.5 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              placeholder="Nhập mã nguồn..."
              style={{
                textRendering: 'geometricPrecision',
                fontSize: '14px',
                lineHeight: '24px',
                fontFamily: 'Consolas, "Cascadia Code", "Courier New", monospace'
              }}
              className="w-full bg-transparent text-slate-50 font-mono outline-none resize-none overflow-hidden placeholder-slate-500 cursor-text font-medium"
              rows={lineCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
