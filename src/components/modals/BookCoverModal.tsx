'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, 
  X, 
  Check, 
  Sparkles, 
  MousePointerClick, 
  Plus, 
  FileText, 
  Columns, 
  Layers 
} from 'lucide-react';
import { BOOK_COVER_PRESETS } from '@/components/objects/BookSpread';

export interface BookInitialPage {
  title?: string;
  text: string;
  image?: string;
}

interface BookCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceToCenter: (title: string, coverColor: string, pages: BookInitialPage[]) => void;
  onStartStampPlacement: (title: string, coverColor: string, pages: BookInitialPage[]) => void;
}

type BookTemplateType = 'empty' | 'general' | 'cornell';

const QUICK_TITLE_CHIPS = [
  'Sổ tay ghi chép',
  'Giáo trình bài học',
  'Vở bài tập thực hành',
  'Sổ Cornell ôn thi'
];

export function BookCoverModal({
  isOpen,
  onClose,
  onPlaceToCenter,
  onStartStampPlacement
}: BookCoverModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('Sổ tay bài học');
  const [coverColor, setCoverColor] = useState('brown');
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplateType>('empty');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to dismiss
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

  if (!isOpen || !mounted) return null;

  const activePreset = BOOK_COVER_PRESETS.find(p => p.id === coverColor) || BOOK_COVER_PRESETS[0];

  const getTemplatePages = (type: BookTemplateType, currentTitle: string): BookInitialPage[] => {
    const bookTitle = currentTitle.trim() || 'Sổ tay bài học';
    if (type === 'empty') {
      return [];
    }

    if (type === 'cornell') {
      return [
        {
          title: 'Bài 1: Cornell Note — Khởi động',
          text: `# ${bookTitle}\n## Phương Pháp Ghi Chép Cornell — Bài 1\n\n### Cột Từ Khóa & Câu Hỏi Ôn Tập:\n- Ý niệm cốt lõi của bài là gì?\n- Công thức trọng tâm cần nhớ?\n\n### Cột Ghi Chú Chi Tiết:\n1. Ghi lại các định nghĩa và luận điểm quan trọng.\n2. Sử dụng ký hiệu viết tắt để tiết kiệm thời gian.\n3. Liệt kê các ví dụ minh họa và trường hợp đặc biệt.\n\n---\n### Tóm Tắt Cuối Trang (Summary):\n*Tóm tắt ngắn gọn 2-3 câu về nội dung then chốt của bài học.*`
        },
        {
          title: 'Bài 2: Cornell Note — Phát triển lý thuyết',
          text: `## Cornell Note — Phát triển lý thuyết\n\n### Cột Từ Khóa & Vấn Đề:\n- Điều kiện áp dụng định lý?\n- Sai lầm phổ biến khi giải toán?\n\n### Cột Ghi Chú Chi Tiết:\n- Định lý mở rộng và hệ quả đi kèm.\n- Mô hình toán học:\n$$\\nabla f(x) = 0$$\n- Các bước kiểm tra nghiệm tối ưu.\n\n---\n### Tóm Tắt Cuối Trang (Summary):\n*Lưu ý các trường hợp biên và điều kiện đủ của nghiệm.*`
        },
        {
          title: 'Bài 3: Cornell Note — Bài tập rèn luyện',
          text: `## Cornell Note — Bài tập áp dụng\n\n### Cột Câu Hỏi Kiểm Tra:\n- Dạng toán này thuộc nhóm nào?\n- Phương pháp giải tối ưu nhất?\n\n### Cột Ghi Chú Lời Giải:\n1. Phân tích giả thiết và kết luận.\n2. Lập các bước biến đổi trung gian.\n3. Đối chiếu đáp số với điều kiện xác định.\n\n---\n### Tóm Tắt Cuối Trang (Summary):\n*Rút ra bài học kinh nghiệm và quy tắc nhẩm nhanh.*`
        },
        {
          title: 'Bài 4: Cornell Note — Ôn tập & Mở rộng',
          text: `## Cornell Note — Ôn tập tổng kết\n\n### Cột Khái Quát Hóa:\n- Bản đồ liên kết kiến thức.\n- Các câu hỏi chưa được giải đáp.\n\n### Cột Hành Động Tiếp Theo:\n- Tạo bộ Flashcard ôn tập định kỳ.\n- Thực hiện bài kiểm tra trắc nghiệm AI 15 phút.\n\n---\n### Tóm Tắt Toàn Cuốn (Master Summary):\n*Toàn bộ mục tiêu học tập của chuyên đề đã được tổng hợp đầy đủ.*`
        }
      ];
    }

    // Default 'general' template
    return [
      {
        title: 'Mục lục & Giới thiệu',
        text: `# ${bookTitle}\n\nChào mừng bạn đến với cuốn sổ tay học tập cá nhân hóa trên GreenLearn.\n\n### Hướng dẫn sử dụng:\n- Sử dụng các tab bookmark bên cạnh phải để lật nhanh giữa các trang.\n- Bấm công cụ STudy hoặc Inteline để trò chuyện hỏi đáp sâu với AI.\n- Ghi chú hoặc vẽ tự do trực tiếp lên mặt sách.`
      },
      {
        title: 'Phần 1: Kiến thức trọng tâm',
        text: `### 1. Khái niệm cốt lõi\n\nGhi chú các định nghĩa, định lý và công thức then chốt tại đây.\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n### 2. Điểm cần lưu ý\n- Nắm vững bản chất trước khi giải bài tập mẫu.\n- Liên kết với các sơ đồ tư duy liên quan trên bàn học.`
      },
      {
        title: 'Phần 2: Ví dụ minh họa & Ứng dụng',
        text: `### Ví dụ áp dụng thực tế:\n\nCho hàm mục tiêu tối ưu hóa:\n$$\\min_{x} f(x) \\quad \\text{với ràng buộc} \\quad g(x) \\le 0$$\n\nCác bước giải chi tiết:\n1. Xác định hàm mục tiêu và tập ràng buộc khả thi.\n2. Lập hàm Lagrange tương ứng.\n3. Giải hệ phương trình điều kiện KKT.`
      },
      {
        title: 'Phần 3: Bài tập rèn luyện & Tổng kết',
        text: `### Câu hỏi tự kiểm tra:\n1. Nêu sự khác biệt giữa hai phương pháp tiếp cận chính.\n2. Phân tích độ phức tạp thuật toán và đánh giá hiệu năng.\n\n*Ghi chú ôn tập:* Hoàn thành bộ thẻ ghi nhớ flashcards và bài kiểm tra AI tương ứng.`
      }
    ];
  };

  const handlePlaceToCenter = () => {
    const finalTitle = title.trim() || 'Sổ tay bài học';
    const pages = getTemplatePages(selectedTemplate, finalTitle);
    onPlaceToCenter(finalTitle, coverColor, pages);
    onClose();
  };

  const handleStartStampPlacement = () => {
    const finalTitle = title.trim() || 'Sổ tay bài học';
    const pages = getTemplatePages(selectedTemplate, finalTitle);
    onStartStampPlacement(finalTitle, coverColor, pages);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shadow-xs">
              <BookOpen className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Thêm Sách & Sổ Tay Bìa Da
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tạo sách giáo trình hoặc sổ ghi chép bìa da cao cấp trên bàn học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Đóng hộp thoại (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top section: Live 3D Cover Preview & Leather Color Selector */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* 3D Realistic Book Cover Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div 
                style={{ 
                  background: activePreset.gradient,
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)'
                }}
                className="w-48 h-64 rounded-r-xl rounded-l-sm relative flex flex-col items-center justify-between p-4 transition-all duration-300 transform hover:scale-102 select-none group"
              >
                {/* Book Spine Shadow Left */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/50 via-white/10 to-transparent pointer-events-none rounded-l-sm" />
                <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-black/30 pointer-events-none" />

                {/* Bookmark Ribbon Hanging */}
                <div className="absolute top-0 right-4 w-4 h-9 bg-amber-400 shadow-md flex items-end justify-center pb-1 pointer-events-none">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[6px] border-b-white/90" />
                </div>

                {/* Embossed Inner Border Foil */}
                <div className="w-full h-full border border-amber-300/40 rounded-r-lg rounded-l-xs flex flex-col items-center justify-between p-3 relative">
                  {/* Top Emblem */}
                  <div className="w-8 h-8 rounded-full border border-amber-300/40 flex items-center justify-center text-amber-200/80 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>

                  {/* Embossed Book Title */}
                  <div className="text-center px-1 my-auto">
                    <div className="text-xs uppercase font-serif font-black tracking-wider text-amber-100 drop-shadow-md line-clamp-3">
                      {title.trim() || 'SỔ TAY BÀI HỌC'}
                    </div>
                    <div className="w-8 h-[1px] bg-amber-300/40 mx-auto my-2" />
                    <div className="text-[10px] text-amber-200/70 font-sans tracking-wide">
                      GreenLearn Notebook
                    </div>
                  </div>

                  {/* Bottom Leaf Indicator */}
                  <div className="text-[10px] text-amber-200/60 font-mono tracking-wider">
                    {selectedTemplate === 'empty' ? 'BÌA TRỐNG (0 TRANG)' : '4 TRANG'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">
                Xem trước bìa da thời gian thực
              </span>
            </div>

            {/* Right Side: Leather Swatches & Title Input */}
            <div className="md:col-span-7 space-y-4">
              {/* Leather Presets Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Chọn màu bìa da cao cấp
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {BOOK_COVER_PRESETS.map((preset) => {
                    const isSelected = coverColor === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCoverColor(preset.id)}
                        className={`group flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#16A34A] bg-green-50/60 ring-2 ring-[#16A34A]/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          style={{ background: preset.gradient }}
                          className={`w-8 h-8 rounded-lg shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 ${
                            isSelected ? 'scale-105' : ''
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-bold truncate max-w-full ${
                          isSelected ? 'text-[#166534]' : 'text-slate-600'
                        }`}>
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input & Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Tiêu đề sách / sổ tay
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên sách, giáo trình hoặc sổ ghi chép..."
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#16A34A] focus:ring-2 focus:ring-green-600/20 transition-all bg-white"
                />

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_TITLE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTitle(chip)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                        title === chip
                          ? 'bg-[#16A34A] text-white border-[#15803D]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Initial Page Structure Template */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              3. Chọn mẫu cấu trúc trang ban đầu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Empty Cover Template (Mặc định) */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('empty')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'empty'
                    ? 'border-[#16A34A] bg-green-50/50 ring-2 ring-[#16A34A]/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className={`w-4 h-4 ${selectedTemplate === 'empty' ? 'text-[#16A34A]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-900">Bìa trống</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-[#166534]">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Bìa sổ da hoàn toàn trống (0 trang) để bạn dán trang, kéo thả tài liệu vào bìa sách.
                  </p>
                </div>
              </button>

              {/* General Template */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('general')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'general'
                    ? 'border-[#16A34A] bg-green-50/50 ring-2 ring-[#16A34A]/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className={`w-4 h-4 ${selectedTemplate === 'general' ? 'text-[#16A34A]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-900">Sổ tổng hợp</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Mẫu sẵn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    4 trang mẫu gồm Mục lục, Kiến thức cốt lõi, Công thức KaTeX và Bài tập rèn luyện.
                  </p>
                </div>
              </button>

              {/* Cornell Template */}
              <button
                type="button"
                onClick={() => setSelectedTemplate('cornell')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'cornell'
                    ? 'border-[#16A34A] bg-green-50/50 ring-2 ring-[#16A34A]/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Columns className={`w-4 h-4 ${selectedTemplate === 'cornell' ? 'text-[#16A34A]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-900">Sổ Cornell</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      Ôn thi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chia cột Từ khóa / Câu hỏi gợi mở, Ghi chú chi tiết và Tóm tắt cuối trang chuẩn Cornell.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleStartStampPlacement}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              title="Kích hoạt con trỏ đóng dấu để nhấp vị trí đặt trên bàn học"
            >
              <MousePointerClick className="w-4 h-4 text-slate-700" />
              <span>Chọn vị trí đặt</span>
            </button>

            <button
              type="button"
              onClick={handlePlaceToCenter}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-green-600/20 active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm vào giữa bàn</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
