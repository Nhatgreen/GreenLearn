'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePomodoroContext } from '@/context/PomodoroContext';
import { Timer, Play, Pause, RotateCcw, Coffee, Sparkles } from 'lucide-react';

export function PomodoroChip() {
  const {
    phase,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    completedSessionsToday,
    totalFocusMinutesToday,
  } = usePomodoroContext();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isWork = phase === 'work';

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      {/* Mini Pomodoro Chip on HUD */}
      <div 
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border shadow-2xs select-none ${
          isWork
            ? isRunning
              ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isWork ? 'Phiên tập trung (25 phút)' : 'Nghỉ ngơi (5 phút)'}
          className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {isWork ? (
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-[#16A34A] animate-pulse' : 'text-slate-500'}`} />
          ) : (
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className="font-bold tracking-tight">{formattedTime}</span>
        </button>

        {/* Quick Play/Pause button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning) {
              pause();
            } else {
              start();
            }
          }}
          title={isRunning ? 'Tạm dừng' : 'Bắt đầu đếm ngược'}
          className={`p-0.5 rounded cursor-pointer transition-colors ${
            isRunning 
              ? 'hover:bg-green-200/60 text-[#16A34A]' 
              : 'hover:bg-slate-200 text-slate-700'
          }`}
        >
          {isRunning ? (
            <Pause className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <Play className="w-3 h-3 fill-current stroke-[2]" />
          )}
        </button>
      </div>

      {/* Popover Controls & Today's Summary */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-300 rounded-xl shadow-xl p-3 z-50 text-slate-900 animate-fade-in font-sans">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {isWork ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Phiên Tập Trung</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nghỉ Ngơi Nhanh</span>
                </>
              )}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {isWork ? '25 phút' : '5 phút'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <button
              onClick={() => {
                if (isRunning) pause();
                else start();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current stroke-[2]" />
                  <span>Bắt đầu</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                reset();
              }}
              title="Đặt lại về ban đầu"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Today's stats */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Hôm nay:</span>
            <span className="font-bold text-[#166534]">
              {completedSessionsToday} phiên ({totalFocusMinutesToday}p)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
