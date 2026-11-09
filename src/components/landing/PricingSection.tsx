'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface PricingPackage {
  id: string;
  name: string;
  price: number;
  tokens: number;
  bonusTokens?: number;
  badge?: string;
  isPopular?: boolean;
  description: string;
  questions: string;
  documents: string;
  expiry: string;
}

const PACKAGES: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Khởi đầu',
    price: 2000,
    tokens: 2000,
    description: 'Trải nghiệm thử bàn học và hỏi đáp ngắn',
    questions: '~40 lượt hỏi đáp AI',
    documents: 'Mở 1 tài liệu cơ bản',
    expiry: 'Không giới hạn ngày dùng',
  },
  {
    id: 'midterm',
    name: 'Ôn giữa kỳ',
    price: 10000,
    tokens: 10000,
    description: 'Đủ dùng ôn tập cấp tốc trước kỳ thi',
    questions: '~200 lượt hỏi đáp AI',
    documents: 'Mở 3 tài liệu ôn thi',
    expiry: 'Không giới hạn ngày dùng',
  },
  {
    id: 'semester',
    name: 'Học kỳ',
    price: 27000,
    tokens: 30000,
    bonusTokens: 3000,
    badge: 'Tặng 3.000 ViToken',
    isPopular: true,
    description: 'Lựa chọn tiết kiệm cho cả học kỳ',
    questions: '~600 lượt hỏi đáp AI',
    documents: 'Mở 10 tài liệu chất lượng cao',
    expiry: 'Không giới hạn ngày dùng',
  },
  {
    id: 'project',
    name: 'Đồ án',
    price: 85000,
    tokens: 100000,
    bonusTokens: 15000,
    badge: 'Tặng 15.000 ViToken',
    description: 'Dành cho ôn chứng chỉ và làm khóa luận',
    questions: '~2.000 lượt hỏi đáp AI',
    documents: 'Mở tài liệu chuyên sâu',
    expiry: 'Không giới hạn ngày dùng',
  },
  {
    id: 'team',
    name: 'Nhóm học',
    price: 255000,
    tokens: 300000,
    bonusTokens: 45000,
    badge: 'Tặng 45.000 ViToken',
    description: 'Dành cho cả nhóm bạn cùng học tập',
    questions: '~6.000 lượt hỏi đáp AI',
    documents: 'Tải trọn bộ tài liệu trên Chợ',
    expiry: 'Không giới hạn ngày dùng',
  },
];

interface PricingSectionProps {
  onSelectPackage?: (pkgId: string) => void;
}

export function PricingSection({ onSelectPackage }: PricingSectionProps) {
  return (
    <section className="py-16 md:py-20 px-6 max-w-6xl mx-auto border-t border-slate-200 text-left">
      {/* Tiêu đề mục bảng giá */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-tight mb-2.5">
          Các mức nạp ViToken
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
          Nạp một lần dùng khi cần. ViToken dùng để giải thích bài tập và mở tài liệu ôn tập trên Chợ.
        </p>
      </div>

      {/* Grid 5 thẻ bảng giá chuẩn responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {PACKAGES.map((pkg) => {
          const formattedPrice = pkg.price.toLocaleString('vi-VN');
          const formattedTokens = pkg.tokens.toLocaleString('vi-VN');

          return (
            <div
              key={pkg.id}
              className={`relative rounded-2xl p-5 border text-left flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? 'bg-green-50/40 border-[#16A34A] ring-2 ring-[#16A34A]/30 shadow-md'
                  : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Huy hiệu Được chọn nhiều cho gói phổ biến */}
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#16A34A] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  Được chọn nhiều
                </div>
              )}

              <div>
                {/* Header cố định chiều cao để không bị lệch hàng */}
                <div className="flex items-center justify-between gap-1 min-h-[28px] mb-2">
                  <h3 className="text-sm font-bold text-slate-900">{pkg.name}</h3>
                  {pkg.badge && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                {/* Số tiền lớn và số ViToken nhận được */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-slate-900 font-mono">
                    {formattedPrice}{' '}
                    <span className="text-xs font-sans text-slate-500 font-normal">đ</span>
                  </div>
                  <div className="text-xs font-bold text-[#16A34A] mt-0.5 font-mono">
                    Nhận {formattedTokens} ViToken
                  </div>
                </div>

                <p className="text-xs text-slate-500 min-h-[34px] mb-3 leading-snug">
                  {pkg.description}
                </p>

                {/* Bộ 3 tiêu chí đồng nhất giữa mọi gói */}
                <div className="space-y-2 border-t border-slate-100 pt-3 mb-5">
                  <div className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{pkg.questions}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{pkg.documents}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{pkg.expiry}</span>
                  </div>
                </div>
              </div>

              {/* Nút nạp tiền rõ ràng, nhấn màu cam cho gói chính */}
              <button
                type="button"
                onClick={() => onSelectPackage?.(pkg.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer text-center ${
                  pkg.isPopular
                    ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-orange-500/20'
                    : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                Nạp {formattedPrice}đ
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
