import React from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

export interface TourStepConfig {
  targetSelector?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourStepProps {
  step: TourStepConfig;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TourStep({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TourStepProps) {
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-5 max-w-sm w-full text-slate-800 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-green-50 text-[#16A34A] border border-green-200">
          Bước {stepIndex + 1}/{totalSteps}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          aria-label="Đóng hướng dẫn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed mb-4">{step.description}</p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 transition-colors"
        >
          Bỏ qua
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <span>{isLast ? 'Bắt đầu học ngay' : 'Tiếp tục'}</span>
          {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
