'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PeerUser, VoiceSignal } from './useRealtimeMultiplayer';
import { playMuteChime, playUnmuteChime, playDeafenChime, playUndeafenChime } from '@/lib/soundFx';

export interface UseWebRtcVoiceChatOptions {
  currentUserId: string;
  peers: PeerUser[];
  isConnected: boolean;
  sendVoiceSignal: (targetId: string, signal: VoiceSignal) => void;
  broadcastVoiceState: (isMuted: boolean, isSpeaking: boolean) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRtcVoiceChat({
  currentUserId,
  peers,
  isConnected,
  sendVoiceSignal,
  broadcastVoiceState,
}: UseWebRtcVoiceChatOptions) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
  const [micError, setMicError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const peerAudioAnalysersRef = useRef<Map<string, { ctx: AudioContext; analyser: AnalyserNode }>>(new Map());
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isDeafenedRef = useRef(isDeafened);
  useEffect(() => {
    isDeafenedRef.current = isDeafened;
  }, [isDeafened]);

  // Stable references for callbacks
  const sendVoiceSignalRef = useRef(sendVoiceSignal);
  useEffect(() => {
    sendVoiceSignalRef.current = sendVoiceSignal;
  }, [sendVoiceSignal]);

  const broadcastVoiceStateRef = useRef(broadcastVoiceState);
  useEffect(() => {
    broadcastVoiceStateRef.current = broadcastVoiceState;
  }, [broadcastVoiceState]);

  // Speaking debounce ref
  const speakingDebounceRef = useRef<number | null>(null);

  /**
   * Set up audio analyser for local stream to detect speaking
   */
  const setupLocalSpeakingDetection = useCallback((stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioCtx = new AudioContextClass();
      localAudioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!localStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;

        // Threshold for speaking detection (RMS > 18)
        const speakingNow = avg > 16;

        if (speakingNow) {
          if (speakingDebounceRef.current) {
            clearTimeout(speakingDebounceRef.current);
            speakingDebounceRef.current = null;
          }
          setIsSpeaking((prev) => {
            if (!prev) {
              broadcastVoiceStateRef.current(false, true);
            }
            return true;
          });
        } else {
          if (!speakingDebounceRef.current) {
            speakingDebounceRef.current = window.setTimeout(() => {
              setIsSpeaking((prev) => {
                if (prev) {
                  broadcastVoiceStateRef.current(false, false);
                }
                return false;
              });
              speakingDebounceRef.current = null;
            }, 350);
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('[VoiceChat] Failed to start local VAD analyser:', e);
    }
  }, []);

  /**
   * Set up audio analyser for remote peer stream to detect when peer is speaking
   */
  const setupRemoteSpeakingDetection = useCallback((peerId: string, stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      peerAudioAnalysersRef.current.set(peerId, { ctx: audioCtx, analyser });

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let debounceTimeout: number | null = null;

      const checkRemoteVolume = () => {
        if (!peerAudioAnalysersRef.current.has(peerId)) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const peerSpeaking = avg > 16;

        if (peerSpeaking) {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
          }
          setSpeakingPeers((prev) => (prev[peerId] ? prev : { ...prev, [peerId]: true }));
        } else {
          if (!debounceTimeout) {
            debounceTimeout = window.setTimeout(() => {
              setSpeakingPeers((prev) => {
                if (!prev[peerId]) return prev;
                const next = { ...prev };
                delete next[peerId];
                return next;
              });
              debounceTimeout = null;
            }, 350);
          }
        }

        requestAnimationFrame(checkRemoteVolume);
      };

      requestAnimationFrame(checkRemoteVolume);
    } catch (e) {
      console.warn('[VoiceChat] Remote VAD error:', e);
    }
  }, []);

  /**
   * Helper to attach remote audio stream to a hidden HTMLAudioElement
   */
  const attachRemoteAudio = useCallback((peerId: string, stream: MediaStream) => {
    if (typeof window === 'undefined') return;

    let audioEl = remoteAudioElementsRef.current.get(peerId);
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.muted = isDeafenedRef.current;
      audioEl.volume = peerVolumes[peerId] !== undefined ? peerVolumes[peerId] : 1.0;
      remoteAudioElementsRef.current.set(peerId, audioEl);
    } else {
      audioEl.muted = isDeafenedRef.current;
    }

    audioEl.srcObject = stream;
    audioEl.play().catch((err) => {
      console.warn('[VoiceChat] Autoplay blocked, will play on interaction:', err);
    });

    setupRemoteSpeakingDetection(peerId, stream);
  }, [peerVolumes, setupRemoteSpeakingDetection]);

  /**
   * Clean up all audio resources, Web Audio contexts, analysers and peer connections for a disconnected peer
   */
  const cleanupPeer = useCallback((peerId: string) => {
    // 1. Audio element
    const audio = remoteAudioElementsRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      try { audio.pause(); } catch {}
      remoteAudioElementsRef.current.delete(peerId);
    }

    // 2. Audio analyser & AudioContext (stops checkRemoteVolume rAF loop and releases hardware audio)
    const analyserEntry = peerAudioAnalysersRef.current.get(peerId);
    if (analyserEntry) {
      peerAudioAnalysersRef.current.delete(peerId);
      try {
        analyserEntry.ctx.close().catch(() => {});
      } catch {}
    }

    // 3. RTCPeerConnection
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      try {
        if (pc.connectionState !== 'closed') {
          pc.close();
        }
      } catch {}
      peerConnectionsRef.current.delete(peerId);
    }

    // 4. Reset speaking state
    setSpeakingPeers((prev) => {
      if (!prev[peerId]) return prev;
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  /**
   * Create RTCPeerConnection for a peer
   */
  const createPeerConnection = useCallback((peerId: string) => {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
      return null;
    }

    // Reuse existing connection if valid
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing && existing.connectionState !== 'closed') {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendVoiceSignalRef.current(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        attachRemoteAudio(peerId, event.streams[0]);
      }
    };

    // Connection state changes: thorough cleanup on disconnect or failure
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(peerId);
      }
    };

    // Attach local audio tracks if mic is active
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [attachRemoteAudio, cleanupPeer]);

  /**
   * Initiate offer to a peer (Polite caller pattern: caller has lower userId)
   */
  const callPeer = useCallback(async (peerId: string) => {
    try {
      const pc = createPeerConnection(peerId);
      if (!pc) return;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      sendVoiceSignalRef.current(peerId, {
        type: 'offer',
        sdp: pc.localDescription!,
      });
    } catch (err) {
      console.warn('[VoiceChat] Error calling peer:', peerId, err);
    }
  }, [createPeerConnection]);

  /**
   * Handle incoming WebRTC signaling message
   */
  const handleIncomingSignal = useCallback(async (senderId: string, signal: VoiceSignal) => {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') return;

    try {
      let pc: RTCPeerConnection | null | undefined = peerConnectionsRef.current.get(senderId);
      if (!pc || pc.connectionState === 'closed') {
        pc = createPeerConnection(senderId);
      }
      if (!pc) return;

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Attach local tracks if not already attached
        if (localStreamRef.current && pc.getSenders().length === 0) {
          localStreamRef.current.getAudioTracks().forEach((track) => {
            pc!.addTrack(track, localStreamRef.current!);
          });
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendVoiceSignalRef.current(senderId, {
          type: 'answer',
          sdp: pc.localDescription!,
        });
      } else if (signal.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'ice-candidate') {
        if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (err) {
      console.warn('[VoiceChat] Failed to process voice signal from', senderId, err);
    }
  }, [createPeerConnection]);

  /**
   * Turn Microphone ON or OFF
   */
  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      // TURN OFF
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
        localAudioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();

      setIsMicOn(false);
      setIsMuted(false);
      setIsSpeaking(false);
      broadcastVoiceStateRef.current(true, false);
      playMuteChime();
    } else {
      // TURN ON
      setMicError(null);
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập micro.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        localStreamRef.current = stream;
        setIsMicOn(true);
        setIsMuted(false);
        playUnmuteChime();
        broadcastVoiceStateRef.current(false, false);

        setupLocalSpeakingDetection(stream);

        // Initiate connection to existing peers in room (Polite peer rule)
        peers.forEach((peer) => {
          if (currentUserId < peer.id) {
            callPeer(peer.id);
          }
        });
      } catch (err: any) {
        console.error('[VoiceChat] Microphone permission error:', err);
        setMicError(err?.message || 'Không thể truy cập microphone. Vui lòng cấp quyền.');
      }
    }
  }, [isMicOn, currentUserId, peers, callPeer, setupLocalSpeakingDetection]);

  /**
   * Toggle Mute (quick mute track without renegotiating)
   */
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) {
      // If mic is off, turn it on
      toggleMic();
      return;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    if (nextMuted) {
      setIsSpeaking(false);
      broadcastVoiceStateRef.current(true, false);
      playMuteChime();
    } else {
      broadcastVoiceStateRef.current(false, false);
      playUnmuteChime();
    }
  }, [isMuted, toggleMic]);

  /**
   * Toggle Deafen (Mute / Unmute all incoming audio from room)
   */
  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => {
      const next = !prev;
      remoteAudioElementsRef.current.forEach((audioEl, peerId) => {
        if (next) {
          audioEl.muted = true;
        } else {
          audioEl.muted = false;
          audioEl.volume = peerVolumes[peerId] !== undefined ? peerVolumes[peerId] : 1.0;
        }
      });

      if (next) {
        playDeafenChime();
      } else {
        playUndeafenChime();
      }
      return next;
    });
  }, [peerVolumes]);

  /**
   * Adjust volume for a specific peer
   */
  const setPeerVolume = useCallback((peerId: string, volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setPeerVolumes((prev) => ({ ...prev, [peerId]: clamped }));
    const audioEl = remoteAudioElementsRef.current.get(peerId);
    if (audioEl) {
      if (!isDeafenedRef.current) {
        audioEl.volume = clamped;
        audioEl.muted = clamped === 0;
      }
    }
  }, []);

  // When new peers join and mic is already on, initiate call if caller has priority
  useEffect(() => {
    if (!isMicOn || !isConnected) return;

    peers.forEach((peer) => {
      if (!peerConnectionsRef.current.has(peer.id) && currentUserId < peer.id) {
        callPeer(peer.id);
      }
    });
  }, [peers, isMicOn, isConnected, currentUserId, callPeer]);

  // Clean up any peers that left the room presence
  useEffect(() => {
    const currentPeerIds = new Set(peers.map((p) => p.id));
    peerConnectionsRef.current.forEach((_, peerId) => {
      if (!currentPeerIds.has(peerId)) {
        cleanupPeer(peerId);
      }
    });
  }, [peers, cleanupPeer]);

  // Cleanup on unmount or room leave
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      peerConnectionsRef.current.forEach((pc) => {
        try {
          if (pc.connectionState !== 'closed') pc.close();
        } catch {}
      });
      peerConnectionsRef.current.clear();
      remoteAudioElementsRef.current.forEach((audio) => {
        audio.srcObject = null;
        try { audio.pause(); } catch {}
      });
      remoteAudioElementsRef.current.clear();
      peerAudioAnalysersRef.current.forEach(({ ctx }) => {
        ctx.close().catch(() => {});
      });
      peerAudioAnalysersRef.current.clear();
    };
  }, []);

  return {
    isMicOn,
    isMuted,
    isDeafened,
    isSpeaking,
    speakingPeers,
    peerVolumes,
    micError,
    toggleMic,
    toggleMute,
    toggleDeafen,
    setPeerVolume,
    handleIncomingSignal,
  };
}
