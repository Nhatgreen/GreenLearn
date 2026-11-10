'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ShieldCheck, Code2, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onSelectPackage?: () => void;
}

export function PricingSection({ onSelectPackage }: PricingSectionProps) {
  return (
    <section className="py-16 md:py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 text-left font-sans">
      {/* Tiêu đề mục cam kết miễn phí */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/80 border border-green-200 text-[#166534] text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Nền tảng học tập 100% miễn phí & phi lợi nhuận</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-tight mb-2.5">
          Tự do tri thức, không rào cản chi phí
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          GreenLearn loại bỏ hoàn toàn hệ thống nạp tiền và tiền ảo. Mọi học viên đều có quyền tiếp cận không gian học tập chất lượng cao nhất mà không phải trả bất kỳ khoản phí nào.
        </p>
      </div>

      {/* Grid 3 trụ cột giá trị cốt lõi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột 1: Không Gian Học Tập Trọn Đời */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-green-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mb-4">
              <Sparkles className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Bàn học 2.5D Không Giới Hạn
            </h3>
            <div className="text-2xl font-black text-[#16A34A] font-mono mb-2">
              0 đ <span className="text-xs font-sans text-slate-500 font-normal">/ trọn đời</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Trải nghiệm mặt bàn học vô cực, mở tài liệu PDF đa luồng, làm bài thi thử và nuôi dưỡng thú cưng học tập.
            </p>

            <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6">
              {[
                'Mặt bàn học 2.5D xoay lật & zoom vô cực',
                'Trích xuất PDF, highlight, ghi chú tương tác',
                'Thẻ ghi nhớ SM-2 lặp lại ngắt quãng',
                'Thú cưng Mầm Xanh tiến hóa 5 cấp độ',
                'Đồng bộ học nhóm & Discord Activity',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onSelectPackage}
            className="w-full py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Bắt đầu học ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cột 2: Chủ Quyền AI (BYOK) */}
        <div className="bg-gradient-to-b from-[#F0FDF4]/50 to-white border-2 border-[#16A34A] rounded-3xl p-6 shadow-md flex flex-col justify-between relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16A34A] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
            Chủ quyền dữ liệu
          </div>

          <div>
            <div className="w-10 h-10 rounded-2xl bg-green-100 border border-green-300 flex items-center justify-center text-[#16A34A] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Trợ lý AI Trực Tiếp (BYOK)
            </h3>
            <div className="text-2xl font-black text-slate-900 font-mono mb-2">
              0 đ <span className="text-xs font-sans text-slate-500 font-normal">phí nền tảng</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Kết nối trực tiếp API Key OpenAI cá nhân. Bạn chỉ trả chi phí gốc cho nhà cung cấp mô hình, không chênh lệch.
            </p>

            <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6">
              {[
                'Kết nối thẳng api.openai.com từ trình duyệt',
                'Hỗ trợ GPT-4o Mini, GPT-4o, o3-mini',
                'Khóa API lưu an toàn trong localStorage của bạn',
                'Tóm tắt tài liệu, giải toán & sinh đề thi tức thì',
                'GreenLearn không bao giờ lưu khóa trên máy chủ',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/faq#openai-byok"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-95 text-center block cursor-pointer"
          >
            Tìm hiểu cách lấy khóa OpenAI
          </Link>
        </div>

        {/* Cột 3: Mã Nguồn Mở & Tự Lưu Trữ */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-green-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mb-4">
              <Code2 className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Mã Nguồn Mở & Minh Bạch
            </h3>
            <div className="text-2xl font-black text-slate-900 font-mono mb-2">
              MIT <span className="text-xs font-sans text-slate-500 font-normal">License</span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Mã nguồn mở công khai, dễ dàng fork và tự triển khai (self-host) trên GitHub Pages hoàn toàn miễn phí.
            </p>

            <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-6">
              {[
                'Build tĩnh 100% tương thích GitHub Pages',
                'Trình quản lý bộ nhớ & sao lưu tệp JSON ngoại tuyến',
                'Không khóa dữ liệu người dùng (No vendor lock-in)',
                'Kế thừa nguyên bản nền tảng ViTudy',
                'Cộng đồng cùng đóng góp tính năng mới',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/about"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs active:scale-95 text-center block cursor-pointer"
          >
            Đọc thông tin kỹ thuật & tác giả
          </Link>
        </div>
      </div>
    </section>
  );
}
