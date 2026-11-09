'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, History, Sparkles } from 'lucide-react';

interface PaymentSuccessProps {
  tokenAmount: number;
  amountVnd: number;
  code: string;
  onClose: () => void;
  onViewHistory: () => void;
}

export function PaymentSuccess({
  tokenAmount,
  amountVnd,
  code,
  onClose,
  onViewHistory,
}: PaymentSuccessProps) {
  return (
    <div className="text-center py-4 space-y-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[2.2]" />
      </div>

      <div>
        <h3 className="text-lg font-black text-slate-900">
          Nạp ViToken Thành Công!
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống đã tự động ghi nhận thanh toán và cộng điểm vào ví của bạn.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Số ViToken nhận được:</span>
          <div className="flex items-center gap-1.5 font-black text-[#16A34A] font-mono text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{tokenAmount.toLocaleString()} V</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Số tiền đã trả:</span>
          <span className="font-bold text-slate-800 font-mono">
            {amountVnd.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-500">Mã giao dịch:</span>
          <span className="font-mono font-bold text-slate-700">{code}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={onViewHistory}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>Xem lịch sử</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Tiếp tục học tập</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
