'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DeskItem } from '@/types/studyspace';
import { Layers, X } from 'lucide-react';
import { FlashcardTab } from './study-tools/FlashcardTab';

interface FlashcardModalProps {
  item: DeskItem;
  isOpen: boolean;
  onClose: () => void;
}

export function FlashcardModal({ item, isOpen, onClose }: FlashcardModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const fullText = item.pages.map(p => `${p.title ? p.title + '\n' : ''}${p.text}`).join('\n\n');

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
              <Layers className="w-4 h-4 text-slate-900 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Thẻ Ghi Nhớ: {item.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Đóng thẻ ghi nhớ"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flashcard Content */}
        <div className="p-4 bg-white overflow-hidden">
          <FlashcardTab fullText={fullText} documentTitle={item.title} />
        </div>
      </div>
    </div>,
    document.body
  );
}
