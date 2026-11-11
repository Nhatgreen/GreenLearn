'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Clock, X, Sparkles } from 'lucide-react';
import { MyPendingJoinRequest } from '@/context/SocialPresenceContext';

interface PendingApprovalModalProps {
  pendingRequest: MyPendingJoinRequest | null;
  onCancel: () => void;
}

export function PendingApprovalModal({ pendingRequest, onCancel }: PendingApprovalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !pendingRequest) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white border border-slate-300 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-slate-900 font-sans select-none text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. TRẠNG THÁI: ĐANG CHỜ DUYỆT (PENDING) */}
        {pendingRequest.status === 'pending' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mb-3 relative">
              <Loader2 className="w-7 h-7 animate-spin stroke-[2.2]" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-white animate-ping" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Đang chờ chủ phòng duyệt...
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Đã gửi yêu cầu vào bàn học tới <b className="text-slate-800">{pendingRequest.hostName}</b>. Vui lòng đợi bạn ấy đồng ý cho vào.
            </p>

            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Hủy yêu cầu
            </button>
          </div>
        )}

        {/* 2. TRẠNG THÁI: ĐÃ ĐỒNG Ý (APPROVED) */}
        {pendingRequest.status === 'approved' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] mb-3 shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.4]" />
            </div>

            <h3 className="text-base font-bold text-[#166534] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#16A34A]" />
              <span>Chủ phòng đã đồng ý!</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <b className="text-slate-900">{pendingRequest.hostName}</b> đã cho phép bạn vào bàn học. Đang kết nối...
            </p>

            <div className="w-full bg-green-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#16A34A] rounded-full animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* 3. TRẠNG THÁI: BỊ TỪ CHỐI (REJECTED) */}
        {pendingRequest.status === 'rejected' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3 shadow-xs">
              <XCircle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Yêu cầu bị từ chối
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {pendingRequest.reason || `${pendingRequest.hostName} hiện đang bận hoặc đã từ chối yêu cầu tham gia.`}
            </p>

            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* 4. TRẠNG THÁI: HẾT THỜI GIAN (TIMEOUT) */}
        {pendingRequest.status === 'timeout' && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
              <Clock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Chưa nhận được phản hồi
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Chủ phòng <b className="text-slate-800">{pendingRequest.hostName}</b> chưa kịp trả lời. Bạn có thể gửi lại yêu cầu hoặc nhắn tin rủ bạn ấy nhé.
            </p>

            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
