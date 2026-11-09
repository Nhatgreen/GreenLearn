'use client';

import React, { useState } from 'react';
import { 
  PaymentRequestResult, 
  PaymentService, 
  DEFAULT_BANK_CONFIG 
} from '@/services/PaymentService';
import { 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  Hash, 
  PlayCircle,
  QrCode,
  Zap
} from 'lucide-react';

interface QRCodeDisplayProps {
  request: PaymentRequestResult;
  secondsLeft: number;
  onSimulateSuccess?: () => void;
  onRetry?: () => void;
}

export function QRCodeDisplay({
  request,
  secondsLeft,
  onSimulateSuccess,
  onRetry,
}: QRCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  const isDevMode = typeof window !== 'undefined' && (
    window.location.search.includes('dev=true') || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(request.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_BANK_CONFIG.accountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {}
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(request.amountVnd.toString());
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } catch {}
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulateError(null);
    try {
      await PaymentService.simulatePayment(request.id);
      if (onSimulateSuccess) {
        onSimulateSuccess();
      }
    } catch (err: any) {
      setSimulateError(err.message || 'Lỗi khi mô phỏng thanh toán.');
    } finally {
      setIsSimulating(false);
    }
  };

  const isExpiringSoon = secondsLeft < 180 && secondsLeft > 0;
  const isExpired = secondsLeft <= 0;

  return (
    <div className="space-y-4">
      {/* Timer & Security Banner */}
      <div
        className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
          isExpired
            ? 'bg-red-50 border-red-200 text-red-700'
            : isExpiringSoon
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'}`} />
          <span className="font-medium">
            {isExpired ? 'Mã thanh toán đã hết hạn' : 'Thời gian hiệu lực của mã QR:'}
          </span>
        </div>
        <span className="font-mono font-black text-sm tracking-wide">
          {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* QR Code Column */}
        <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl shadow-xs">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.qrUrl}
              alt="VietQR MBBank"
              className="w-full h-full object-contain"
            />
            {isExpired && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-1.5" />
                <span className="text-xs font-bold text-red-600">Mã QR đã hết hạn</span>
                <span className="text-[11px] text-slate-500 mt-1 mb-2.5">Thời gian thanh toán 15 phút đã kết thúc</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="px-3.5 py-1.5 bg-[#E0562D] hover:bg-[#c9451e] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Tạo mã mới
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Quét bằng App Ngân hàng hoặc Ví điện tử</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động cộng ViToken sau khi nhận tiền, thường trong vài phút</span>
          </div>
        </div>

        {/* Transfer Details Column */}
        <div className="space-y-2.5 text-xs">
          {/* Transfer Code Highlight */}
          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-2xl">
            <div className="text-[11px] font-bold text-[#E0562D] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Nội dung chuyển khoản (BẮT BUỘC)</span>
              <span className="text-[10px] text-orange-700 font-semibold">Nhập đúng nội dung này để hệ thống nhận diện</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xl font-black font-mono tracking-widest text-slate-900 select-all">
                {request.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E0562D] hover:bg-[#c9451e] text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bank Info Rows */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Ngân hàng:</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">MBBank (Quân Đội)</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>Số tài khoản:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 font-mono text-sm">{DEFAULT_BANK_CONFIG.accountNo}</span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Sao chép số tài khoản"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Người thụ hưởng:</span>
              </div>
              <span className="font-bold text-slate-900 uppercase text-[11px] font-mono">
                {DEFAULT_BANK_CONFIG.accountName}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-600 text-[11px]">Số tiền thanh toán:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-mono text-[#E0562D]">
                  {request.amountVnd.toLocaleString('vi-VN')} VNĐ
                </span>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Sao chép số tiền"
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-orange-50/50 p-1.5 rounded-lg border border-orange-100">
              <span className="text-slate-600 text-[11px]">Bạn nhận:</span>
              <span className="text-xs font-black font-mono text-[#E0562D]">
                +{request.tokenAmount.toLocaleString('vi-VN')} ViToken
              </span>
            </div>
          </div>

          {/* Trạng thái chờ xử lý thời gian thực */}
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#E0562D] animate-ping" />
            <span>Đang chờ chuyển khoản từ ứng dụng ngân hàng...</span>
          </div>

          {/* Academic Simulation Button - Chỉ hiện trong môi trường test/dev */}
          {isDevMode && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating || isExpired}
                className="w-full py-2 px-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-[#E0562D]" />
                <span>{isSimulating ? 'Đang kích hoạt...' : 'Giả lập đã nhận tiền (Dành cho Báo cáo Giảng viên)'}</span>
              </button>
              {simulateError && (
                <div className="mt-1 text-[11px] text-red-600 text-center font-medium">
                  {simulateError}
                </div>
              )}
            </div>
          )}

          {/* Dòng hỗ trợ khi gặp sự cố */}
          <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
            Nếu chuyển khoản quá 15 phút chưa nhận được ViToken, vui lòng liên hệ hỗ trợ: support@vitudy.com hoặc nhóm Telegram ViTudy.
          </p>
        </div>
      </div>
    </div>
  );
}
