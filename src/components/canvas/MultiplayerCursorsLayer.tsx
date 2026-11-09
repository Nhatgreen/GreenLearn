'use client';

import React from 'react';
import { PeerUser } from '@/hooks/useRealtimeMultiplayer';
import { MousePointer2 } from 'lucide-react';

interface MultiplayerCursorsLayerProps {
  peers: PeerUser[];
}

export function MultiplayerCursorsLayer({ peers }: MultiplayerCursorsLayerProps) {
  const peersWithCursor = peers.filter(p => p.cursor && typeof p.cursor.x === 'number');

  if (peersWithCursor.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {peersWithCursor.map(peer => {
        if (!peer.cursor) return null;
        return (
          <div
            key={peer.id}
            style={{
              transform: `translate(${peer.cursor.x}px, ${peer.cursor.y}px)`,
              transition: 'transform 0.08s ease-out'
            }}
            className="absolute top-0 left-0 flex items-start gap-1 select-none"
          >
            <MousePointer2 
              className="w-4 h-4 -rotate-45 drop-shadow-md stroke-[2]"
              style={{ color: peer.avatarColor, fill: peer.avatarColor }}
            />
            <div 
              style={{ backgroundColor: peer.avatarColor }}
              className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md whitespace-nowrap -mt-1 opacity-90"
            >
              {peer.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
