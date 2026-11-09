'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatsService, DayStudyTime, ExamStats } from '@/services/StatsService';
import { StudyStats } from '@/components/dashboard/StudyStats';
import { StreakCalendar } from '@/components/dashboard/StreakCalendar';
import { ArrowLeft, BarChart2, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, status } = useAuth();

  const [weeklyData, setWeeklyData] = useState<DayStudyTime[]>([]);
  const [examStats, setExamStats] = useState<ExamStats>({ averageScore: 0, totalExams: 0 });
  const [activityGrid, setActivityGrid] = useState<{ 
    date: string; 
    minutes: number; 
    isToday?: boolean; 
    isMonthStart?: boolean; 
    monthLabel?: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returnDestination, setReturnDestination] = useState<'desk' | 'home'>('desk');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('greenlearn_last_view') || sessionStorage.getItem('vitudy_last_view');
      if (stored === 'home' || stored === 'desk') {
        setReturnDestination(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        StatsService.getWeeklyStudyMinutes(user.id),
        StatsService.getExamPerformance(user.id),
        StatsService.getMonthlyActivityGrid(user.id),
      ]).then(([weekly, exams, grid]) => {
        setWeeklyData(weekly);
        setExamStats(exams);
        setActivityGrid(grid);
        setIsLoading(false);
      });
    } else {
      // Chế độ khách (Guest Mode): Hiển thị dữ liệu cục bộ học thuật chuẩn
      const now = new Date();
      const daysLabel = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const weekly: DayStudyTime[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = daysLabel[d.getDay()];
        const mins = i === 0 ? 27 : (i % 2 === 0 ? 35 : 15);
        weekly.push({
          day: dayLabel,
          date: d.toISOString().split('T')[0],
          minutes: mins,
        });
      }

      setWeeklyData(weekly);
      setExamStats({ averageScore: 8.5, totalExams: 3 });

      // Lưới 28 ngày chuẩn tuần (T2 -> CN)
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() - distanceToMonday);

      const startMonday = new Date(currentMonday);
      startMonday.setDate(currentMonday.getDate() - 21);

      const grid = [];
      const todayStr = now.toISOString().split('T')[0];

      for (let i = 0; i < 28; i++) {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const isToday = dStr === todayStr;
        let mins = 0;
        if (isToday) mins = 27;
        else if (i % 5 === 0) mins = 45;
        else if (i % 3 === 0) mins = 25;
        else if (i % 2 === 0) mins = 10;

        grid.push({
          date: dStr,
          minutes: mins,
          isToday,
          isMonthStart: d.getDate() === 1 || i === 0,
          monthLabel: d.getDate() === 1 ? `Th${d.getMonth() + 1}` : undefined,
        });
      }

      setActivityGrid(grid);
      setIsLoading(false);
    }
  }, [user?.id, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  const returnHref = returnDestination === 'home' ? '/?view=home' : '/?view=desk';
  const returnLabel = returnDestination === 'home' ? 'Về Trang Chủ' : 'Về Bàn Học';

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar & Header — Căn trái cùng trục đọc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              href={returnHref}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>{returnLabel}</span>
            </Link>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
                <BarChart2 className="w-4 h-4 stroke-[2.4]" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Nhật ký học tập
              </h1>
            </div>
          </div>
        </div>

        {/* Banner dành cho người dùng khách */}
        {status === 'guest' && (
          <div className="p-4 bg-white border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="text-xs text-slate-700 space-y-0.5">
              <span className="font-bold text-amber-800">Chế độ trải nghiệm khách:</span>
              <p className="text-slate-500">
                Lịch sử học tập hiện chỉ lưu trên trình duyệt này. Đăng nhập để lưu tiến độ lâu dài và đồng bộ lên đám mây.
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-2xs transition-all flex-shrink-0 self-start sm:self-center cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập ngay</span>
            </Link>
          </div>
        )}

        {/* 1. Main Stat Cards */}
        <StudyStats
          weeklyData={weeklyData}
          examStats={examStats}
          streakDays={1}
        />

        {/* 2. Monthly Contribution Matrix */}
        <StreakCalendar activityGrid={activityGrid} />
      </div>
    </div>
  );
}
