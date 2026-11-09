'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useViToken } from '@/context/ViTokenContext';
import { askAi } from '@/lib/aiClient';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { normalizeNFC } from '@/utils/textNormalization';
import { 
  Trash2, 
  Lightbulb, 
  X, 
  Send, 
  Sparkles, 
  Check, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Copy, 
  Code2, 
  Table as TableIcon, 
  Network, 
  BookmarkCheck, 
  Trophy, 
  CheckCircle2, 
  Edit3, 
  Eye 
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';
import { ItemDrawingOverlay } from '../canvas/ItemDrawingOverlay';

interface StickyNoteItemProps {
  item: DeskItem;
  isSelected: boolean;
}

export function StickyNoteItemComponent({ item, isSelected }: StickyNoteItemProps) {
  const { 
    selectItem, 
    removeDeskItem,
    updateStickyNoteText,
    updateStickyNoteColor,
    updateStickyNoteTextAlign,
    updateStickyNoteIsBold,
    updateItemTitle,
    addStickyNote
  } = useStudySpace();

  const { spendTokens, aiConfig } = useViToken();

  const [text, setText] = useState(item.stickyText || '');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(item.textAlign || 'left');
  const [isBold, setIsBold] = useState<boolean>(item.isBold ?? true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(item.title || 'Note');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setTitleInput(item.title || 'Note');
  }, [item.title]);


  useEffect(() => {
    if (item.textAlign) {
      setTextAlign(item.textAlign);
    }
  }, [item.textAlign]);

  useEffect(() => {
    if (item.isBold !== undefined) {
      setIsBold(item.isBold);
    }
  }, [item.isBold]);

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && updateItemTitle) {
      updateItemTitle(item.id, normalizeNFC(trimmed));
    }
    setIsEditingTitle(false);
  };

  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
    text: string;
    question: string;
    answer: string | null;
    loading: boolean;
  } | null>(null);

  const noteRef = useRef<HTMLDivElement>(null);

  // 16-color Miro-style palette grid (Ảnh 2)
  const miroColors = [
    { label: 'Trắng xám', value: '#f1f5f9', isDark: false },
    { label: 'Vàng kem', value: '#fef9c3', isDark: false },
    { label: 'Vàng nắng', value: '#fef08a', isDark: false },
    { label: 'Cam đào', value: '#fed7aa', isDark: false },
    { label: 'Xanh chanh', value: '#d9f99d', isDark: false },
    { label: 'Xanh bạc hà', value: '#bbf7d0', isDark: false },
    { label: 'Xanh lá tươi', value: '#86efac', isDark: false },
    { label: 'Xanh ngọc', value: '#99f6e4', isDark: false },
    { label: 'Hồng phấn', value: '#fbcfe8', isDark: false },
    { label: 'Hồng sen', value: '#f472b6', isDark: false },
    { label: 'Tím nhạt', value: '#ddd6fe', isDark: false },
    { label: 'San hô đỏ', value: '#fca5a5', isDark: false },
    { label: 'Băng lam', value: '#bae6fd', isDark: false },
    { label: 'Xanh da trời', value: '#7dd3fc', isDark: false },
    { label: 'Xanh biển dịu', value: '#93c5fd', isDark: false },
    { label: 'Xám đen than', value: '#1e293b', isDark: true }
  ];

  useEffect(() => {
    setText(item.stickyText || '');
  }, [item.stickyText]);

  // Hook for unified drag-and-move and continuous 360 rotation
  const { isDragging, handleMouseDown, handleRotateMouseDown, handleRotateDoubleClick } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width: item.width || 220,
    height: item.height || 200,
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = normalizeNFC(e.target.value);
    setText(val);
    if (updateStickyNoteText) {
      updateStickyNoteText(item.id, val);
    }
  };

  // Text selection handler on Sticky Note
  const handleTextMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = (start !== undefined && end !== undefined && end > start) 
      ? textarea.value.substring(start, end).trim()
      : '';

    if (selected.length > 3 && noteRef.current) {
      try {
        const noteRect = noteRef.current.getBoundingClientRect();
        const clickX = e.clientX - noteRect.left;
        const clickY = e.clientY - noteRect.top;

        setSelectionPopover({
          x: Math.max(80, Math.min(clickX, 180)),
          y: Math.max(30, Math.min(clickY, 140)),
          text: selected,
          question: '',
          answer: null,
          loading: false
        });
      } catch {
        setSelectionPopover(null);
      }
    } else {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-inteline-popover="true"]')) {
        setSelectionPopover(null);
      }
    }
  };

  // Quick ask Inteline
  const handleQuickAsk = async (customQ?: string) => {
    if (!selectionPopover) return;
    const q = customQ || selectionPopover.question.trim();
    if (!q) return;

    setSelectionPopover(prev => prev ? { ...prev, loading: true, question: q } : null);

    try {
      const prompt = `Bạn là trợ lý học tập ViTudy (Inteline). Hãy giải thích hoặc trả lời câu hỏi về đoạn ghi chú sau:
Ghi chú: "${selectionPopover.text}"
Câu hỏi: "${q}"
Trả lời trực tiếp, ngắn gọn, súc tích, dễ hiểu nhất (tối đa 3-4 câu).`;

      spendTokens?.(2, 'Hỏi nhanh AI Inteline');

      const data = await askAi({
        provider: aiConfig?.provider || 'system',
        model: aiConfig?.model,
        apiKey: aiConfig?.apiKey,
        prompt: `Bạn là trợ lý học tập ViTudy (Inteline). Hãy giải thích hoặc trả lời câu hỏi về đoạn ghi chú sau:
Ghi chú: "${selectionPopover.text}"
Câu hỏi: "${q}"
Trả lời trực tiếp, ngắn gọn, súc tích, dễ hiểu nhất (tối đa 3-4 câu).`,
      });

      const reply = data.reply || 'Không nhận được câu trả lời từ AI. Vui lòng thử lại.';
      setSelectionPopover(prev => prev ? { ...prev, loading: false, answer: reply } : null);
    } catch {
      setSelectionPopover(prev => prev ? { ...prev, loading: false, answer: 'Lỗi kết nối máy chủ AI.' } : null);
    }
  };

  // Dynamic font scaling & auto expansion:
  // Đảm bảo chữ hiển thị trọn vẹn, không bao giờ bị thanh ngang footer đè lên chữ
  const textLen = text.length;
  const lineBreaks = (text.match(/\n/g) || []).length;
  const effectiveLen = textLen + lineBreaks * 20;

  const dynamicFont = (() => {
    let size = 13.5;
    let leading = 'leading-[1.42]';

    if (effectiveLen <= 15) {
      size = 26;
      leading = 'leading-[1.18]';
    } else if (effectiveLen <= 40) {
      size = 19;
      leading = 'leading-[1.26]';
    } else if (effectiveLen <= 80) {
      size = 15.5;
      leading = 'leading-[1.32]';
    } else if (effectiveLen <= 150) {
      size = 13.5;
      leading = 'leading-[1.42]';
    } else if (effectiveLen <= 260) {
      size = 12;
      leading = 'leading-[1.38]';
    } else {
      size = 11;
      leading = 'leading-[1.32]';
    }

    return { size, leading };
  })();

  // Tính số dòng thực tế để tự động co dãn chiều cao note, chống thanh ngang footer đè lên chữ
  const rawLines = text.split('\n');
  const approxLines = rawLines.reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / 25)), 0);
  const lineH = dynamicFont.size * 1.45;
  const minNeededHeight = Math.ceil(approxLines * lineH) + 68;
  const noteBaseHeight = Math.max(item.height || 200, minNeededHeight);
  const noteHeight = isExpanded ? Math.max(noteBaseHeight + 100, 320) : noteBaseHeight;

  // Rich format detectors
  const trimmedText = text.trim();
  const isCodeBlock = trimmedText.startsWith('```') && trimmedText.endsWith('```');
  const isTable = trimmedText.includes('|') && trimmedText.split('\n').filter(l => l.trim().startsWith('|')).length >= 2;
  const isMindMap = trimmedText.includes('[SƠ ĐỒ TƯ DUY]') || trimmedText.includes('├──') || trimmedText.includes('└──');
  const isSticker = trimmedText.includes('[STICKER');
  const isIllustration = trimmedText.includes('[MINH HỌA');
  const hasRichView = isCodeBlock || isTable || isMindMap || isSticker || isIllustration;

  const handleCopyCode = async (codeStr: string) => {
    try {
      await navigator.clipboard.writeText(codeStr);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const renderCodeBlock = () => {
    const rawLines = text.trim().split('\n');
    let lang = 'CODE';
    let codeLines = rawLines;
    if (rawLines[0].startsWith('```')) {
      lang = rawLines[0].replace(/```/, '').trim().toUpperCase() || 'PYTHON';
      codeLines = rawLines.slice(1, rawLines[rawLines.length - 1].startsWith('```') ? -1 : undefined);
    }
    const codeString = codeLines.join('\n');

    return (
      <div 
        onDoubleClick={() => setIsEditingContent(true)}
        className="w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded p-2.5 font-mono text-[11px] overflow-hidden select-text relative z-10 border border-slate-800 shadow-inner"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-[10px] text-slate-400 select-none">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
            <Code2 className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCode(codeString);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition-colors active:scale-95 text-[10px] font-semibold"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingContent(true);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors text-[10px] font-semibold"
            >
              Sửa
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto space-y-0.5 font-mono leading-relaxed text-emerald-300/90 no-scrollbar">
          {codeLines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-600 select-none text-[10px] w-4 text-right flex-shrink-0">{idx + 1}</span>
              <span className="whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const rawLines = text.trim().split('\n').filter(l => l.trim().startsWith('|'));
    const cleanCells = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
    const headers = cleanCells(rawLines[0]);
    const dataLines = rawLines.slice(1).filter(l => !/^\|[\s\-:|]+\|$/.test(l.trim()));
    const rows = dataLines.map(cleanCells);

    return (
      <div 
        onDoubleClick={() => setIsEditingContent(true)}
        className="w-full h-full flex flex-col bg-white/95 rounded p-2 text-xs overflow-hidden select-text relative z-10 border border-slate-200 shadow-xs"
      >
        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 text-[10px] text-slate-500 select-none">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <TableIcon className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>BẢNG DỮ LIỆU</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
            }}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[10px]"
          >
            Sửa bảng
          </button>
        </div>
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                {headers.map((h, i) => (
                  <th key={i} className="p-1.5 border border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-1.5 border border-slate-200 text-slate-800">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMindMap = () => {
    const rawLines = text.trim().split('\n').filter(l => l.trim().length > 0);
    let root = 'Chủ đề tư duy';
    const branches: string[] = [];
    for (const l of rawLines) {
      if (l.includes('[SƠ ĐỒ TƯ DUY]')) continue;
      if (l.startsWith('•') || l.startsWith('*') || l.startsWith('#')) {
        root = l.replace(/^[•*#\s]+/, '').trim();
      } else if (l.includes('├──') || l.includes('└──') || l.startsWith('-')) {
        branches.push(l.replace(/^[├──└──\-\s]+/, '').trim());
      } else if (branches.length === 0) {
        root = l.trim();
      } else {
        branches.push(l.trim());
      }
    }

    return (
      <div 
        onDoubleClick={() => setIsEditingContent(true)}
        className="w-full h-full flex flex-col bg-sky-50/95 rounded p-2.5 text-xs overflow-hidden select-text relative z-10 border border-sky-200 shadow-xs"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-sky-200 mb-2 text-[10px] select-none">
          <div className="flex items-center gap-1.5 font-bold text-sky-900">
            <Network className="w-3.5 h-3.5 text-sky-600" />
            <span>SƠ ĐỒ TƯ DUY</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
            }}
            className="px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold cursor-pointer text-[10px]"
          >
            Sửa sơ đồ
          </button>
        </div>
        <div className="flex-1 overflow-auto space-y-2 text-[11.5px] no-scrollbar">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs shadow-xs">
            <span>{root}</span>
          </div>
          <div className="pl-3 border-l-2 border-sky-300 space-y-1.5 mt-1">
            {branches.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sky-950 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0"></span>
                <span className="bg-white/90 px-2 py-1 rounded-md border border-sky-200/80 shadow-2xs text-[11px] leading-tight">
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSticker = () => {
    const rawLines = text.trim().split('\n').filter(l => l.trim().length > 0);
    const title = rawLines[0].replace(/\[|\]/g, '').replace(/^STICKER\s*-\s*/i, '').trim();
    const bullets = rawLines.slice(1).map(l => l.replace(/^[•*-\s]+/, '').trim()).filter(Boolean);

    return (
      <div 
        onDoubleClick={() => setIsEditingContent(true)}
        className="w-full h-full flex flex-col bg-amber-50/95 rounded p-2.5 text-xs overflow-hidden select-text relative z-10 border-2 border-amber-300 shadow-xs"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 mb-2 select-none">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] tracking-wide">
            <BookmarkCheck className="w-4 h-4 text-amber-600" />
            <span>{title || 'ĐIỂM QUAN TRỌNG'}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
            }}
            className="px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer text-[10px]"
          >
            Sửa
          </button>
        </div>
        <div className="flex-1 overflow-auto text-[11.5px] leading-relaxed text-amber-950 font-medium space-y-1.5 no-scrollbar">
          {bullets.map((b, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-amber-600 font-bold">•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIllustration = () => {
    const rawLines = text.trim().split('\n').filter(l => l.trim().length > 0);
    const title = rawLines[0].replace(/\[|\]/g, '').trim();
    const bullets = rawLines.slice(1).map(l => l.replace(/^[•*-\s]+/, '').trim()).filter(Boolean);

    return (
      <div 
        onDoubleClick={() => setIsEditingContent(true)}
        className="w-full h-full flex flex-col bg-pink-50/95 rounded p-2.5 text-xs overflow-hidden select-text relative z-10 border-2 border-pink-300 shadow-xs"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-pink-200 mb-2 select-none">
          <div className="flex items-center gap-1.5 font-bold text-pink-900 text-[11px] tracking-wide">
            <Trophy className="w-4 h-4 text-pink-600" />
            <span>{title || 'MINH HỌA HỌC TẬP'}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingContent(true);
            }}
            className="px-2 py-0.5 rounded bg-pink-200/80 hover:bg-pink-200 text-pink-900 font-semibold cursor-pointer text-[10px]"
          >
            Sửa
          </button>
        </div>
        <div className="flex-1 overflow-auto text-[11.5px] leading-relaxed text-pink-950 font-medium space-y-1.5 no-scrollbar">
          {bullets.map((b, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 flex-shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={noteRef}
      data-desk-item="true"
      style={{
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: item.zIndex,
        width: item.width || 220,
        height: noteHeight,
        transition: isDragging ? 'none' : 'box-shadow 0.2s, height 0.2s ease-out',
      }}
      className={`absolute select-none group cursor-default rounded-sm ${
        isSelected ? 'ring-2 ring-slate-900 shadow-xl' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
    >
      {/* Tape Strip at Top (Enlarged +30% width: 84px, +20% height: 24px - Drag Handle) */}
      <div 
        onMouseDown={handleMouseDown}
        title="Cầm băng keo để kéo ghi chú"
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-[84px] h-6 bg-amber-100/75 hover:bg-amber-100 border border-amber-200/60 shadow-xs backdrop-blur-[1px] z-20 cursor-grab active:cursor-grabbing transition-colors"
        style={{ transform: 'translateX(-50%) rotate(-2deg)' }}
      />

      {/* Note Body (Strictly no scrollbars & Crisp Open Sans / Patrick Hand font) */}
      <div 
        style={{ 
          backgroundColor: item.stickyColor || '#fef08a',
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased'
        }}
        className="w-full h-full p-4 pt-5 rounded-sm shadow-md text-stone-950 flex flex-col justify-between border-b-2 border-r-2 border-black/10 sticky-note overflow-hidden relative"
      >
        {/* In-Document Drawing Layer (strokes permanently attached to this note) */}
        <ItemDrawingOverlay itemId={item.id} />

        {hasRichView && !isEditingContent ? (
          isCodeBlock ? renderCodeBlock() :
          isTable ? renderTable() :
          isMindMap ? renderMindMap() :
          isSticker ? renderSticker() :
          renderIllustration()
        ) : (
          <textarea
            value={text}
            onChange={handleTextChange}
            onMouseUp={handleTextMouseUp}
            placeholder="Ghi chú..."
            spellCheck={false}
            style={{ 
              textRendering: 'geometricPrecision', 
              WebkitFontSmoothing: 'antialiased',
              fontSize: `${dynamicFont.size}px`,
              fontWeight: isBold ? 800 : 500,
              WebkitTextStroke: isBold ? '0.35px currentColor' : '0px transparent',
              textAlign: textAlign,
            }}
            className={`w-full flex-1 min-h-0 mb-1.5 pb-1 bg-transparent resize-none outline-none ${
              isBold ? 'font-bold' : 'font-medium'
            } ${
              textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'
            } text-stone-950 placeholder:text-stone-400 placeholder:italic font-sans selection:bg-amber-300 selection:text-stone-950 no-scrollbar cursor-text overflow-hidden relative z-10 ${dynamicFont.leading}`}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}

        {/* Footer (Drag handle: Editable Note name, Expand Toggle & Character count) */}
        <div 
          onMouseDown={handleMouseDown}
          title="Cầm chân ghi chú để di chuyển"
          className="flex-shrink-0 flex items-center justify-between text-[11px] text-stone-700 font-mono pt-1.5 border-t border-black/10 select-none cursor-grab active:cursor-grabbing relative z-10"
        >
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setTitleInput(item.title || 'Note');
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="bg-black/5 border border-black/20 rounded px-1 text-[11px] font-mono font-bold text-stone-900 outline-none w-24"
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Nhấp để đổi tên ghi chú"
              className="hover:underline font-bold text-stone-800 hover:text-stone-950 cursor-text truncate max-w-[105px] text-left"
            >
              {item.title || 'Note'}
            </button>
          )}

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasRichView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingContent(!isEditingContent);
                }}
                title={isEditingContent ? 'Xem dạng trực quan' : 'Chỉnh sửa văn bản'}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-stone-800 font-bold text-[10px] cursor-pointer transition-colors"
              >
                {isEditingContent ? (
                  <>
                    <Eye className="w-3 h-3 text-slate-700" />
                    <span>Xem</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3 text-slate-700" />
                    <span>Sửa</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? 'Thu gọn khung ghi chú' : 'Mở rộng khung ghi chú để đọc thoải mái'}
              className="text-[10px] text-stone-600 hover:text-stone-950 font-bold px-1 py-0.2 rounded hover:bg-black/5 transition-colors cursor-pointer"
            >
              {isExpanded ? 'Thu gọn' : 'Mở rộng'}
            </button>
            <span className="text-stone-500 font-medium">{text.length} ký tự</span>
          </div>
        </div>
      </div>

      {/* Floating Control Toolbar with Invisible Hover Bridge — LUÔN NẰM TRÊN NOTE */}
      <div 
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-slate-800 px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-200/90 backdrop-blur-md transition-opacity duration-150 z-30 before:absolute before:inset-x-0 before:-bottom-3.5 before:h-4 before:content-[''] ${
          isSelected || isColorPickerOpen
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Single Color Circle with Miro 16-color Palette Popup */}
        <div className="relative flex items-center pr-1.5 border-r border-slate-200">
          <button
            title="Đổi màu ghi chú (Nhấp để mở bảng 16 màu)"
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            style={{ backgroundColor: item.stickyColor || '#fef08a' }}
            className="w-5 h-5 rounded-full border-2 border-white shadow-xs ring-1 ring-black/25 hover:scale-115 transition-transform cursor-pointer flex items-center justify-center flex-shrink-0"
          />

          {/* Miro-style 16-color Palette Grid Popup */}
          {isColorPickerOpen && (
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2.5 grid grid-cols-4 gap-2 z-50 animate-fade-in w-44"
              onClick={(e) => e.stopPropagation()}
            >
              {miroColors.map((c) => {
                const isCur = (item.stickyColor || '#fef08a').toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    title={c.label}
                    onClick={() => {
                      updateStickyNoteColor?.(item.id, c.value);
                      setIsColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: c.value }}
                    className="w-8 h-8 rounded-full border border-black/10 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer shadow-2xs relative"
                  >
                    {isCur && (
                      <Check className={`w-4 h-4 stroke-[2.5] ${c.isDark ? 'text-white' : 'text-slate-900'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bold Toggle (B) */}
        <button
          title={isBold ? 'Bỏ in đậm toàn bộ chữ' : 'In đậm toàn bộ chữ (Bold)'}
          onClick={() => {
            const nextBold = !isBold;
            setIsBold(nextBold);
            updateStickyNoteIsBold?.(item.id, nextBold);
          }}
          className={`px-2 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
            isBold ? 'bg-slate-200 text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          B
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Text Alignment (Left, Mid/Center, Right) */}
        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 gap-0.5">
          <button
            title="Căn lề trái"
            onClick={() => {
              setTextAlign('left');
              updateStickyNoteTextAlign?.(item.id, 'left');
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              textAlign === 'left'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 stroke-[2.4]" />
          </button>
          <button
            title="Căn lề giữa (Mid)"
            onClick={() => {
              setTextAlign('center');
              updateStickyNoteTextAlign?.(item.id, 'center');
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              textAlign === 'center'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5 stroke-[2.4]" />
          </button>
          <button
            title="Căn lề phải"
            onClick={() => {
              setTextAlign('right');
              updateStickyNoteTextAlign?.(item.id, 'right');
            }}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              textAlign === 'right'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5 stroke-[2.4]" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Duplicate Note (Miro-style feature) */}
        <button
          title="Nhân bản ghi chú (Duplicate)"
          onClick={() => {
            addStickyNote(
              text,
              item.x + 30,
              item.y + 30,
              item.stickyColor || '#fef08a',
              item.width || 220,
              item.height || 200
            );
          }}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 stroke-[2.4]" />
        </button>

        {/* Free Continuous 360 Rotation */}
        <button
          title="Kéo để xoay ghi chú tự do, nhấn đúp để xoay thẳng ngay ngắn (0°)"
          onMouseDown={handleRotateMouseDown}
          onDoubleClick={handleRotateDoubleClick}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-grab active:cursor-grabbing"
        >
          <RotateTwoWay className="w-3.5 h-3.5 stroke-[2.4]" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Delete Note */}
        <button
          title="Xóa ghi chú này"
          onClick={() => removeDeskItem(item.id)}
          className="p-1 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
        </button>
      </div>

      {/* ================= INLINE INTELINE POPOVER AT THE END OF HIGHLIGHTED TEXT ================= */}
      {selectionPopover && (
        <div 
          data-inteline-popover="true"
          style={{ left: selectionPopover.x, top: selectionPopover.y }}
          className="absolute -translate-x-1/2 z-50 animate-fade-in pointer-events-auto w-[280px] bg-white text-stone-900 rounded-xl shadow-2xl border border-stone-300/90 p-3 select-text font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Lightbulb className="w-4 h-4 text-[#16A34A]" />
              <span className="text-xs font-black tracking-tight">Inteline — Note AI</span>
            </div>
            <button 
              onClick={() => setSelectionPopover(null)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected Quote Preview */}
          <p className="text-[11px] italic text-stone-700 line-clamp-2 mb-2 bg-stone-50 p-2 rounded-lg border border-stone-200/80 leading-relaxed font-sans">
            &ldquo;{selectionPopover.text}&rdquo;
          </p>

          {/* AI Answer Box if answered */}
          {selectionPopover.answer && (
            <div className="mb-2 p-2.5 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] text-xs leading-relaxed text-[#15803D]">
              <div className="font-bold text-[#15803D] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#15803D]" />
                  <span>Giải đáp:</span>
                </span>
                <button
                  onClick={() => {
                    addStickyNote(`[Inteline Q&A]\n${selectionPopover.text.slice(0, 50)}...\n\n${selectionPopover.answer}`, item.x + 240, item.y + 20, '#fef08a');
                    setSelectionPopover(null);
                  }}
                  className="text-[10px] text-[#15803D] hover:underline font-bold bg-white px-2 py-0.5 rounded border border-[#A7F3D0]"
                >
                  + Ghim Note
                </button>
              </div>
              <p className="whitespace-pre-line text-slate-900 font-medium text-[11.5px] font-sans">{selectionPopover.answer}</p>
            </div>
          )}

          {/* Quick Suggestion Pills */}
          {!selectionPopover.answer && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <button
                disabled={selectionPopover.loading}
                onClick={() => handleQuickAsk('Giải thích ngắn gọn đoạn này')}
                className="px-2 py-0.5 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[10px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
              >
                Giải thích ngắn
              </button>
              <button
                disabled={selectionPopover.loading}
                onClick={() => handleQuickAsk('Cho ví dụ thực tế')}
                className="px-2 py-0.5 bg-[#F0FDF4] hover:bg-[#FFEDD5] text-[#166534] text-[10px] font-bold rounded-full border border-[#BBF7D0] transition-all cursor-pointer active:scale-95"
              >
                Cho ví dụ
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              spellCheck={false}
              placeholder={selectionPopover.loading ? 'AI đang phân tích...' : 'Đặt câu hỏi...'}
              value={selectionPopover.question}
              onChange={(e) => {
                const val = e.target.value;
                setSelectionPopover(prev => prev ? { ...prev, question: val } : null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickAsk();
                }
              }}
              disabled={selectionPopover.loading}
              className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#16A34A] focus:bg-white text-slate-900 font-sans"
            />
            <button
              onClick={() => handleQuickAsk()}
              disabled={selectionPopover.loading || !selectionPopover.question.trim()}
              className="p-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const StickyNoteItem = React.memo(StickyNoteItemComponent);
