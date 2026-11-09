'use client';

import React from 'react';
import { PaymentPackage } from '@/services/PaymentService';
import { Check } from 'lucide-react';

interface PricingTiersProps {
  packages: PaymentPackage[];
  selectedPackageId: string;
  onSelectPackage: (pkg: PaymentPackage) => void;
  isLoading?: boolean;
}

const BONUS_MAP: Record<string, string> = {
  semester: 'Tặng +3 ViToken',
  project: 'Tặng +15 ViToken',
  team: 'Tặng +45 ViToken',
};

export function PricingTiers({
  packages,
  selectedPackageId,
  onSelectPackage,
  isLoading,
}: PricingTiersProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        Đang nạp danh sách gói...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const isPopular = pkg.id === 'semester';
          const bonus = BONUS_MAP[pkg.id];

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectPackage(pkg)}
              className={`relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between text-left ${
                isSelected
                  ? 'border-[#E0562D] bg-orange-50/50 ring-2 ring-[#E0562D]/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Huy hiệu nổi bật */}
              {isPopular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E0562D] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                  Được chọn nhiều
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-1 mb-1 min-h-[20px]">
                  <span className="text-xs font-bold text-slate-900 whitespace-nowrap">{pkg.label}</span>
                  {bonus ? (
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {bonus}
                    </span>
                  ) : <span className="h-4" />}
                </div>

                <div className="mt-1">
                  <div className="text-lg font-black font-mono text-slate-900 leading-none">
                    {pkg.priceVnd.toLocaleString('vi-VN')}{' '}
                    <span className="text-[10px] font-sans font-normal text-slate-500">đ</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#E0562D] mt-1.5 font-mono whitespace-nowrap">
                    Nhận {pkg.tokenAmount.toLocaleString('vi-VN')} ViToken
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end text-[11px]">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#E0562D] text-white ring-1 ring-[#E0562D]'
                      : 'border border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
