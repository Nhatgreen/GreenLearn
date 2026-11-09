'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';

interface HeroSectionProps {
  onEnterDesk: () => void;
}

function HandDrawnUnderline() {
  return (
    <svg
      className="absolute -bottom-2 left-0 w-full h-3 text-[#E0562D] pointer-events-none"
      viewBox="0 0 300 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 14C45 4 100 16 150 10C200 4 255 16 298 8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandDrawnArrow() {
  return (
    <svg
      className="w-12 h-9 text-[#E0562D] -rotate-12 pointer-events-none flex-shrink-0"
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 38C22 34 42 22 52 10M52 10L42 10M52 10L50 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroSection({ onEnterDesk }: HeroSectionProps) {
  // Cho phép kéo thả mẩu giấy ghi chú vàng trực tiếp trong mockup
  const [noteOffset, setNoteOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - noteOffset.x, y: e.clientY - noteOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setNoteOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <section 
      className="relative pt-12 pb-16 md:py-20 px-6 max-w-6xl mx-auto text-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Tiêu đề ngắn gọn, dùng font serif học thuật, đồng bộ từ "bàn học" */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-slate-900 tracking-tight leading-[1.2] max-w-4xl mx-auto mb-5">
        Trải giáo trình, đề thi và vở nháp{' '}
        <span className="relative inline-block text-[#E0562D] whitespace-nowrap">
          trên cùng một bàn học.
          <HandDrawnUnderline />
        </span>
      </h1>

      {/* Phụ đề gộp thành hai câu rõ ràng, một ý mỗi câu, loại bỏ lặp từ */}
      <div className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed space-y-1.5">
        <p>Lúc ôn thi, bạn thường phải mở tài liệu, đề thi và vở nháp cùng một lúc.</p>
        <p className="font-semibold text-slate-800">
          ViTudy gom tất cả lên một bàn học để bạn vừa đọc vừa ghi chú mà không cần chuyển qua lại giữa nhiều cửa sổ.
        </p>
      </div>

      {/* Nút hành động trực tiếp - đồng bộ tên nhãn "Vào bàn học" */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
        <button
          type="button"
          onClick={onEnterDesk}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#E0562D] hover:bg-[#c9451e] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Vào bàn học</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <Link
          href="/market"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>Xem chợ tài liệu</span>
        </Link>
      </div>

      {/* Bàn học mô phỏng: Sách da nâu đặt lệch, ghi chú vàng có thể kéo nháp thật */}
      <div className="relative max-w-5xl mx-auto bg-[#e8ebf0] rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-300 select-none text-left">
        {/* Nền lưới caro bàn học */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none rounded-3xl"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Thanh trạng thái phía trên bàn học với đệm thoáng và tương phản cao */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 px-3 py-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs z-20 relative">
          <div className="text-slate-800 text-xs sm:text-sm font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E0562D]" />
            <span className="font-bold text-[#E0562D]">Mẹo nhỏ:</span>
            <span>Nét bút dạ quang bám theo từng trang sách, khi di chuyển hay thu nhỏ bàn học nét vẽ vẫn ở nguyên chỗ cũ.</span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-600 sm:text-right flex-shrink-0">
            Bàn học trực quan 2.5D
          </div>
        </div>

        {/* Khung tài liệu xếp lệch tự nhiên */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start justify-center gap-6 pt-2 pb-2">
          
          {/* Cuốn sách mở đôi bìa da nâu, hơi nghiêng nhẹ */}
          <div 
            className="w-full lg:w-[620px] bg-[#5c3920] rounded-2xl p-3.5 shadow-2xl border border-[#3d2413] transition-transform duration-300 hover:rotate-0 -rotate-[0.8deg] relative flex-shrink-0"
          >
            {/* Thanh ruy-băng đánh dấu trang - nới rộng, hiển thị Ch. 1 rõ nét */}
            <div className="absolute -top-3 right-8 px-3 py-1 bg-emerald-600 text-white rounded-t-md text-xs font-bold flex items-center justify-center shadow-md whitespace-nowrap">
              Ch. 1
            </div>

            {/* Ruột giấy ngà mở đôi */}
            <div className="bg-[#fdfbf7] rounded-xl p-5 sm:p-7 shadow-inner border border-amber-200/70 grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              {/* Bóng rãnh gáy sách */}
              <div className="hidden sm:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-black/5 via-black/15 to-black/5 pointer-events-none" />

              {/* Trang bên trái */}
              <div className="space-y-2.5 sm:pr-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-b border-slate-200 pb-1">
                  <span>GIẢI TÍCH</span>
                  <span>Trang 42</span>
                </div>
                <h3 className="text-sm font-serif font-bold text-slate-900 leading-snug">
                  Đạo hàm riêng và Gradient
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed font-sans">
                  <MathRenderer content="Với hàm số $f(x)$, hướng tăng nhanh nhất tại một điểm là vector gradient tập hợp các đạo hàm riêng:" />
                </div>
                {/* Vệt bút dạ quang vàng trên công thức */}
                <div className="bg-yellow-200/70 px-2 py-1.5 rounded-md border border-yellow-300/60 text-xs text-slate-900 font-bold text-center">
                  <MathRenderer content="$$\nabla f(x) = \left( \frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n} \right)$$" />
                </div>
              </div>

              {/* Trang bên phải */}
              <div className="space-y-2.5 sm:pl-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-b border-slate-200 pb-1">
                  <span>BÀI TẬP VÍ DỤ</span>
                  <span>Trang 43</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  Cập nhật bước nhảy ngược hướng gradient:
                </h4>
                <div className="bg-white/80 p-2 rounded-lg border border-slate-200 text-xs text-center font-bold font-mono">
                  <MathRenderer content="$$w_{t+1} = w_t - \eta \cdot \nabla f(w_t)$$" />
                </div>
                <div className="text-[11px] text-slate-600 pt-1">
                  Bôi đen đoạn chữ bất kỳ để xem giải thích hoặc tạo câu hỏi trắc nghiệm tự kiểm tra.
                </div>
              </div>
            </div>
          </div>

          {/* Mẩu giấy ghi chú dán màu vàng, có thể kéo nháp thật */}
          <div className="w-full lg:w-[280px] flex flex-col gap-2 self-center lg:self-start lg:mt-4">
            
            <div 
              style={{
                transform: `translate(${noteOffset.x}px, ${noteOffset.y}px) rotate(2deg)`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              className="relative bg-[#fef08a] text-slate-900 rounded-xl p-4 shadow-xl border border-yellow-300/80 transition-shadow hover:shadow-2xl active:shadow-2xl select-none"
            >
              {/* Dải băng dính keo Washi màu vàng ngà, có độ nghiêng tự nhiên */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-amber-100/90 border border-amber-300/70 rounded-xs shadow-2xs rotate-[-2deg] pointer-events-none flex items-center justify-center">
                <div className="w-12 h-[1px] bg-amber-200/60" />
              </div>
              
              <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center justify-between pt-1">
                <span>Nháp tay của bạn</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              
              <p className="font-note text-base text-slate-800 leading-snug">
                Nếu chọn tốc độ học quá lớn, đồ thị sẽ nhảy qua lại và không tới được điểm đáy. Thử giảm xuống 0.01 xem sao.
              </p>

              <div className="mt-3 pt-2 border-t border-yellow-300/70 flex items-center justify-between text-[10px] text-amber-900 font-mono">
                <span>Ghi chú gắn kèm</span>
                <span>Ch. 1</span>
              </div>
            </div>

            {/* Mũi tên và chú thích căn sát mẩu giấy, viết hoa chuẩn mực */}
            <div className="hidden lg:flex items-center gap-1.5 pl-1 mt-1">
              <HandDrawnArrow />
              <span className="font-note text-sm text-[#E0562D] -rotate-3 font-bold leading-tight">
                Kéo mẩu giấy này sang bên cạnh để nháp bài.
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
