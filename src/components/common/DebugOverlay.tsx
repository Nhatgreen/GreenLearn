'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function DebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const layout = useResponsiveLayout();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDebugParam = params.get('debug') === '1' || params.get('debug') === 'true';
      const isDebugStorage = localStorage.getItem('greenlearn_debug') === '1';

      if (isDebugParam) {
        localStorage.setItem('greenlearn_debug', '1');
        setEnabled(true);
      } else if (isDebugStorage) {
        setEnabled(true);
      }
    }
  }, []);

  if (!mounted || !enabled) return null;

  const content = (
    <aside 
      aria-label="Debug Responsive Overlay"
      className="fixed bottom-20 left-3 z-[9999] pointer-events-auto select-none font-mono text-[11px]"
    >
      <div className="bg-slate-950/92 backdrop-blur-md border border-emerald-500/60 text-emerald-400 rounded-2xl p-3 shadow-2xl max-w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-emerald-500/30">
          <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>DEBUG RESPONSIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
              className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] cursor-pointer"
            >
              {collapsed ? '▼' : '▲'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEnabled(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('greenlearn_debug');
                  const url = new URL(window.location.href);
                  url.searchParams.delete('debug');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
              title="Tắt Debug Overlay"
              className="px-1.5 py-0.5 rounded-md bg-red-950/80 text-red-300 hover:text-white hover:bg-red-900 text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!collapsed && (
          <div className="space-y-1 leading-relaxed">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Breakpoint:</span>
              <span className={`font-bold px-1.5 py-0.2 rounded text-[10.5px] uppercase ${
                layout.breakpoint === 'mobile' 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                  : layout.breakpoint === 'tablet'
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {layout.breakpoint}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">isMobile:</span>
              <span className={layout.isMobile ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                {String(layout.isMobile)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mobile UA:</span>
              <span className={layout.isMobileUA ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {String(layout.isMobileUA)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Locked Device:</span>
              <span className={layout.isLockedMobile ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                {layout.isLockedMobile ? 'mobile' : 'none'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">innerWidth:</span>
              <span className="text-white font-semibold">{layout.windowWidth}px</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">screen.width:</span>
              <span className="text-white font-semibold">{layout.screenWidth}px</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">devicePixelRatio:</span>
              <span className="text-white font-semibold">{layout.devicePixelRatio}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">orientation:</span>
              <span className="text-white font-semibold">{layout.orientation}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">pointer:</span>
              <span className="text-white font-semibold">{layout.pointerType}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return createPortal(content, document.body);
}
