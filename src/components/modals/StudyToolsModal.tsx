'use client';

import React, { useState, useEffect } from 'react';
import { DeskItem } from '@/types/studyspace';
import { 
  Sparkles, 
  FileText, 
  HelpCircle, 
  Layers, 
  ListOrdered, 
  X
} from 'lucide-react';
import { SummaryTab } from './study-tools/SummaryTab';
import { QuizTab } from './study-tools/QuizTab';
import { FlashcardTab } from './study-tools/FlashcardTab';
import { RoadmapTab } from './study-tools/RoadmapTab';

interface StudyToolsModalProps {
  item: DeskItem;
  isOpen: boolean;
  onClose: () => void;
  isPaper?: boolean;
  targetPos?: { x: number; y: number };
  totalPages?: number;
  activePageText?: string;
}

export function StudyToolsModal({ 
  item, 
  isOpen, 
  onClose, 
  isPaper = false, 
  targetPos: explicitTargetPos,
  totalPages,
  activePageText 
}: StudyToolsModalProps) {
  const targetPos = explicitTargetPos || { x: item.x + (isPaper ? 390 : 1010), y: item.y };
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'flashcards' | 'roadmap'>('summary');

  // Handle ESC key to dismiss in-situ STudy overlay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract full document text
  const fullText = item.pages.map(p => `${p.title ? p.title + '\n' : ''}${p.text}`).join('\n\n');
  const pageCountDisplay = totalPages || item.pages.length;

  return (
    <div 
      data-overlay="true"
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 bg-white rounded-2xl border border-slate-300 flex flex-col overflow-hidden shadow-2xl font-sans text-slate-900 animate-fade-in select-none"
    >
      {/* Header Bar: In-situ cockpit header */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-200 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#16A34A] stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                Công cụ học: {item.title}
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                Sách · {pageCountDisplay} trang
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Tóm tắt, câu hỏi và thẻ ôn từ nội dung sách này
            </p>
          </div>
        </div>

        <button
          id="close-study-tools-modal"
          aria-label="Đóng công cụ học"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation: Sentence case & GreenLearn signature green active accent */}
      <div className="flex items-center gap-1 px-4 pt-1.5 border-b border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar select-none">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'summary'
              ? 'border-[#16A34A] text-[#16A34A] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Tóm tắt</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'quiz'
              ? 'border-[#16A34A] text-[#16A34A] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Trắc nghiệm</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'flashcards'
              ? 'border-[#16A34A] text-[#16A34A] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Thẻ ghi nhớ</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'roadmap'
              ? 'border-[#16A34A] text-[#16A34A] bg-white rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Lộ trình học</span>
        </button>
      </div>

      {/* Tab Body: Pinned container with scrollable content inside */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white" onWheel={(e) => e.stopPropagation()}>
        {activeTab === 'summary' && (
          <SummaryTab fullText={fullText} documentTitle={item.title} targetPos={targetPos} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab 
            fullText={fullText} 
            documentTitle={item.title} 
            onCloseModal={onClose} 
            targetPos={targetPos}
            activePageText={activePageText}
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardTab fullText={fullText} documentTitle={item.title} />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapTab pages={item.pages} itemType={item.type} itemId={item.id} />
        )}
      </div>
    </div>
  );
}
