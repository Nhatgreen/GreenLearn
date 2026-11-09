'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { LogIn, X, Cloud } from 'lucide-react';

interface GuestBannerProps {
  user: User | null;
}

export function GuestBanner({ user }: GuestBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (user || isDismissed) {
    return null;
  }

  return (
    <aside 
      aria-label="Thông báo chế độ khách"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 text-white backdrop-blur-md border-t border-slate-700/80 px-4 py-2.5 shadow-2xl transition-all"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold flex-shrink-0">
            <Cloud className="w-3.5 h-3.5" />
          </div>
          <p className="truncate font-medium text-slate-200">
            <span className="font-bold text-white">Chế độ trải nghiệm khách:</span> Đăng nhập để lưu bàn học lên đám mây và đồng bộ đa thiết bị miễn phí.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/auth"
            className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-md"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
