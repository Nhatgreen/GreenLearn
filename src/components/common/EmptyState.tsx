'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
