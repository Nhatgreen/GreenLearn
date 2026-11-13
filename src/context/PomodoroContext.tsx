'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePomodoro, PomodoroPhase, UsePomodoroResult } from '@/hooks/usePomodoro';
import { ActivityService } from '@/services/ActivityService';

export interface PomodoroSession {
  id: string;
  completedAt: string;
  durationMinutes: number;
  phase: PomodoroPhase;
}

interface PomodoroContextType extends UsePomodoroResult {
  completedSessionsToday: number;
  totalFocusMinutesToday: number;
  isChipExpanded: boolean;
  setIsChipExpanded: (expanded: boolean) => void;
}

const PomodoroContext = createContext<PomodoroContextType | null>(null);

const STORAGE_KEY = 'greenlearn_pomodoro_sessions';

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [completedSessions, setCompletedSessions] = useState<PomodoroSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isChipExpanded, setIsChipExpanded] = useState(false);

  const handlePhaseComplete = useCallback((finishedPhase: PomodoroPhase) => {
    if (finishedPhase === 'work') {
      // Hoàn thành phiên làm việc 25 phút
      const session: PomodoroSession = {
        id: `pomo-${Date.now()}`,
        completedAt: new Date().toISOString(),
        durationMinutes: 25,
        phase: 'work',
      };

      setCompletedSessions(prev => {
        const updated = [...prev, session];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-100)));
          } catch {
            // ignore
          }
        }
        return updated;
      });

      // Tự động ghi nhận nhịp tim học tập
      try {
        ActivityService.recordStudySession(25);
      } catch (e) {
        console.warn('Lỗi ghi nhận ActivityService:', e);
      }

      // Phát sự kiện toàn cục để HUD / Mascot chúc mừng
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('greenlearn:pomodoro-complete', {
          detail: { durationMinutes: 25 }
        }));
      }
    }
  }, []);

  const pomodoro = usePomodoro({
    workMinutes: 25,
    breakMinutes: 5,
    onPhaseComplete: handlePhaseComplete,
  });

  // Tính số phiên và số phút tập trung hôm nay
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = completedSessions.filter(s => s.completedAt.startsWith(todayStr));
  const completedSessionsToday = todaySessions.length;
  const totalFocusMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <PomodoroContext.Provider
      value={{
        ...pomodoro,
        completedSessionsToday,
        totalFocusMinutesToday,
        isChipExpanded,
        setIsChipExpanded,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext(): PomodoroContextType {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return ctx;
}
