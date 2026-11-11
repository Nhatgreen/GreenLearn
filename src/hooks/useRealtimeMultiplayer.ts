'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase, getSupabaseConfig } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DeskItem, DrawingStroke, CanvasTransform } from '@/types/studyspace';

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

export type DeskAction =
  | { type: 'ITEM_MOVE'; payload: { id: string; x: number; y: number } }
  | { type: 'ITEM_ROTATE'; payload: { id: string; rotation: number } }
  | { type: 'PAGE_TURN'; payload: { id: string; pageIndex: number } }
  | { type: 'ADD_ITEM'; payload: { item: DeskItem } }
  | { type: 'DELETE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_ITEM_TEXT'; payload: { id: string; text: string } }
  | { type: 'DRAW_STROKE'; payload: { stroke: DrawingStroke } }
  | { type: 'CLEAR_STROKES' }
  | { type: 'REMOVE_STROKE'; payload: { id: string } }
  | { type: 'REQUEST_SPACE_STATE'; payload: { requesterId: string } }
  | { type: 'SYNC_SPACE_STATE'; payload: { targetId?: string; spaceName?: string; items: DeskItem[]; strokes: DrawingStroke[] } };

const DEFAULT_MOCK_PEERS: PeerUser[] = [
  { id: 'mock-1', name: 'Lê Hoàng (Khoa CNTT)', avatarColor: '#334155', status: 'Đang thuyết trình', role: 'editor', isPresenter: true },
  { id: 'mock-2', name: 'Minh Thư (Toán Tin)', avatarColor: '#64748b', status: 'Đang làm bài', role: 'viewer' }
];

const PRESET_AVATAR_COLORS = [
  '#16A34A', // GreenLearn Green
  '#2563EB', // Blue
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#E11D48', // Rose
  '#4F46E5', // Indigo
  '#EA580C', // Orange
];

export interface UseRealtimeMultiplayerOptions {
  spaceId: string;
  currentUserName?: string;
  isHostInitial?: boolean;
  transform?: CanvasTransform;
  onDeskAction?: (action: DeskAction) => void;
  onRequestSpaceState?: (requesterId: string) => void;
}

export function useRealtimeMultiplayer(
  spaceIdOrOptions: string | UseRealtimeMultiplayerOptions,
  legacyUserName = 'Bạn (Chủ bàn)',
  legacyIsHost = true
) {
  // Normalize arguments
  const options: UseRealtimeMultiplayerOptions = typeof spaceIdOrOptions === 'string'
    ? {
        spaceId: spaceIdOrOptions,
        currentUserName: legacyUserName,
        isHostInitial: legacyIsHost
      }
    : spaceIdOrOptions;

  const {
    spaceId,
    currentUserName = 'Bạn (Chủ bàn)',
    isHostInitial = true,
    transform,
    onDeskAction,
    onRequestSpaceState
  } = options;

  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFollowPresenter, setIsFollowPresenter] = useState(false);
  const [hasMockPeers, setHasMockPeers] = useState(false);

  // Active room ID state: reads from URL query if present
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('room');
    }
    return null;
  });

  const [roomPermission, setRoomPermission] = useState<'view_only' | 'edit'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('perm');
      if (p === 'edit') return 'edit';
    }
    return 'view_only';
  });

  const [isHost, setIsHost] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const room = new URLSearchParams(window.location.search).get('room');
      if (room) {
        const isHostedLocally = localStorage.getItem('greenlearn_hosted_room_' + room) === 'true';
        if (isHostedLocally) return true;
        return false; // Default guest when opening a shared link
      }
    }
    return isHostInitial;
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userId = useRef<string>(`user-${Math.random().toString(36).substring(2, 9)}`).current;
  const localAvatarColor = useRef<string>(
    PRESET_AVATAR_COLORS[Math.floor(Math.random() * PRESET_AVATAR_COLORS.length)]
  );

  const onDeskActionRef = useRef(onDeskAction);
  useEffect(() => {
    onDeskActionRef.current = onDeskAction;
  }, [onDeskAction]);

  const onRequestSpaceStateRef = useRef(onRequestSpaceState);
  useEffect(() => {
    onRequestSpaceStateRef.current = onRequestSpaceState;
  }, [onRequestSpaceState]);

  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Check Supabase config on mount
  useEffect(() => {
    const config = getSupabaseConfig();
    setIsConfigured(config.isConfigured);
  }, []);

  // Listen to popstate (back/forward) to update room query
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined') {
        const r = new URLSearchParams(window.location.search).get('room');
        setActiveRoomId(r);
        const p = new URLSearchParams(window.location.search).get('perm');
        if (p === 'edit') setRoomPermission('edit');
        else if (p === 'view_only') setRoomPermission('view_only');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Connect to Supabase Realtime channel when activeRoomId is set
  useEffect(() => {
    if (!activeRoomId) {
      if (channelRef.current) {
        try {
          channelRef.current.untrack();
          channelRef.current.unsubscribe();
        } catch (e) {}
        channelRef.current = null;
      }
      setIsConnected(false);
      setPeers([]);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsConnected(false);
      return;
    }

    const channelName = `room-${activeRoomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: userId },
        broadcast: { ack: false }
      }
    });

    channelRef.current = channel;

    // 1. Presence Sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{
        id?: string;
        name?: string;
        avatarColor?: string;
        status?: string;
        role?: 'owner' | 'editor' | 'viewer';
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
              name: userState.name || 'Bạn học',
              avatarColor: userState.avatarColor || '#16A34A',
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
    });

    // 1b. Presence Join: When a new peer enters
    channel.on('presence', { event: 'join' }, ({ key }) => {
      if (key !== userId) {
        // Automatically sync host's canvas to newly joined peer
        onRequestSpaceStateRef.current?.(key);
      }
    });

    // 2. Cursor Broadcast
    channel.on('broadcast', { event: 'cursor' }, (payload) => {
      const { id, x, y } = payload.payload || {};
      if (id && id !== userId) {
        setPeers(prev => prev.map(p => p.id === id ? { ...p, cursor: { x, y } } : p));
      }
    });

    // 3. Camera Broadcast
    channel.on('broadcast', { event: 'camera' }, (payload) => {
      const { id, camera } = payload.payload || {};
      if (id && id !== userId) {
        setPeers(prev => prev.map(p => p.id === id ? { ...p, camera } : p));
      }
    });

    // 4. Desk Action Broadcast
    channel.on('broadcast', { event: 'desk_action' }, (payload) => {
      const action = payload.payload as DeskAction;
      if (!action) return;

      // Handle targeted actions
      if ((action as any).payload?.targetId && (action as any).payload.targetId !== userId) {
        return;
      }

      if (action.type === 'REQUEST_SPACE_STATE') {
        onRequestSpaceStateRef.current?.(action.payload.requesterId);
        return;
      }

      onDeskActionRef.current?.(action);
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        channel.track({
          id: userId,
          name: currentUserName,
          avatarColor: localAvatarColor.current,
          status: 'Đang trực tuyến',
          role: isHost ? 'owner' : (roomPermission === 'edit' ? 'editor' : 'viewer'),
          isPresenter: isHost,
          joinedAt: Date.now()
        });

        // If guest, request initial state with retry
        if (!isHost) {
          const sendReq = () => {
            if (channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'desk_action',
                payload: {
                  type: 'REQUEST_SPACE_STATE',
                  payload: { requesterId: userId }
                }
              });
            }
          };

          sendReq();
          setTimeout(sendReq, 1000);
        }
      } else {
        setIsConnected(false);
      }
    });

    return () => {
      try {
        channel.untrack();
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (e) {}
      channelRef.current = null;
    };
  }, [activeRoomId, isHost, roomPermission, currentUserName, userId]);

  // Broadcast mouse cursor (World coordinates)
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current || !isConnected) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { id: userId, x, y }
    });
  }, [isConnected, userId]);

  // 50ms Throttled Cursor Broadcasting
  useEffect(() => {
    if (!isConnected || peers.length === 0) return;

    let lastSendTime = 0;
    const THROTTLE_MS = 50;

    const handlePointerMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastSendTime >= THROTTLE_MS) {
        lastSendTime = now;
        const curTrans = transformRef.current;
        const wx = curTrans ? Math.round((e.clientX - curTrans.x) / curTrans.scale) : e.clientX;
        const wy = curTrans ? Math.round((e.clientY - curTrans.y) / curTrans.scale) : e.clientY;
        broadcastCursor(wx, wy);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isConnected, peers.length, broadcastCursor]);

  // Throttled desk action sender
  const lastItemMoveRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const broadcastDeskAction = useCallback((action: DeskAction) => {
    if (!channelRef.current || !isConnected) return;

    if (action.type === 'ITEM_MOVE') {
      const now = Date.now();
      if (lastItemMoveRef.current.id === action.payload.id && now - lastItemMoveRef.current.time < 40) {
        return;
      }
      lastItemMoveRef.current = { id: action.payload.id, time: now };
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'desk_action',
      payload: action
    });
  }, [isConnected]);

  // Broadcast camera transform for presenter follow
  const broadcastCamera = useCallback((camera: { x: number; y: number; scale: number; rotation: number }) => {
    if (!channelRef.current || !isConnected) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'camera',
      payload: { id: userId, camera }
    });
  }, [isConnected, userId]);

  // Start hosting a study room
  const startHostingRoom = useCallback((customRoomId?: string, permission: 'view_only' | 'edit' = 'view_only') => {
    const targetRoomId = customRoomId || `${spaceId || 'space'}-${Math.random().toString(36).substring(2, 8)}`;
    setActiveRoomId(targetRoomId);
    setIsHost(true);
    setRoomPermission(permission);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('greenlearn_hosted_room_' + targetRoomId, 'true');
        const url = new URL(window.location.href);
        url.searchParams.set('room', targetRoomId);
        url.searchParams.set('perm', permission);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }

    return targetRoomId;
  }, [spaceId]);

  // Explicitly join an existing room
  const joinRoom = useCallback((targetRoomId: string, permission: 'view_only' | 'edit' = 'view_only') => {
    setActiveRoomId(targetRoomId);
    setIsHost(false);
    setRoomPermission(permission);

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('room', targetRoomId);
        url.searchParams.set('perm', permission);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
  }, []);

  // Explicitly leave the room and return to solo desk mode
  const leaveRoom = useCallback(() => {
    if (activeRoomId && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('greenlearn_hosted_room_' + activeRoomId);
      } catch (e) {}
    }
    if (channelRef.current) {
      try {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      } catch (e) {}
      channelRef.current = null;
    }
    setActiveRoomId(null);
    setIsHost(false);
    setPeers([]);
    setIsConnected(false);
    setIsFollowPresenter(false);
    setHasMockPeers(false);

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        let changed = false;
        if (url.searchParams.has('room')) {
          url.searchParams.delete('room');
          changed = true;
        }
        if (url.searchParams.has('perm')) {
          url.searchParams.delete('perm');
          changed = true;
        }
        if (changed) {
          window.history.replaceState({}, '', url.toString());
        }
      } catch (e) {}
    }
  }, []);

  // Fallback simulation toggle
  const toggleSimulation = useCallback(() => {
    setHasMockPeers(prev => {
      const next = !prev;
      if (next) {
        setPeers(DEFAULT_MOCK_PEERS);
      } else {
        setPeers([]);
      }
      return next;
    });
  }, []);

  const activePeers = isConnected ? peers : (hasMockPeers ? DEFAULT_MOCK_PEERS : []);
  const isMultiplayerActive = activePeers.length > 0 || (isConnected && !!activeRoomId);

  return {
    peers: activePeers,
    isConnected,
    isConfigured,
    hasPeers: isMultiplayerActive,
    setHasPeers: setHasMockPeers,
    roomId: activeRoomId,
    isHost,
    roomPermission,
    setRoomPermission,
    startHostingRoom,
    joinRoom,
    leaveRoom,
    broadcastDeskAction,
    broadcastCursor,
    broadcastCamera,
    isFollowPresenter,
    setIsFollowPresenter,
    toggleSimulation
  };
}
