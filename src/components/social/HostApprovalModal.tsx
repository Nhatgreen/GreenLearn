'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, UserCheck, X, Clock, Check } from 'lucide-react';
import { RoomJoinRequest } from '@/context/SocialPresenceContext';

interface HostApprovalModalProps {
  request: RoomJoinRequest | null;
  onApprove: (request: RoomJoinRequest, permission: 'view_only' | 'edit') => void;
  onReject: (request: RoomJoinRequest, reason?: string) => void;
}

export function HostApprovalModal({ request, onApprove, onReject }: HostApprovalModalProps) {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<'edit' | 'view_only'>('edit');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tự động đóng sau 60 giây nếu host không tương tác
  useEffect(() => {
    if (!request) {
      setTimeLeft(60);
      return;
    }

    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(request, 'Hết thời gian chờ phản hồi từ chủ phòng.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [request, onReject]);

  if (!mounted || !request) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white border-2 border-green-300 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 font-sans select-none animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng / Từ chối nhanh */}
        <button
          type="button"
          onClick={() => onReject(request)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Từ chối yêu cầu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Thanh đếm ngược thời gian phản hồi */}
        <div className="w-full bg-slate-100 h-1 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-[#16A34A] transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider">
                Yêu cầu tham gia bàn học
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Chủ phòng phê duyệt
            </h3>
          </div>
        </div>

        {/* Thông tin bạn học xin vào */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-4 flex items-center gap-3.5">
          <div 
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
            style={{ backgroundColor: request.fromAvatarColor || '#16A34A' }}
          >
            {request.fromName ? request.fromName.charAt(0).toUpperCase() : 'B'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {request.fromName}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Muốn vào học cùng bạn tại bàn học này.
            </p>
          </div>
        </div>

        {/* Lựa chọn phân quyền */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Phân quyền cho bạn học:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPermission('edit')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                permission === 'edit'
                  ? 'bg-[#F0FDF4] border-[#16A34A] text-[#166534] shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Cùng chỉnh sửa</span>
                {permission === 'edit' && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
              </div>
              <span className="text-[10px] text-slate-500">
                Được viết, vẽ, note và lật sách
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPermission('view_only')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                permission === 'view_only'
                  ? 'bg-[#F0FDF4] border-[#16A34A] text-[#166534] shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Chỉ xem</span>
                {permission === 'view_only' && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
              </div>
              <span className="text-[10px] text-slate-500">
                Chỉ theo dõi màn hình học tập
              </span>
            </button>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onReject(request)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Từ chối
          </button>
          <button
            type="button"
            onClick={() => onApprove(request, permission)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-green-600/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 stroke-[2.4]" />
            <span>Đồng ý cho vào</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
