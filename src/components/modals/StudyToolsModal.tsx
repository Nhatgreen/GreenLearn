'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DeskItem } from '@/types/studyspace';
import { 
  Sparkles, 
  FileText, 
  HelpCircle, 
  Layers, 
  ListOrdered, 
  Camera, 
  X
} from 'lucide-react';
import { SummaryTab } from './study-tools/SummaryTab';
import { QuizTab } from './study-tools/QuizTab';
import { FlashcardTab } from './study-tools/FlashcardTab';
import { RoadmapTab } from './study-tools/RoadmapTab';
import { OcrTab } from './study-tools/OcrTab';

interface StudyToolsModalProps {
  item: DeskItem;
  isOpen: boolean;
  onClose: () => void;
  isPaper?: boolean;
  targetPos?: { x: number; y: number };
}

export function StudyToolsModal({ item, isOpen, onClose, isPaper: explicitIsPaper, targetPos: explicitTargetPos }: StudyToolsModalProps) {
  const isPaper = explicitIsPaper !== undefined ? explicitIsPaper : item.type !== 'book';
  const targetPos = explicitTargetPos || { x: item.x + (isPaper ? 390 : 1010), y: item.y };
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'flashcards' | 'roadmap' | 'ocr'>('summary');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Extract full document text
  const fullText = item.pages.map(p => `${p.title ? p.title + '\n' : ''}${p.text}`).join('\n\n');

  // Compact, streamlined layout tailored specifically for Single-Page Documents (PaperSheet)
  if (isPaper) {
    return createPortal(
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in select-none font-sans"
        onClick={onClose}
      >
        <div 
          className="bg-white border border-slate-300 rounded-2xl w-full max-w-[460px] shadow-2xl flex flex-col overflow-hidden relative text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar: Gọn gàng [Icon] STudy kèm nút đóng X */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-200">
                <Sparkles className="w-4 h-4 text-[#16A34A] stroke-[2.4]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                STudy
              </h3>
            </div>

            <button
              onClick={onClose}
              title="Đóng STudy"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Balanced 2-Tab Navigation: Cân đối 2 thẻ Tóm tắt và Trắc nghiệm (50/50), không khuất, không cuộn */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 select-none">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-[#16A34A] text-[#16A34A] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Tóm Tắt</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'border-[#16A34A] text-[#16A34A] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Trắc Nghiệm</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="bg-white overflow-hidden" onWheel={(e) => e.stopPropagation()}>
            {activeTab === 'summary' && (
              <SummaryTab fullText={fullText} documentTitle={item.title} isPaper={true} targetPos={targetPos} />
            )}
            {activeTab === 'quiz' && (
              <QuizTab fullText={fullText} documentTitle={item.title} onCloseModal={onClose} isPaper={true} targetPos={targetPos} />
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Full layout for Books (Sách mở đôi)
  return createPortal(
    <div 
      id="study-modal-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4 animate-fade-in select-none font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl h-[85vh] shadow-2xl flex flex-col overflow-hidden relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  STudy: {item.title}
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Sách Mở Đôi
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bộ công cụ tự học & ôn thi toàn diện (Extractive TextRank, Cloze Deletion, Spaced Repetition)
              </p>
            </div>
          </div>

          <button
            id="close-study-tools-modal"
            aria-label="Đóng STudy"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Monochromatic Slate) */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'summary'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tóm Tắt</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Trắc Nghiệm</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'flashcards'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thẻ Ghi Nhớ</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Lộ Trình Học</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ocr'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Quét Ảnh OCR</span>
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'summary' && (
          <SummaryTab fullText={fullText} documentTitle={item.title} targetPos={targetPos} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab fullText={fullText} documentTitle={item.title} onCloseModal={onClose} targetPos={targetPos} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardTab fullText={fullText} documentTitle={item.title} />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapTab pages={item.pages} itemType={item.type} itemId={item.id} />
        )}
        {activeTab === 'ocr' && (
          <OcrTab documentTitle={item.title} />
        )}
      </div>
    </div>,
    document.body
  );
}
