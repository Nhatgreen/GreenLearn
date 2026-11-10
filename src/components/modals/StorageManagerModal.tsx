'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStorageManager, StorageItemInfo } from '@/hooks/useStorageManager';
import { 
  HardDrive, 
  X, 
  Download, 
  Trash2, 
  BookOpen, 
  FileText, 
  StickyNote, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageManagerModal({ isOpen, onClose }: StorageManagerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    usage,
    itemsInfo,
    staleCount,
    staleTotalBytesFormatted,
    exportItemBackup,
    exportAllSpacesBackup,
    deleteItem,
  } = useStorageManager();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-emerald-700" />;
      case 'sticky':
        return <StickyNote className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-sky-700" />;
    }
  };

  return createPortal(
    <div 
      id="storage-manager-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4 font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-300 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative text-slate-900 animate-fade-in flex flex-col max-h-[88vh]"
      >
        {/* 44px close button touch target */}
        <button
          onClick={onClose}
          aria-label="Đóng quản lý bộ nhớ"
          className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Quản lý bộ nhớ bàn học
            </h3>
            <p className="text-xs text-slate-500">
              Kiểm tra dung lượng lưu trữ, sao lưu dữ liệu và giải phóng bộ nhớ chủ động.
            </p>
          </div>
        </div>

        {/* Storage Meter Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-700">Dung lượng bộ nhớ đã dùng:</span>
            <span className="font-mono text-slate-900">
              {usage.usageFormatted} <span className="text-slate-400 font-normal">/ {usage.quotaFormatted}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, usage.percent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Trạng thái: <strong>Bộ nhớ tối ưu</strong> (Dùng {usage.percent}%)</span>
            </div>
            <span>{itemsInfo.length} tài liệu trên bàn</span>
          </div>
        </div>

        {/* Smart Suggestion Alert (If stale items exist) */}
        {staleCount > 0 ? (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 mb-4 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Gợi ý dọn dẹp ({staleCount} tài liệu ~{staleTotalBytesFormatted})</span>
            </div>
            <p className="text-[11.5px] text-amber-800 leading-relaxed">
              Bạn có {staleCount} tài liệu đã không mở trong hơn 30 ngày qua. Bạn có thể bấm nút <strong>Tải JSON</strong> để lưu bản sao lưu vào máy tính trước khi bấm xóa để dọn dẹp bàn học.
            </p>
          </div>
        ) : (
          <div className="bg-green-50/60 border border-green-200 rounded-2xl p-3 mb-4 text-xs text-[#166534] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <span>Mọi tài liệu của bạn đều đang được mở gần đây hoặc có kích thước rất nhỏ gọn.</span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4 max-h-64">
          {itemsInfo.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Chưa có tài liệu nào trên bàn học hiện tại.
            </div>
          ) : (
            itemsInfo.map((item) => {
              const isConfirming = confirmDeleteId === item.id;

              return (
                <div 
                  key={item.id}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                    item.isStale 
                      ? 'bg-amber-50/30 border-amber-200/80' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                        {item.isStale && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            &gt; 30 ngày
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <span>{item.approxSizeFormatted}</span>
                        <span>•</span>
                        <span>{item.pageCount} trang</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.lastAccessedFormatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => exportItemBackup(item.rawItem)}
                      title="Tải bản sao lưu JSON của tài liệu này về máy tính"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            deleteItem(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[10.5px] cursor-pointer"
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10.5px] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        title="Xóa tài liệu này khỏi bàn học để giải phóng bộ nhớ"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={exportAllSpacesBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Sao lưu toàn bộ bàn học (JSON)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
