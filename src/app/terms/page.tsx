'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#16A34A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại bàn học</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-slate-900">Điều khoản sử dụng</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Quy định sử dụng bàn học GreenLearn</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight mb-2">
          Điều khoản sử dụng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-8">
          Áp dụng cho người dùng tài khoản và khách xem tự do.
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Mục đích của GreenLearn</h2>
            <p>
              GreenLearn là không gian bàn học trực tuyến 2.5D miễn phí giúp bạn gom sách giáo trình, ghi chú và đề thi vào cùng một màn hình để ôn tập trực quan. Khi sử dụng ứng dụng, bạn đồng ý với các quy định được nêu tại trang này.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Quyền đối với tài liệu bạn tải lên</h2>
            <p>
              Tài liệu, đề thi, hình ảnh và mẩu ghi chú bạn tải lên hoàn toàn thuộc quyền sở hữu của bạn. Dữ liệu được lưu trữ an toàn trong không gian học cá nhân của bạn trên trình duyệt và cơ sở dữ liệu Supabase được bảo vệ bằng cơ chế RLS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Nền tảng miễn phí & Dịch vụ AI BYOK</h2>
            <p>
              GreenLearn là nền tảng học tập cộng đồng hoàn toàn phi lợi nhuận:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>Hoàn toàn miễn phí:</strong> Mọi tính năng bàn học 2.5D, tạo đề thi, chia sẻ ghi chú và học nhóm Realtime đều được cung cấp miễn phí 100%, không có token hay tiền tệ nội bộ.</li>
              <li><strong>Khóa AI của bạn (BYOK):</strong> Tính năng trợ lý AI hoạt động thông qua cơ chế người dùng tự cung cấp Khóa API OpenAI (Bring Your Own Key). Mọi chi phí sử dụng API (nếu có) được tính trực tiếp bởi OpenAI theo giá niêm yết của họ, GreenLearn không thu bất kỳ khoản phí trung gian nào.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Nội dung do AI tạo ra</h2>
            <p>
              Các phần giải thích bài tập, tóm tắt kiến thức hay câu hỏi trắc nghiệm do AI tạo ra chỉ mang tính tham khảo khi tự học. Bạn nên đối chiếu lại với sách giáo trình chính khóa của thầy cô trước khi làm bài thi thật.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
