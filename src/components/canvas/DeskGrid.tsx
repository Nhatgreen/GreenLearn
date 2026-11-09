'use client';

import React from 'react';

export const DeskGrid = React.memo(function DeskGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden bg-[#e8ebf0]">
      {/* Engineering Architectural Grid Lines on Clean Light Grey Desk Surface */}
      {/* Minor Grid Lines (40px) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100, 116, 139, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Major Grid Lines (200px) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(71, 85, 105, 0.24) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(71, 85, 105, 0.24) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Central Desk Focus Glow (Subtle so desk remains grey) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(255, 255, 255, 0.35) 20%, transparent 80%)'
        }}
      />

      {/* Subtle Studio Vignette Edge Depth for 2.5D Immersion */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 55%, rgba(100, 116, 139, 0.14) 100%)'
        }}
      />
    </div>
  );
});
