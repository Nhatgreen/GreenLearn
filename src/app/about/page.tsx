'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Cpu, Sparkles, Zap, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';
import { getAssetPath } from '@/lib/assets';

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col font-sans selection:bg-green-100 selection:text-[#16A34A]">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
            </Link>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAssetPath('/icons/greenlearn-icon.png')}
                alt="GreenLearn"
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl object-contain shadow-xs flex-shrink-0"
                style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px' }}
              />
              <span className="text-base font-bold tracking-tight text-stone-900">
                <span className="text-[#16A34A]">Green</span>
                <span className="text-[#242D3D]">Learn</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/?view=desk"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <span>Vào bàn học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main intro & tech content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Hero Section cho khách */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/80 text-[#166534] text-[11px] font-bold mb-4">
            <Sparkles className="w-3 h-3 text-[#16A34A]" />
            Không gian học thức tích hợp AI 2.5D
          </span>
          <h1 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight leading-tight mb-5">
            Trải giáo trình, đề thi và vở nháp trên cùng một bàn học
          </h1>
          <p className="text-sm md:text-base text-stone-600 leading-relaxed mb-8">
            GreenLearn số hóa trải nghiệm học tập thực tế: bạn không phải chuyển qua lại giữa các tab rời rạc, mà có thể dàn trải đồng thời giáo trình, tờ bài tập và giấy ghi chú trên một mặt bàn vô cực mượt mà.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              Đăng nhập tài khoản
            </Link>
            <Link
              href="/?view=desk"
              className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              Vào học ngay (Miễn phí)
            </Link>
          </div>
        </div>

        {/* Real Animated / Interactive Desk Preview Mockup */}
        <div className="w-full aspect-[16/9] rounded-2xl bg-white border border-stone-200/90 shadow-sm p-4 md:p-6 mb-16 relative overflow-hidden flex items-center justify-center">
          {/* Desk Grid background pattern */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Realistic Book on desk */}
          <div className="w-80 md:w-96 h-52 md:h-64 rounded-xl border-4 border-[#5c3920] bg-white shadow-xl relative flex overflow-hidden z-10">
            <div className="w-1/2 border-r border-stone-200 p-3 md:p-4 flex flex-col justify-between bg-[#fdfbf7]">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Chương 1</span>
                <h4 className="text-xs font-bold text-stone-900 mt-1">Đạo hàm & Gradient Descent</h4>
                <p className="text-[11px] text-stone-600 mt-2 font-mono leading-relaxed">
                  {'$$\\nabla f(x) = [\\partial f / \\partial x_1, \\dots, \\partial f / \\partial x_n]^T$$'}
                </p>
              </div>
              <span className="text-[9px] text-stone-400 font-mono">Trang 1</span>
            </div>
            <div className="w-1/2 p-3 md:p-4 flex flex-col justify-between bg-[#fdfbf7]">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Ôn tập trắc nghiệm</span>
                <p className="text-[10px] text-stone-700 mt-1 leading-relaxed">
                  Vectơ gradient luôn chỉ hướng hàm số tăng nhanh nhất trong không gian đa chiều.
                </p>
              </div>
              <span className="text-[9px] text-stone-400 font-mono text-right">Trang 2</span>
            </div>
          </div>

          {/* Sticky Note next to book */}
          <div className="absolute top-8 right-6 md:right-16 w-32 md:w-40 h-32 md:h-40 rounded-xl bg-[#fef08a] shadow-lg p-3 z-20 rotate-2 border border-amber-200/60 flex flex-col justify-between">
            <div className="w-8 h-2 bg-amber-300/60 rounded-full mx-auto" />
            <p className="text-[10px] md:text-xs text-amber-950 font-medium leading-relaxed">
              Bôi đen công thức để hỏi AI Inteline hoặc trích xuất thẻ flashcard ôn tập!
            </p>
            <span className="text-[9px] text-amber-700/80 font-mono">Ghi chú</span>
          </div>
        </div>

        {/* ================= CHI TIẾT KỸ THUẬT ================= */}
        <section className="border-t border-stone-200/80 pt-12">
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-serif text-stone-900">Chi tiết kỹ thuật nền tảng</h2>
            <p className="text-xs md:text-sm text-stone-500 mt-1">
              Các giải pháp công nghệ giúp GreenLearn đạt hiệu năng tối đa và tính công thái học cao.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spec 1: KaTeX */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mb-4">
                <Cpu className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">KaTeX Math Rendering</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Biên dịch công thức toán học và biểu thức LaTeX thời gian thực với bộ đệm toàn cục <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded font-mono">katexHtmlCache</code>. Chi phí biên dịch 0ms trên các lần xem tiếp theo.
              </p>
            </div>

            {/* Spec 2: SM-2 Algorithm */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <Zap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">Thuật toán SM-2 Spaced Repetition</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Hệ thống lặp lại ngắt quãng tính toán độ nhớ, hệ số dễ nhớ (Ease Factor) và xếp lịch nhắc ôn lại thẻ flashcard vào thời điểm vàng trước khi não bộ quên kiến thức.
              </p>
            </div>

            {/* Spec 3: 60 FPS Zoom & Geometric Precision */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1">Smooth 60 FPS & Zero-Blur Vector</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Gom sự kiện cuộn chuột qua <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded font-mono">requestAnimationFrame</code> mượt mà 60fps. Phông chữ vector <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded font-mono">geometricPrecision</code> sắc nét 100% ở mọi tỷ lệ thu phóng 200% - 400%.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
