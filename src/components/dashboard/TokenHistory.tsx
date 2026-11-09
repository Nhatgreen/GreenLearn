'use client';

import React from 'react';
import { History, Sparkles, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ViTokenTransaction } from '@/types/vitoken';

interface TokenHistoryProps {
  transactions: ViTokenTransaction[];
  balance: number;
}

export function TokenHistory({ transactions, balance }: TokenHistoryProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biến động số dư ViToken</h3>
            <p className="text-xs text-slate-500">Lịch sử thu chi, điểm danh và nạp tiền (Quy đổi: 1.000đ = 1 ViToken)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-xs text-slate-600 font-medium">Hiện có:</span>
          <span className="font-mono font-black text-sm text-[#E0562D]">
            {balance.toLocaleString('vi-VN')} ViToken
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Chưa có giao dịch ViToken nào được ghi nhận.
          </div>
        ) : (
          transactions.map((tx) => {
            const isPositive = tx.amount >= 0;

            return (
              <div
                key={tx.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs transition-colors hover:bg-slate-100/70"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{tx.description}</div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                      {new Date(tx.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-black text-xs ${
                    isPositive ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {isPositive ? `+${tx.amount.toLocaleString('vi-VN')}` : tx.amount.toLocaleString('vi-VN')} ViToken
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
