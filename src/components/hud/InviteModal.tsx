'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Share2, Users, ShieldCheck } from 'lucide-react';
import { getShareRoomUrl } from '@/lib/assets';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
}

export function InviteModal({ isOpen, onClose, spaceId, spaceName }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const inviteUrl = getShareRoomUrl(spaceId, 'view_only');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Cùng học tập tại ${spaceName} trên GreenLearn`,
          text: `Tham gia bàn học 2.5D cùng mình tại không gian: ${spaceName}`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9995] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Mời Bạn Học Vào Bàn
            </h3>
            <p className="text-xs text-slate-500">
              Chia sẻ liên kết để bạn bè cùng tham gia học nhóm và đồng bộ góc nhìn.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Liên kết phòng học
          </span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã chép</span>
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

        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Người nhận liên kết sẽ được cấp quyền Người xem (Viewer) và có thể theo dõi chuột trực tiếp.</span>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Chia sẻ liên kết</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
