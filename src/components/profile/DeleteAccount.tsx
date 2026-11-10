'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  X, 
  Download, 
  ShieldAlert, 
  BookOpen, 
  Clock 
} from 'lucide-react';

interface DeleteAccountProps {
  userEmail: string;
}

export function DeleteAccount({ userEmail }: DeleteAccountProps) {
  const router = useRouter();
  const { signOut, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const dataToExport: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        user: {
          email: userEmail,
          displayName: profile?.display_name || '',
        },
        localNotes: [],
        spaces: [],
      };

      if (typeof window !== 'undefined') {
        // Collect localStorage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('greenlearn') || key.startsWith('vitudy'))) {
            try {
              dataToExport[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch {
              dataToExport[key] = localStorage.getItem(key);
            }
          }
        }
      }

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greenlearn_data_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportNotice(true);
      setTimeout(() => setExportNotice(false), 4000);
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      setErrorMsg('Email xác nhận không trùng khớp.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabase || !supabaseUrl) {
      // Chế độ demo offline: dọn dẹp LocalStorage và đăng xuất
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      await signOut();
      router.replace('/');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwtToken = session?.access_token;

      if (!jwtToken) {
        throw new Error('Phiên đăng nhập đã hết hạn.');
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Lỗi yêu cầu xóa tài khoản.');
      }

      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      await signOut();
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xóa tài khoản. Vui lòng liên hệ hỗ trợ qua GitHub.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1 text-rose-600">
        <ShieldAlert className="w-5 h-5" />
        <h3 className="text-sm font-bold">Khu vực nguy hiểm</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Xóa tài khoản sẽ hủy bỏ vĩnh viễn toàn bộ bàn học, tài liệu, tiến trình thú cưng và lịch sử học tập của bạn.
      </p>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Yêu cầu xóa tài khoản này</span>
      </button>

      {/* Delete Confirmation Modal */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9995] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-900">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3.5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-1.5">
              Xác nhận xóa tài khoản vĩnh viễn?
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Trước khi tiếp tục, vui lòng lưu ý các điều kiện sau:
            </p>

            {/* Chi tiết hậu quả & Hạn ân hạn 3 ngày */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 space-y-2 mb-4 text-xs text-rose-900">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dữ liệu bàn học:</strong> Toàn bộ không gian học, tài liệu cá nhân và ghi chú của bạn sẽ bị gỡ bỏ hoàn toàn.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Thời gian ân hạn:</strong> Hệ thống lưu trữ dự phòng <strong>3 ngày</strong> trước khi xóa vĩnh viễn, cho phép bạn liên hệ email để khôi phục nếu đổi ý.
                </span>
              </div>
            </div>

            {/* Tùy chọn Tải dữ liệu trước khi xóa */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Đang xuất dữ liệu...' : 'Tải dữ liệu của tôi về máy (JSON)'}</span>
              </button>
              {exportNotice && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1.5 text-center">
                  Đã tải tệp tin sao lưu dữ liệu bàn học thành công!
                </p>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-2 font-medium">
              Gõ chính xác email <strong className="text-slate-900 font-mono select-all">{userEmail}</strong> để xác nhận:
            </p>

            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 mb-3 font-mono"
            />

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium mb-3">{errorMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
