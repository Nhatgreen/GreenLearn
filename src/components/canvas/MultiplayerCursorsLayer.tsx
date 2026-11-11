'use client';

import React from 'react';
import { PeerUser } from '@/hooks/useRealtimeMultiplayer';
import { MousePointer2 } from 'lucide-react';

interface MultiplayerCursorsLayerProps {
  peers: PeerUser[];
  transform?: { x: number; y: number; scale: number; rotation?: number };
}

export function MultiplayerCursorsLayer({ peers, transform }: MultiplayerCursorsLayerProps) {
  const peersWithCursor = peers.filter(p => p.cursor && typeof p.cursor.x === 'number');

  if (peersWithCursor.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9980] overflow-hidden">
      {peersWithCursor.map(peer => {
        if (!peer.cursor) return null;

        // Project world coordinates into viewport screen space if canvas transform is provided
        const screenX = transform
          ? Math.round(peer.cursor.x * transform.scale + transform.x)
          : peer.cursor.x;
        const screenY = transform
          ? Math.round(peer.cursor.y * transform.scale + transform.y)
          : peer.cursor.y;

        // Clip cursors that are far outside screen boundaries
        if (typeof window !== 'undefined') {
          if (screenX < -150 || screenX > window.innerWidth + 150 ||
              screenY < -150 || screenY > window.innerHeight + 150) {
            return null;
          }
        }

        return (
          <div
            key={peer.id}
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              transition: 'transform 0.06s ease-out'
            }}
            className="absolute top-0 left-0 flex items-start gap-1 select-none pointer-events-none will-change-transform"
          >
            <MousePointer2 
              className="w-4 h-4 -rotate-45 drop-shadow-md stroke-[2]"
              style={{ color: peer.avatarColor || '#16A34A', fill: peer.avatarColor || '#16A34A' }}
            />
            <div 
              style={{ backgroundColor: peer.avatarColor || '#16A34A' }}
              className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md whitespace-nowrap -mt-1 opacity-95"
            >
              {peer.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
