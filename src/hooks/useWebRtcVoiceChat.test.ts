import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRtcVoiceChat } from './useWebRtcVoiceChat';

describe('useWebRtcVoiceChat', () => {
  const mockSendVoiceSignal = vi.fn();
  const mockBroadcastVoiceState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with mic off and clean states', () => {
    const { result } = renderHook(() =>
      useWebRtcVoiceChat({
        currentUserId: 'user-1',
        peers: [],
        isConnected: true,
        sendVoiceSignal: mockSendVoiceSignal,
        broadcastVoiceState: mockBroadcastVoiceState,
      })
    );

    expect(result.current.isMicOn).toBe(false);
    expect(result.current.isMuted).toBe(false);
    expect(result.current.isDeafened).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.speakingPeers).toEqual({});
    expect(result.current.peerVolumes).toEqual({});
    expect(result.current.micError).toBeNull();
  });

  it('allows adjusting peer audio volumes safely', () => {
    const { result } = renderHook(() =>
      useWebRtcVoiceChat({
        currentUserId: 'user-1',
        peers: [],
        isConnected: true,
        sendVoiceSignal: mockSendVoiceSignal,
        broadcastVoiceState: mockBroadcastVoiceState,
      })
    );

    act(() => {
      result.current.setPeerVolume('peer-a', 0.8);
      result.current.setPeerVolume('peer-b', 1.5); // should clamp to 1.0
      result.current.setPeerVolume('peer-c', -0.5); // should clamp to 0.0
    });

    expect(result.current.peerVolumes['peer-a']).toBe(0.8);
    expect(result.current.peerVolumes['peer-b']).toBe(1.0);
    expect(result.current.peerVolumes['peer-c']).toBe(0.0);
  });

  it('handles incoming signals gracefully without throwing', async () => {
    const { result } = renderHook(() =>
      useWebRtcVoiceChat({
        currentUserId: 'user-1',
        peers: [],
        isConnected: true,
        sendVoiceSignal: mockSendVoiceSignal,
        broadcastVoiceState: mockBroadcastVoiceState,
      })
    );

    await act(async () => {
      await result.current.handleIncomingSignal('sender-1', {
        type: 'ice-candidate',
        candidate: { candidate: 'dummy', sdpMid: '0', sdpMLineIndex: 0 },
      });
    });

    // Should not crash even in jsdom environment where RTCPeerConnection is mock/undefined
    expect(result.current.isMicOn).toBe(false);
  });

  it('toggles deafen state correctly to mute all incoming audio', () => {
    const { result } = renderHook(() =>
      useWebRtcVoiceChat({
        currentUserId: 'user-1',
        peers: [],
        isConnected: true,
        sendVoiceSignal: mockSendVoiceSignal,
        broadcastVoiceState: mockBroadcastVoiceState,
      })
    );

    expect(result.current.isDeafened).toBe(false);

    act(() => {
      result.current.toggleDeafen();
    });
    expect(result.current.isDeafened).toBe(true);

    act(() => {
      result.current.toggleDeafen();
    });
    expect(result.current.isDeafened).toBe(false);
  });
});
