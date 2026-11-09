'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Lock, ShieldCheck, Key, Database } from 'lucide-react';
import { SiteFooter } from '@/components/common/SiteFooter';

export default function PrivacyPage() {
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
            <span className="font-bold text-sm text-slate-900">Bảo mật thông tin</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cam kết bảo vệ dữ liệu học tập của bạn</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight mb-2">
          Chính sách quyền riêng tư
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-8">
          Cách GreenLearn lưu trữ và bảo vệ bài học, ghi chú và tài khoản của bạn.
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#16A34A]" />
              <span>1. Những thông tin được lưu lại</span>
            </h2>
            <p>
              GreenLearn chỉ lưu các thông tin kỹ thuật cần thiết để bàn học của bạn hoạt động liền mạch:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>Địa chỉ email khi bạn tạo tài khoản để đồng bộ dữ liệu giữa các máy tính.</li>
              <li>Vị trí sách, mẩu giấy ghi chú và nét vẽ trên bàn học của bạn.</li>
              <li>Lịch sử các câu hỏi trắc nghiệm bạn đã làm để tính chu kỳ nhắc ôn lại (thuật toán SM-2).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>2. Khóa API OpenAI cá nhân (BYOK)</span>
            </h2>
            <p>
              Khi bạn kết nối Khóa API OpenAI (ChatGPT) của riêng mình:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">• Khóa API chỉ lưu trực tiếp trên trình duyệt của máy bạn (localStorage).</p>
              <p>• Tuyệt đối không bao giờ được gửi lên cơ sở dữ liệu Supabase hay bất kỳ máy chủ trung gian nào.</p>
              <p>• Khi gửi câu hỏi hoặc phân tích tài liệu, trình duyệt của bạn kết nối thẳng tới <code>api.openai.com</code> qua kênh HTTPS mã hóa.</p>
              <p className="text-amber-800 font-medium pt-1">• Khuyến cáo bảo mật: Không nhập khóa trên máy tính công cộng. Bạn có thể xóa khóa khỏi trình duyệt bất cứ lúc nào trong bảng Cài đặt AI.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              <span>3. Bảo vệ dữ liệu trên Supabase</span>
            </h2>
            <p>
              Dữ liệu bàn học và bài thi thử của bạn được bảo vệ bởi cơ chế phân quyền cấp hàng (Row Level Security - RLS) trên Supabase. Người khác không thể xem hoặc sửa bàn học riêng của bạn trừ khi bạn chủ động chia sẻ đường dẫn phòng học trực tiếp.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Quyền xuất và xóa dữ liệu</h2>
            <p>
              Bạn có toàn quyền tải bản sao lưu dữ liệu bàn học (dưới dạng JSON) về máy hoặc xóa vĩnh viễn tài khoản của mình bất kỳ lúc nào tại trang Hồ sơ cá nhân.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
