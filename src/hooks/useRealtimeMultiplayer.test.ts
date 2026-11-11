import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeMultiplayer } from './useRealtimeMultiplayer';

// Mock Supabase client
const mockSend = vi.fn();
const mockTrack = vi.fn();
const mockUntrack = vi.fn();
const mockUnsubscribe = vi.fn();
const mockOn = vi.fn().mockReturnThis();
const mockSubscribe = vi.fn().mockImplementation((cb) => {
  if (cb) cb('SUBSCRIBED');
  return mockChannel;
});

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
  track: mockTrack,
  untrack: mockUntrack,
  unsubscribe: mockUnsubscribe,
  send: mockSend,
  presenceState: vi.fn().mockReturnValue({})
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseConfig: vi.fn().mockReturnValue({ isConfigured: true, url: 'https://test.supabase.co', anonKey: 'test-key' }),
  getSupabase: vi.fn().mockImplementation(() => ({
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn()
  }))
}));

describe('useRealtimeMultiplayer', () => {
  const originalLocation = window.location;
  const originalReplaceState = window.history.replaceState;

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    window.location = new URL('https://nhatgreen.github.io/GreenLearn/?view=desk') as any;
    window.history.replaceState = vi.fn((_state, _title, url) => {
      if (url && typeof url === 'string') {
        window.location = new URL(url, 'https://nhatgreen.github.io') as any;
      }
    });
  });

  afterEach(() => {
    window.location = originalLocation;
    window.history.replaceState = originalReplaceState;
  });

  it('initializes in solo mode when no room query is present', () => {
    const { result } = renderHook(() => useRealtimeMultiplayer('space-test', 'User A', true));

    expect(result.current.roomId).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.peers).toEqual([]);
  });

  it('starts hosting a room, updates URL, and establishes realtime connection', () => {
    const { result } = renderHook(() => useRealtimeMultiplayer('space-test', 'Host User', true));

    act(() => {
      const roomId = result.current.startHostingRoom('custom-room-123', 'edit');
      expect(roomId).toBe('custom-room-123');
    });

    expect(result.current.roomId).toBe('custom-room-123');
    expect(result.current.isHost).toBe(true);
    expect(result.current.roomPermission).toBe('edit');
    expect(result.current.isConnected).toBe(true);
    expect(window.location.search).toContain('room=custom-room-123');
    expect(window.location.search).toContain('perm=edit');
    expect(mockTrack).toHaveBeenCalled();
  });

  it('broadcasts desk actions via the channel', () => {
    const { result } = renderHook(() => useRealtimeMultiplayer('space-test', 'Host User', true));

    act(() => {
      result.current.startHostingRoom('room-test-broadcast', 'edit');
    });

    act(() => {
      result.current.broadcastDeskAction({
        type: 'ITEM_MOVE',
        payload: { id: 'item-1', x: 100, y: 200 }
      });
    });

    expect(mockSend).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'desk_action',
      payload: {
        type: 'ITEM_MOVE',
        payload: { id: 'item-1', x: 100, y: 200 }
      }
    });
  });

  it('leaves the room cleanly and removes URL room parameters', () => {
    const { result } = renderHook(() => useRealtimeMultiplayer('space-test', 'Host User', true));

    act(() => {
      result.current.startHostingRoom('room-leave-test', 'view_only');
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.leaveRoom();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.roomId).toBeNull();
    expect(result.current.peers).toEqual([]);
    expect(window.location.search).not.toContain('room=');
  });

  it('toggles fallback simulation peers when offline', () => {
    const { result } = renderHook(() => useRealtimeMultiplayer('space-test', 'Solo User', true));

    expect(result.current.peers).toEqual([]);

    act(() => {
      result.current.toggleSimulation();
    });

    expect(result.current.peers.length).toBeGreaterThan(0);
    expect(result.current.hasPeers).toBe(true);

    act(() => {
      result.current.toggleSimulation();
    });

    expect(result.current.peers).toEqual([]);
  });
});
