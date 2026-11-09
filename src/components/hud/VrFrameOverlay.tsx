'use client';

import React from 'react';

export function VrFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* 4 Corner Subtle Framing Brackets (Monochromatic) */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-slate-300 rounded-tl-sm" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-slate-300 rounded-tr-sm" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-slate-300 rounded-bl-sm" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-slate-300 rounded-br-sm" />
    </div>
  );
}
