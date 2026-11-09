'use client';

import React, { useState } from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';
import { 
  MousePointer, 
  StickyNote, 
  Highlighter, 
  PenTool, 
  Eraser, 
  Sparkles, 
  BoxSelect, 
  Undo2, 
  Redo2,
  Lock, 
  Unlock, 
  Trash2,
  Plus,
  Shapes,
  Tag,
  Smile,
  Code2,
  Table,
  Network,
  Video,
  X
} from 'lucide-react';
import { StickerEmojiPickerFlyout, StickerPickerItem } from '@/components/hud/StickerEmojiPickerFlyout';

export function LeftCreationBar() {
  const {
    activeTool,
    setActiveTool,
    penColor,
    setPenColor,
    penWidthLevel,
    setPenWidthLevel,
    setStickyCreationColor,
    setStickyCreationTemplate,
    isPanLocked,
    togglePanLock,
    strokes,
    undoStroke,
    redoStroke,
    redoStack,
    clearStrokes,
    addStickyNote
  } = useStudySpace();

  const [isNoteFlyoutOpen, setIsNoteFlyoutOpen] = useState(false);
  const [isPenFlyoutOpen, setIsPenFlyoutOpen] = useState(false);
  const [isPenColorPickerOpen, setIsPenColorPickerOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);

  // Note pastel colors
  const stickyColors = [
    { label: 'Vàng nắng', value: '#fef08a' },
    { label: 'Cam nhạt', value: '#fed7aa' },
    { label: 'Xanh lá nhạt', value: '#bbf7d0' },
    { label: 'Xanh dương nhạt', value: '#bae6fd' },
    { label: 'Hồng phấn', value: '#fbcfe8' }
  ];

  // Pen stroke colors
  const penColors = [
    { label: 'Xanh dương', value: '#2563eb' },
    { label: 'Đỏ', value: '#dc2626' },
    { label: 'Đen', value: '#0f172a' },
    { label: 'Xanh lá', value: '#16a34a' },
    { label: 'Vàng', value: '#eab308' },
    { label: 'Tím', value: '#9333ea' }
  ];

  // More Tools List (Shapes and lines, Sticker, Emojis and GIFs, Code block, Table, Mind map)
  const extraTools = [
    {
      id: 'shapes_and_lines',
      title: 'Shapes and lines',
      desc: 'Vẽ hình khối và đường kẻ nối thông minh',
      icon: <Shapes className="w-5 h-5 text-slate-800 stroke-[2.2]" />
    },
    {
      id: 'stickers_and_emojis',
      title: 'Stickers, Emojis & GIFs',
      desc: 'Hình dán, biểu tượng cảm xúc và GIF động',
      icon: <Smile className="w-5 h-5 text-slate-800 stroke-[2.2]" />
    },
    {
      id: 'code_block',
      title: 'Code block',
      desc: 'Khối mã nguồn & cú pháp code lập trình',
      icon: <Code2 className="w-5 h-5 text-slate-800 stroke-[2.2]" />
    },
    {
      id: 'table',
      title: 'Table',
      desc: 'Bảng dữ liệu hàng và cột có cấu trúc',
      icon: <Table className="w-5 h-5 text-slate-800 stroke-[2.2]" />
    },
    {
      id: 'mind_map',
      title: 'Mind map',
      desc: 'Sơ đồ tư duy liên kết ý tưởng học tập',
      icon: <Network className="w-5 h-5 text-slate-800 stroke-[2.2]" />
    },
    {
      id: 'screen_record',
      title: 'Record screen',
      desc: 'Ghi hình bài giảng & màn hình học tập',
      icon: <Video className="w-5 h-5 text-rose-600 stroke-[2.2]" />
    }
  ];

  const isDrawingActive = ['pen', 'highlighter', 'smart_shape', 'eraser', 'area_eraser'].includes(activeTool);

  const handleSelectNoteColor = (color: string) => {
    setStickyCreationTemplate?.(null);
    setStickyCreationColor(color);
    setActiveTool('create_note');
    setIsNoteFlyoutOpen(false);
    setIsPenFlyoutOpen(false);
    setIsMoreToolsOpen(false);
  };

  const handleSelectStickerItem = (item: StickerPickerItem) => {
    setIsStickerPickerOpen(false);
    const targetW = item.width || (item.type === 'gif' ? 260 : item.type === 'sticker' ? 140 : 100);
    const targetH = item.height || (item.type === 'gif' ? 200 : item.type === 'sticker' ? 140 : 100);
    setStickyCreationTemplate?.({
      itemType: 'sticker',
      stickerData: item,
      width: targetW,
      height: targetH,
      typeLabel: `${item.type === 'gif' ? 'GIF động' : item.type === 'sticker' ? 'Hình dán' : 'Biểu tượng'}: ${item.name}`
    });
    setActiveTool('create_note');
  };

  const handleSelectExtraTool = (toolId: string) => {
    setIsMoreToolsOpen(false);
    if (toolId === 'screen_record') {
      window.dispatchEvent(new CustomEvent('vitudy:open-record-modal'));
      return;
    }
    if (toolId === 'shapes_and_lines') {
      setActiveTool('smart_shape');
      return;
    }
    if (toolId === 'code_block') {
      setStickyCreationTemplate?.({
        itemType: 'code_block',
        codeSnippet: 'print screen\nhello;',
        codeLanguage: 'javascript',
        width: 480,
        height: 180,
        typeLabel: 'Khối mã nguồn (Code block)'
      });
      setActiveTool('create_note');
      return;
    }
    if (toolId === 'table') {
      setStickyCreationTemplate?.({
        text: '| Mục tiêu | Trọng số | Tiến độ |\n|----------|----------|---------|\n| Giải tích | 40%      | Đang ôn |\n| Đại số    | 30%      | Đã xong |',
        color: '#f8fafc',
        width: 340,
        height: 220,
        typeLabel: 'Bảng dữ liệu (Table)'
      });
      setStickyCreationColor('#f8fafc');
      setActiveTool('create_note');
      return;
    }
    if (toolId === 'mind_map') {
      setStickyCreationTemplate?.({
        itemType: 'mind_map',
        text: '',
        mindMapColor: '#a855f7',
        width: 240,
        height: 64,
        typeLabel: 'Sơ đồ tư duy (Mind map)'
      });
      setActiveTool('create_note');
      return;
    }
    if (toolId === 'stickers' || toolId === 'emojis_and_gifs' || toolId === 'stickers_and_emojis') {
      setIsStickerPickerOpen(true);
      return;
    }
  };

  const currentPenIcon = (() => {
    if (activeTool === 'highlighter') return <Highlighter className="w-5 h-5 stroke-[2.4]" />;
    if (activeTool === 'smart_shape') return <Sparkles className="w-5 h-5 stroke-[2.4]" />;
    if (activeTool === 'eraser') return <Eraser className="w-5 h-5 stroke-[2.4]" />;
    if (activeTool === 'area_eraser') return <BoxSelect className="w-5 h-5 stroke-[2.4]" />;
    return <PenTool className="w-5 h-5 stroke-[2.4]" />;
  })();

  return (
    <div className="relative flex flex-col items-center gap-1.5 pointer-events-auto select-none">
      {/* Miro-style Vertical Tool Island (Optimized compact spacing) */}
      <div className="bg-white/95 border border-slate-300 rounded-2xl p-1.5 shadow-lg backdrop-blur-md flex flex-col items-center gap-1 relative">
        {/* Select (Cursor) Tool */}
        <button
          title="Con trỏ điều hướng (Kéo di chuyển bàn / Chọn vật thể)"
          onClick={() => {
            setActiveTool('cursor');
            setIsNoteFlyoutOpen(false);
            setIsPenFlyoutOpen(false);
            setIsMoreToolsOpen(false);
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTool === 'cursor'
              ? 'bg-slate-200 text-slate-900 shadow-xs font-bold border border-slate-300'
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          <MousePointer className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>

        {/* Sticky Note Button (+ Note with vertical color flyout) */}
        <button
          title="Tạo giấy ghi chú (Bấm để chọn màu & kéo thả kích thước)"
          onClick={() => {
            setIsNoteFlyoutOpen(!isNoteFlyoutOpen);
            setIsPenFlyoutOpen(false);
            setIsMoreToolsOpen(false);
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTool === 'create_note' || isNoteFlyoutOpen
              ? 'bg-slate-200 text-slate-900 border border-slate-300 shadow-xs'
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          <StickyNote className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>

        {/* Unified Pen Button with Miro-style Full Overlay Flyout */}
        <button
          data-tour="tool-pen"
          title="Bộ công cụ bút vẽ, dạ quang, vẽ thông minh & tẩy (Bấm để mở bảng chọn)"
          onClick={() => {
            setIsPenFlyoutOpen(!isPenFlyoutOpen);
            setIsNoteFlyoutOpen(false);
            setIsMoreToolsOpen(false);
            if (!isDrawingActive) {
              setActiveTool('pen');
            }
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isDrawingActive || isPenFlyoutOpen
              ? 'bg-slate-200 text-slate-900 shadow-xs font-bold border border-slate-300'
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          {currentPenIcon}
        </button>

        {/* Gạch chia vùng NẰM TRÊN nút + */}
        <div className="w-7 h-[1px] bg-slate-200 my-0.5" />

        {/* Nút + Công cụ mở rộng (More tools) - nằm dưới pen và trên lock */}
        <button
          title="Công cụ mở rộng (Shapes, Stickers, Code, Table, Mind map...)"
          onClick={() => {
            setIsMoreToolsOpen(!isMoreToolsOpen);
            setIsNoteFlyoutOpen(false);
            setIsPenFlyoutOpen(false);
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isMoreToolsOpen
              ? 'bg-slate-200 text-slate-900 shadow-xs font-bold border border-slate-300'
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Plus className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>

        {/* Gạch chia vùng NẰM DƯỚI nút + */}
        <div className="w-7 h-[1px] bg-slate-200 my-0.5" />

        {/* Lock Pan View Toggle */}
        <button
          title={isPanLocked ? 'Mở khóa di chuyển bàn' : 'Khóa góc nhìn bàn học'}
          onClick={togglePanLock}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isPanLocked
              ? 'bg-slate-200 text-slate-900 shadow-xs font-bold border border-slate-300'
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          {isPanLocked ? <Lock className="w-5 h-5 text-slate-900 stroke-[2.4]" /> : <Unlock className="w-5 h-5 text-slate-900 stroke-[2.4]" />}
        </button>

        {/* ================= VERTICALLY CENTERED NOTE COLOR FLYOUT ================= */}
        {isNoteFlyoutOpen && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white border border-slate-300 rounded-2xl p-2 shadow-xl flex flex-col gap-2 z-50 animate-fade-in">
            {stickyColors.map(c => (
              <button
                key={c.value}
                title={`Tạo note màu ${c.label} (Kéo thả vùng để chọn kích thước)`}
                onClick={() => handleSelectNoteColor(c.value)}
                style={{ backgroundColor: c.value }}
                className="w-7 h-7 rounded-lg border border-black/15 shadow-xs hover:scale-125 transition-transform cursor-pointer relative group flex items-center justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* ================= VERTICALLY CENTERED PEN SUB-TOOLBAR FLYOUT ================= */}
        {isPenFlyoutOpen && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white border border-slate-300 rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-2 z-50 animate-fade-in min-w-[46px]">
            {/* Tool 1: Pen (Bút vẽ thường) */}
            <button
              title="Bút vẽ tự do (Pen)"
              onClick={() => setActiveTool('pen')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                  : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-4.5 h-4.5 text-slate-900 stroke-[2.4]" />
            </button>

            {/* Tool 2: Highlighter (Bút dạ quang) */}
            <button
              title="Bút dạ quang đánh dấu (Highlighter)"
              onClick={() => setActiveTool('highlighter')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                  : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-4.5 h-4.5 text-slate-900 stroke-[2.4]" />
            </button>

            {/* Tool 3: Smart Shape (Vẽ thông minh) */}
            <button
              title="Vẽ thông minh: Tự động uốn nắn thành hình tròn, vuông, elip, tam giác hoàn hảo"
              onClick={() => setActiveTool('smart_shape')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'smart_shape'
                  ? 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                  : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5 text-slate-900 stroke-[2.4]" />
            </button>

            {/* Tool 4: Click Eraser (Tẩy chọn nét) */}
            <button
              title="Tẩy chạm: Nhấp vào nét vẽ để xóa"
              onClick={() => setActiveTool('eraser')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                  : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-4.5 h-4.5 text-slate-900 stroke-[2.4]" />
            </button>

            {/* Tool 5: Area Eraser (Tẩy vùng kéo chọn) */}
            <button
              title="Tẩy vùng: Kéo khung chữ nhật để xóa toàn bộ nét vẽ bên trong"
              onClick={() => setActiveTool('area_eraser')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTool === 'area_eraser'
                  ? 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                  : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BoxSelect className="w-4.5 h-4.5 text-slate-900 stroke-[2.4]" />
            </button>

            <div className="w-7 h-[1px] bg-slate-200 my-0.5" />

            {/* Stroke Width Selector (3 kích thước: S, M, L) */}
            <div className="flex flex-col items-center gap-1.5 py-0.5">
              <button
                title="Nét mảnh (Nhỏ)"
                onClick={() => setPenWidthLevel('small')}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  penWidthLevel === 'small' ? 'bg-slate-100 ring-2 ring-[#E0562D]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              </button>
              <button
                title="Nét vừa (Trung bình)"
                onClick={() => setPenWidthLevel('medium')}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  penWidthLevel === 'medium' ? 'bg-slate-100 ring-2 ring-[#E0562D]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              </button>
              <button
                title="Nét dày (Lớn)"
                onClick={() => setPenWidthLevel('large')}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  penWidthLevel === 'large' ? 'bg-slate-100 ring-2 ring-[#E0562D]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-900" />
              </button>
            </div>

            <div className="w-7 h-[1px] bg-slate-200 my-0.5" />

            {/* Single Current Color Button with Compact Popup (Ảnh 1) */}
            <div className="relative pb-0.5">
              <button
                title="Bấm để đổi màu nét vẽ (Mở bảng 6 màu)"
                onClick={() => setIsPenColorPickerOpen(!isPenColorPickerOpen)}
                style={{ backgroundColor: penColor }}
                className="w-7 h-7 rounded-full border-2 border-white ring-2 ring-[#E0562D] shadow-xs hover:scale-115 transition-transform cursor-pointer flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              </button>

              {/* Flyout 6-Color Palette Grid (3 columns x 2 rows) */}
              {isPenColorPickerOpen && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white border border-slate-300 rounded-2xl p-2 shadow-2xl backdrop-blur-md grid grid-cols-3 gap-2 z-50 animate-fade-in w-28">
                  {penColors.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => {
                        setPenColor(c.value);
                        setIsPenColorPickerOpen(false);
                      }}
                      style={{ backgroundColor: c.value }}
                      className={`w-7 h-7 rounded-full border border-black/15 transition-transform hover:scale-115 cursor-pointer flex items-center justify-center ${
                        penColor === c.value ? 'ring-2 ring-[#E0562D] scale-105' : ''
                      }`}
                    >
                      {penColor === c.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= MORE TOOLS FLYOUT (Miro-style, Zero Search) ================= */}
        {isMoreToolsOpen && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white border border-slate-300 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 z-50 animate-fade-in w-72 text-slate-900 select-none">
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100 mb-1">
              <span className="text-xs font-black text-slate-900 tracking-wide uppercase">
                Công cụ mở rộng
              </span>
              <button
                onClick={() => setIsMoreToolsOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {extraTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectExtraTool(tool.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs border border-slate-200/60 flex items-center justify-center text-slate-800 transition-all flex-shrink-0">
                    {tool.icon}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#E0562D] transition-colors leading-tight">
                      {tool.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                      {tool.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sticker, Emoji & GIF Picker Flyout (Matches Image 1) */}
        <StickerEmojiPickerFlyout
          isOpen={isStickerPickerOpen}
          onClose={() => setIsStickerPickerOpen(false)}
          onSelect={handleSelectStickerItem}
        />
      </div>

      {/* Grouped Undo & Redo Column Pill below toolbar (Width and button sizes matching the main toolbar above) */}
      <div className="w-full bg-white/95 border border-slate-300 rounded-2xl p-1.5 shadow-md backdrop-blur-md flex flex-col items-center gap-1 text-slate-900">
        <button
          title="Hoàn tác nét vẽ (Undo • Ctrl+Z)"
          onClick={undoStroke}
          disabled={strokes.length === 0}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            strokes.length > 0
              ? 'text-slate-800 hover:bg-slate-100 hover:text-black active:scale-95'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-5 h-5 stroke-[2.4]" />
        </button>

        <button
          title="Làm lại nét vẽ (Redo • Ctrl+Y)"
          onClick={redoStroke}
          disabled={redoStack.length === 0}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            redoStack.length > 0
              ? 'text-slate-800 hover:bg-slate-100 hover:text-black active:scale-95'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-5 h-5 stroke-[2.4]" />
        </button>

        {strokes.length > 0 && (
          <>
            <div className="w-7 h-[1px] bg-slate-200 my-0.5" />
            <button
              title="Xóa toàn bộ nét vẽ"
              onClick={clearStrokes}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
            >
              <Trash2 className="w-5 h-5 stroke-[2.4]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
