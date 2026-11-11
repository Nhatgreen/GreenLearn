'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeskInviteNotification } from '@/services/SocialFriendService';
import { Users, ArrowRight, X, Sparkles } from 'lucide-react';

export interface FriendInviteToastProps {
  invite: DeskInviteNotification | null;
  onAccept: (invite: DeskInviteNotification) => void;
  onDecline: () => void;
}

export function FriendInviteToast({
  invite,
  onAccept,
  onDecline
}: FriendInviteToastProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer: tự động ẩn sau 60 giây nếu người dùng không phản hồi
  useEffect(() => {
    if (!invite) {
      setTimeLeft(60);
      return;
    }

    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [invite, onDecline]);

  if (!mounted || !invite) return null;

  return createPortal(
    <div 
      className="fixed top-4 right-4 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-32px)] animate-slide-in pointer-events-auto select-none"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-green-400 shadow-2xl p-4 text-slate-800 relative overflow-hidden">
        {/* Thanh đếm ngược thời gian */}
        <div 
          className="absolute top-0 left-0 h-1 bg-[#16A34A] transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />

        {/* Tiêu đề & Nút đóng */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            <Sparkles className="w-4 h-4 text-[#16A34A]" />
            <span>LỜI MỜI HỌC CHUNG</span>
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng lời mời"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông tin bạn học mời */}
        <div className="flex items-start gap-3 mb-3.5">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
            style={{ backgroundColor: invite.fromAvatarColor || '#16A34A' }}
          >
            {invite.fromName ? invite.fromName.charAt(0).toUpperCase() : 'B'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {invite.fromName}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
              Đang mời bạn vào cùng học: <b className="text-slate-800">{invite.spaceName}</b>
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Bàn học: {invite.spaceName || 'Học nhóm trực tuyến'}</span>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onAccept(invite)}
            className="flex-1 py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md shadow-green-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span>Vào học ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Để sau ({timeLeft}s)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
