'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { SyncService } from '@/services/SyncService';
import { useStudySpace } from '@/context/StudySpaceContext';
import { CloudUpload, Loader2, X } from 'lucide-react';

export function MigrationDialog() {
  const { user, status } = useAuth();
  const { switchSpace } = useStudySpace();
  const [isOpen, setIsOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      const hasLocal = SyncService.hasPendingLocalData(user.id);
      if (hasLocal) {
        setIsOpen(true);
      }
    }
  }, [status, user?.id]);

  if (!isOpen || !user?.id) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    const res = await SyncService.migrateToCloud(user.id);
    setIsMigrating(false);

    if (res.errors.length > 0) {
      setResultMsg(`Đồng bộ được ${res.migrated} tài liệu (có một số cảnh báo).`);
    } else {
      setResultMsg(`Đã đồng bộ thành công ${res.migrated} tài liệu lên đám mây!`);
    }

    setTimeout(() => {
      setIsOpen(false);
      window.location.reload();
    }, 1500);
  };

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`vitudy_migrated_${user.id}`, 'dismissed');
    }
    setIsOpen(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E0562D] flex items-center justify-center mb-4">
          <CloudUpload className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1.5">
          Đồng bộ bàn học lên đám mây?
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Chúng tôi tìm thấy tài liệu và ghi chú bạn đã tạo trước khi đăng nhập. Bạn có muốn chuyển toàn bộ lên đám mây để học tập trên mọi thiết bị không?
        </p>

        {resultMsg ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 mb-3 text-center">
            {resultMsg}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isMigrating}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex-1 py-2 text-xs font-bold text-white bg-[#E0562D] hover:bg-[#c9451e] rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <span>Đồng bộ ngay</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
