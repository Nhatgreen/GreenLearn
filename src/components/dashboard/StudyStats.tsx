'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Award, BookOpen, Flame, ArrowRight, Target } from 'lucide-react';
import { DayStudyTime, ExamStats } from '@/services/StatsService';

interface StudyStatsProps {
  weeklyData: DayStudyTime[];
  examStats: ExamStats;
  streakDays: number;
}

export function StudyStats({ weeklyData, examStats, streakDays }: StudyStatsProps) {
  const totalWeeklyMinutes = weeklyData.reduce((acc, curr) => acc + curr.minutes, 0);
  const hours = Math.floor(totalWeeklyMinutes / 60);
  const remainingMins = totalWeeklyMinutes % 60;

  const dailyGoalMinutes = 30; // Mục tiêu học tập 30 phút mỗi ngày
  const todayMinutes = weeklyData[weeklyData.length - 1]?.minutes || 0;
  const goalProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  return (
    <div className="space-y-4">
      {/* 4 Cards Thống Kê Chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Tổng thời gian học tuần */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Thời gian học tuần</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E0562D]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">
              {hours > 0 ? `${hours} giờ ${remainingMins} phút` : `${remainingMins} phút`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">7 ngày gần nhất trên bàn học</p>
        </div>

        {/* 2. Chuỗi ngày liên tiếp */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Chuỗi học tập</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E0562D]">
              <Flame className="w-4 h-4 text-[#E0562D] fill-[#E0562D]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">
              {streakDays}
            </span>
            <span className="text-xs font-bold text-slate-500">ngày liên tục</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Duy trì điểm danh nhận ViToken</p>
        </div>

        {/* 3. Điểm thi trung bình */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Điểm thi trung bình</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-slate-900">
                {examStats.totalExams > 0 ? examStats.averageScore : '--'}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 10</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            {examStats.totalExams > 0 ? (
              <span className="text-slate-500 font-medium">
                {examStats.totalExams} bài thi đã nộp
              </span>
            ) : (
              <Link
                href="/?view=desk"
                className="text-[#E0562D] font-bold hover:underline flex items-center gap-1"
              >
                <span>Làm bài thi thử ngay</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* 4. Biểu đồ cột nhịp độ tuần kèm đường mục tiêu */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Nhịp độ trong tuần</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">Mục tiêu: 30p/ngày</span>
          </div>

          <div className="relative flex items-end justify-between gap-1.5 h-20 pt-3">
            {/* Đường nét đứt mục tiêu mỗi ngày (30 phút) */}
            <div 
              className="absolute left-0 right-0 border-b border-dashed border-slate-300 z-0 pointer-events-none"
              style={{ bottom: '50%' }}
              title="Mục tiêu 30 phút mỗi ngày"
            />

            {weeklyData.map((item, idx) => {
              const maxMin = Math.max(...weeklyData.map((w) => w.minutes), 60);
              const heightPercent = Math.max(10, Math.min(100, (item.minutes / maxMin) * 100));
              const isToday = idx === weeklyData.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 z-10">
                  <div className="w-full flex flex-col items-center justify-end h-14">
                    <div
                      className={`w-full rounded-md transition-all cursor-pointer relative group ${
                        isToday
                          ? 'bg-[#E0562D] shadow-xs'
                          : item.minutes > 0
                          ? 'bg-orange-200 hover:bg-orange-300'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Tooltip khi di chuột */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9.5px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xs z-20">
                        {item.minutes} phút {isToday ? '(Hôm nay)' : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${isToday ? 'text-[#E0562D]' : 'text-slate-400'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dải Mục Tiêu Hôm Nay & Thẻ Ghi Nhớ SM-2 Cần Ôn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Mục tiêu học hôm nay */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E0562D] shrink-0">
              <Target className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Mục tiêu học hôm nay</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Đã học <strong>{todayMinutes} phút</strong> / {dailyGoalMinutes} phút ({goalProgress}%)
              </div>
            </div>
          </div>
          <div className="w-20 bg-slate-100 h-2.5 rounded-full overflow-hidden shrink-0">
            <div 
              className="bg-[#E0562D] h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* Lịch ôn thẻ Flashcard SM-2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Thẻ ghi nhớ SM-2 cần ôn</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Thuật toán xếp lịch lặp lại ngắt quãng hôm nay
              </div>
            </div>
          </div>
          <Link
            href="/?view=desk"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap shrink-0 active:scale-95"
          >
            Ôn ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
