'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PaymentHistoryItem, PaymentService } from '@/services/PaymentService';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface PaymentHistoryProps {
  onRetryPayment?: (packageId?: string) => void;
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'expired';

export function PaymentHistory({ onRetryPayment }: PaymentHistoryProps) {
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [displayCount, setDisplayCount] = useState(6);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const items = await PaymentService.listMyPayments(50);
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'completed') return item.status === 'completed' || item.status === 'completed_late';
      if (filter === 'pending') return item.status === 'pending';
      if (filter === 'expired') return item.status === 'expired' || item.status === 'failed';
      return true;
    });
  }, [history, filter]);

  const displayedItems = filteredHistory.slice(0, displayCount);

  const getStatusBadge = (status: PaymentHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Thành công</span>
          </span>
        );
      case 'completed_late':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Khớp muộn</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Chờ thanh toán</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            <AlertCircle className="w-3 h-3" />
            <span>Đã hết hạn</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Thất bại</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header controls: Status Filters + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => { setFilter('all'); setDisplayCount(6); }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({history.length})
          </button>
          <button
            type="button"
            onClick={() => { setFilter('completed'); setDisplayCount(6); }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Thành công ({history.filter(h => h.status === 'completed' || h.status === 'completed_late').length})
          </button>
          <button
            type="button"
            onClick={() => { setFilter('pending'); setDisplayCount(6); }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Chờ thanh toán ({history.filter(h => h.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => { setFilter('expired'); setDisplayCount(6); }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              filter === 'expired'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Đã hết hạn ({history.filter(h => h.status === 'expired' || h.status === 'failed').length})
          </button>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={isLoading}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ml-auto"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Đang tải lịch sử giao dịch...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Không có giao dịch nào thuộc trạng thái này.
          </div>
        ) : (
          displayedItems.map((tx) => {
            const isPending = tx.status === 'pending';
            const isExpired = tx.status === 'expired' || tx.status === 'failed';

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all hover:bg-slate-100/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 tracking-wider">
                      {tx.code}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <div className="font-mono font-bold text-slate-800">
                      {tx.amountVnd.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] font-black font-mono text-[#16A34A]">
                      +{tx.tokenAmount.toLocaleString('vi-VN')} ViToken
                    </div>
                  </div>

                  {/* Hành động nhanh theo trạng thái */}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => onRetryPayment?.()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <span>Tiếp tục thanh toán</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {isExpired && (
                    <button
                      type="button"
                      onClick={() => onRetryPayment?.()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tạo mã mới</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Nút Xem thêm thay cho thanh cuộn lồng trong cuộn */}
      {filteredHistory.length > displayCount && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 6)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Xem thêm giao dịch ({filteredHistory.length - displayCount} giao dịch khác)
          </button>
        </div>
      )}
    </div>
  );
}
