'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase, getSupabaseConfig } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PeerUser {
  id: string;
  name: string;
  avatarColor: string;
  status: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: { x: number; y: number };
  camera?: { x: number; y: number; scale: number; rotation: number };
  isPresenter?: boolean;
  lastActive?: number;
}

const DEFAULT_MOCK_PEERS: PeerUser[] = [
  { id: 'mock-1', name: 'Lê Hoàng (Khoa CNTT)', avatarColor: '#334155', status: 'Đang thuyết trình', role: 'editor', isPresenter: true },
  { id: 'mock-2', name: 'Minh Thư (Toán Tin)', avatarColor: '#64748b', status: 'Đang làm bài', role: 'viewer' }
];

export function useRealtimeMultiplayer(spaceId: string, currentUserName = 'Bạn (Chủ bàn)', isHost = true) {
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFollowPresenter, setIsFollowPresenter] = useState(false);
  const [hasPeers, setHasPeers] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Check Supabase config on mount
  useEffect(() => {
    const config = getSupabaseConfig();
    setIsConfigured(config.isConfigured);
  }, []);

  const userId = useRef<string>(`user-${Math.random().toString(36).substring(2, 9)}`).current;

  // Initialize Realtime Channel only when room query param is present or explicitly active
  useEffect(() => {
    const hasRoomQuery = typeof window !== 'undefined' && window.location.search.includes('room=');
    if (!hasRoomQuery && !hasPeers) {
      // User is in solo mode, do not join room or track presence
      setIsConnected(false);
      setPeers([]);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsConnected(false);
      return;
    }

    const searchRoom = typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search).get('room') 
      : null;
    const effectiveSpaceId = searchRoom || spaceId || 'default';
    const roomId = `room-${effectiveSpaceId}`;
    const channel = supabase.channel(roomId, {
      config: {
        presence: { key: userId },
        broadcast: { ack: false }
      }
    });

    channelRef.current = channel;

    // 1. Presence Sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{
        name: string;
        avatarColor: string;
        status: string;
        role: 'owner' | 'editor' | 'viewer';
        cursor?: { x: number; y: number };
        camera?: { x: number; y: number; scale: number; rotation: number };
        isPresenter?: boolean;
      }>();

      const peerList: PeerUser[] = [];
      Object.keys(state).forEach((key) => {
        if (key !== userId) {
          const userState = state[key]?.[0];
          if (userState) {
            peerList.push({
              id: key,
              name: userState.name || 'Người học',
              avatarColor: userState.avatarColor || '#3b82f6',
              status: userState.status || 'Đang trực tuyến',
              role: userState.role || 'viewer',
              cursor: userState.cursor,
              camera: userState.camera,
              isPresenter: userState.isPresenter
            });
          }
        }
      });

      setPeers(peerList);
      if (peerList.length > 0) {
        setHasPeers(true);
      }
    });

    // 2. Cursor Broadcast
    channel.on('broadcast', { event: 'cursor' }, (payload) => {
      const { id, x, y } = payload.payload;
      if (id !== userId) {
        setPeers(prev => prev.map(p => p.id === id ? { ...p, cursor: { x, y } } : p));
      }
    });

    // Subscribe to channel and track local user presence
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        channel.track({
          name: currentUserName,
          avatarColor: isHost ? '#0f172a' : '#16A34A',
          status: 'Đang tương tác',
          role: isHost ? 'owner' : 'editor',
          isPresenter: isHost
        });
      } else {
        setIsConnected(false);
      }
    });

    return () => {
      channel.untrack();
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [spaceId, currentUserName, isHost, userId]);

  // Broadcast mouse cursor
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !isConnected) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { id: userId, x, y }
    });
  }, [isConnected, userId]);

  // 60ms Throttled Cursor Broadcasting when peers are present
  useEffect(() => {
    if (!isConnected || peers.length === 0) return;

    let lastSendTime = 0;
    const THROTTLE_MS = 60;

    const handlePointerMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastSendTime >= THROTTLE_MS) {
        lastSendTime = now;
        broadcastCursor(e.clientX, e.clientY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isConnected, peers.length, broadcastCursor]);

  // Broadcast camera transform for presenter follow
  const broadcastCamera = useCallback((camera: { x: number; y: number; scale: number; rotation: number }) => {
    if (!channelRef.current || !isConnected) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'camera',
      payload: { id: userId, camera }
    });
  }, [isConnected, userId]);

  // Fallback simulation toggle when offline
  const toggleSimulation = useCallback(() => {
    setHasPeers(prev => {
      const next = !prev;
      if (next) {
        setPeers(DEFAULT_MOCK_PEERS);
      } else {
        setPeers([]);
      }
      return next;
    });
  }, []);

  // Explicitly leave the room and return to solo desk mode
  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      } catch (e) {}
      channelRef.current = null;
    }
    setPeers([]);
    setHasPeers(false);
    setIsConnected(false);
    setIsFollowPresenter(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('room')) {
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const activePeers = isConnected ? peers : (hasPeers ? DEFAULT_MOCK_PEERS : []);
  const isMultiplayerActive = activePeers.length > 0;

  return {
    peers: activePeers,
    isConnected,
    isConfigured,
    hasPeers: isMultiplayerActive,
    setHasPeers,
    isFollowPresenter,
    setIsFollowPresenter,
    broadcastCursor,
    broadcastCamera,
    toggleSimulation,
    leaveRoom
  };
}
