'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface StreakCalendarProps {
  activityGrid: { 
    date: string; 
    minutes: number; 
    isToday?: boolean; 
    isMonthStart?: boolean; 
    monthLabel?: string;
  }[];
}

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function StreakCalendar({ activityGrid }: StreakCalendarProps) {
  const getColorClass = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-100/90 border-slate-200/80 text-slate-600';
    if (minutes < 15) return 'bg-orange-100 border-orange-200 text-orange-900';
    if (minutes < 45) return 'bg-orange-300 border-orange-400 text-orange-950 font-bold';
    return 'bg-[#E0562D] border-[#c9451e] text-white font-bold';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E0562D]">
            <Calendar className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lịch học (28 ngày gần nhất)</h3>
            <p className="text-xs text-slate-500">Mức độ tương tác học tập thực tế chia theo từng tuần</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Ít</span>
          <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" title="0 phút" />
          <div className="w-3.5 h-3.5 rounded bg-orange-100 border border-orange-200" title="< 15 phút" />
          <div className="w-3.5 h-3.5 rounded bg-orange-300 border border-orange-400" title="15 - 45 phút" />
          <div className="w-3.5 h-3.5 rounded bg-[#E0562D] border-[#c9451e]" title="≥ 45 phút" />
          <span>Nhiều</span>
        </div>
      </div>

      {/* Week day headers (T2 -> CN) */}
      <div className="pt-2">
        <div className="grid grid-cols-7 gap-2 mb-1.5 text-center">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-xs font-bold text-slate-400 font-mono py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* 28 Day cells */}
        <div className="grid grid-cols-7 gap-2">
          {activityGrid.map((item, idx) => {
            const isToday = item.isToday || item.date === todayStr;
            const dayNum = item.date.slice(8);
            const isFirstDay = dayNum === '01';

            return (
              <div
                key={idx}
                className={`h-12 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${getColorClass(
                  item.minutes
                )} ${
                  isToday
                    ? 'ring-2 ring-[#E0562D] ring-offset-2 z-10 shadow-xs'
                    : 'hover:border-slate-400'
                }`}
              >
                {/* Ngày và nhãn tháng nếu là đầu tháng */}
                <div className="flex items-center gap-0.5 leading-none">
                  <span className="text-[11px] font-bold font-mono">
                    {dayNum}
                  </span>
                  {isFirstDay && (
                    <span className="text-[9px] font-bold uppercase opacity-80 font-sans">
                      Th{parseInt(item.date.slice(5, 7), 10)}
                    </span>
                  )}
                </div>

                {/* Số phút học thực tế */}
                <span className="text-[10px] font-mono leading-none mt-1 opacity-90">
                  {item.minutes > 0 ? `${item.minutes}p` : '—'}
                </span>

                {/* Tooltip khi di chuột */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md z-30">
                  {item.date}: {item.minutes} phút học {isToday ? '(Hôm nay)' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
