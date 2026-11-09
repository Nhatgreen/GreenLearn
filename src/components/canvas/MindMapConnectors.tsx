'use client';

import React from 'react';
import { useStudySpace } from '@/context/StudySpaceContext';

export const MindMapConnectors = React.memo(function MindMapConnectors() {
  const { activeSpace } = useStudySpace();

  const mindNodes = (activeSpace?.items || []).filter((i) => i.type === 'mind_map');
  const nodeMap = new Map(mindNodes.map((n) => [n.id, n]));

  const connections = mindNodes
    .filter((n) => n.mindMapParentId && nodeMap.has(n.mindMapParentId))
    .map((child) => {
      const parent = nodeMap.get(child.mindMapParentId!)!;
      const parentW = parent.width || 240;
      const parentH = parent.height || 64;
      const childW = child.width || 240;
      const childH = child.height || 64;

      const pCenter = { x: parent.x + parentW / 2, y: parent.y + parentH / 2 };
      const cCenter = { x: child.x + childW / 2, y: child.y + childH / 2 };

      // Determine attachment point based on relative horizontal/vertical positions
      const dx = cCenter.x - pCenter.x;
      const dy = cCenter.y - pCenter.y;

      let pAttach = { x: pCenter.x, y: pCenter.y };
      let cAttach = { x: cCenter.x, y: cCenter.y };

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal connection (left <-> right)
        if (dx > 0) {
          pAttach = { x: parent.x + parentW, y: pCenter.y };
          cAttach = { x: child.x, y: cCenter.y };
        } else {
          pAttach = { x: parent.x, y: pCenter.y };
          cAttach = { x: child.x + childW, y: cCenter.y };
        }
      } else {
        // Vertical connection (top <-> bottom)
        if (dy > 0) {
          pAttach = { x: pCenter.x, y: parent.y + parentH };
          cAttach = { x: cCenter.x, y: child.y };
        } else {
          pAttach = { x: pCenter.x, y: parent.y };
          cAttach = { x: cCenter.x, y: child.y + childH };
        }
      }

      const midX = (pAttach.x + cAttach.x) / 2;
      const midY = (pAttach.y + cAttach.y) / 2;

      let pathData = '';
      if (Math.abs(dx) > Math.abs(dy)) {
        pathData = `M ${pAttach.x} ${pAttach.y} C ${midX} ${pAttach.y}, ${midX} ${cAttach.y}, ${cAttach.x} ${cAttach.y}`;
      } else {
        pathData = `M ${pAttach.x} ${pAttach.y} C ${pAttach.x} ${midY}, ${cAttach.x} ${midY}, ${cAttach.x} ${cAttach.y}`;
      }

      const color = child.mindMapColor || parent.mindMapColor || '#a855f7';

      return {
        id: `${parent.id}->${child.id}`,
        pathData,
        color,
        pAttach,
        cAttach
      };
    });

  if (connections.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-10 overflow-visible w-full h-full">
      {connections.map((c) => (
        <g key={c.id}>
          {/* Subtle glow / shadow */}
          <path
            d={c.pathData}
            fill="none"
            stroke={c.color}
            strokeWidth="5"
            strokeOpacity="0.15"
            strokeLinecap="round"
          />
          {/* Main crisp branch curve */}
          <path
            d={c.pathData}
            fill="none"
            stroke={c.color}
            strokeWidth="2.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
          {/* Connection endpoints */}
          <circle cx={c.pAttach.x} cy={c.pAttach.y} r="3" fill={c.color} />
          <circle cx={c.cAttach.x} cy={c.cAttach.y} r="3" fill={c.color} />
        </g>
      ))}
    </svg>
  );
});
