'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DeskItem } from '@/types/studyspace';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useDeskItemInteraction } from '@/hooks/useDeskItemInteraction';
import { 
  Play, 
  Pause, 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Plus, 
  Download,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { RotateTwoWay } from '@/components/icons/RotateTwoWay';

interface VoiceNoteItemProps {
  item: DeskItem;
  isSelected: boolean;
}

const DEFAULT_WAVEFORM = [
  25, 40, 65, 80, 50, 30, 45, 90, 85, 60, 40, 70, 95, 65, 35, 55, 80, 75, 45, 60, 90, 85, 50, 30, 40, 70, 55, 30
];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VoiceNoteItem = React.memo(function VoiceNoteItem({ item, isSelected }: VoiceNoteItemProps) {
  const { 
    selectItem, 
    removeDeskItem, 
    addStickyNote,
    updateVoiceNoteTranscript 
  } = useStudySpace();

  const voiceData = item.voiceNoteData || {
    duration: 5,
    waveform: DEFAULT_WAVEFORM,
    transcript: '',
    authorName: 'Bạn',
    authorColor: '#16A34A'
  };

  const rawWaveform = voiceData.waveform && voiceData.waveform.length > 0 
    ? voiceData.waveform 
    : DEFAULT_WAVEFORM;

  // Normalize waveform to ~28 bars for optimal pill display
  const waveformBars = useMemo(() => {
    const targetCount = 28;
    if (rawWaveform.length === targetCount) return rawWaveform;
    const sampled: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor((i / targetCount) * rawWaveform.length);
      sampled.push(rawWaveform[idx] || 35);
    }
    return sampled;
  }, [rawWaveform]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState(voiceData.transcript || '');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hook for unified drag-and-move and touch rotation
  const {
    isDragging,
    handleMouseDown,
    handlePointerDown,
    handleRotateMouseDown,
    handleRotateDoubleClick
  } = useDeskItemInteraction({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    rotation: item.rotation,
    width: item.width || 340,
    height: item.height || 76,
  });

  // Keep transcript draft in sync with props
  useEffect(() => {
    if (voiceData.transcript !== undefined) {
      setTranscriptDraft(voiceData.transcript);
    }
  }, [voiceData.transcript]);

  // Resolved playable audio source (local blob URL created from base64, or cloud URL)
  const [resolvedAudioSource, setResolvedAudioSource] = useState<string | null>(null);

  // Audio element initialization & event listeners
  useEffect(() => {
    let localBlobUrl: string | null = null;
    let effectiveSource: string | null = null;

    // 1. If audioUrl is an external HTTP/HTTPS URL (e.g. Supabase Storage CDN)
    if (voiceData.audioUrl && (voiceData.audioUrl.startsWith('http://') || voiceData.audioUrl.startsWith('https://'))) {
      effectiveSource = voiceData.audioUrl;
    }
    // 2. If audioBlob (base64 data URL) is present (standard for P2P/Realtime sync across peers)
    else if (voiceData.audioBlob) {
      try {
        if (voiceData.audioBlob.startsWith('data:')) {
          const parts = voiceData.audioBlob.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'audio/webm';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
            localBlobUrl = window.URL.createObjectURL(blob);
            effectiveSource = localBlobUrl;
          } else {
            effectiveSource = voiceData.audioBlob;
          }
        } else {
          effectiveSource = voiceData.audioBlob;
        }
      } catch (err) {
        console.warn('Error creating local audio blob from base64:', err);
        effectiveSource = voiceData.audioBlob;
      }
    }
    // 3. Fallback: if audioUrl is a blob: URL (only valid in original creator session)
    else if (voiceData.audioUrl && voiceData.audioUrl.startsWith('blob:')) {
      effectiveSource = voiceData.audioUrl;
    }

    setResolvedAudioSource(effectiveSource);

    const audio = new Audio();
    audioRef.current = audio;

    if (effectiveSource) {
      audio.src = effectiveSource;
    }

    audio.playbackRate = playbackSpeed;
    audio.muted = isMuted;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
      if (localBlobUrl && typeof window !== 'undefined' && typeof window.URL?.revokeObjectURL === 'function') {
        window.URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [voiceData.audioUrl, voiceData.audioBlob]);

  // Sync playback speed & mute state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Play / Pause toggle handler
  const handleTogglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // If reached end, restart
      if (audio.currentTime >= (voiceData.duration || 1)) {
        audio.currentTime = 0;
      }
      try {
        const playPromise = audio.play();
        if (playPromise !== undefined && typeof playPromise.then === 'function') {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(() => {
            // Fallback simulated playback for environments without playable media source
            simulatePlayback();
          });
        } else {
          setIsPlaying(true);
        }
      } catch {
        simulatePlayback();
      }
    }
  }, [isPlaying, voiceData.duration]);

  const simulatePlayback = () => {
    setIsPlaying(true);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= (voiceData.duration || 5)) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        setCurrentTime(elapsed);
      }
    }, 80);
  };

  // Seek on waveform click / drag
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (voiceData.duration || 5);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  }, [voiceData.duration]);

  // Cycle playback speed: 1x -> 1.25x -> 1.5x -> 2x -> 1x
  const handleCycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Safe 2-step delete
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDelete(false);
      }, 3000);
    } else {
      removeDeskItem(item.id);
    }
  };

  // Copy transcript
  const handleCopyTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transcriptDraft) {
      navigator.clipboard.writeText(transcriptDraft);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  // Save edited transcript
  const handleSaveTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateVoiceNoteTranscript(item.id, transcriptDraft);
    setIsEditingTranscript(false);
  };

  // Convert transcript to Sticky Note on the desk
  const handleCreateStickyNoteFromTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    const content = transcriptDraft || 'Bản ghi âm giọng nói';
    const noteText = `[GHI ÂM: ${voiceData.authorName || 'Bạn'}]\n\n${content}`;
    addStickyNote(noteText, item.x + 360, item.y, '#fef08a', 240, 180);
  };

  // Download voice note audio
  const handleDownloadAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const source = resolvedAudioSource || voiceData.audioUrl || voiceData.audioBlob;
    if (!source) return;
    const a = document.createElement('a');
    a.href = source;
    a.download = `voicenote-${item.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calculate playback progress fraction (0 to 1)
  const durationSafe = voiceData.duration && voiceData.duration > 0 ? voiceData.duration : 5;
  const progress = Math.max(0, Math.min(1, currentTime / durationSafe));
  const activeBarIndex = Math.floor(progress * waveformBars.length);

  const authorInitial = (voiceData.authorName || 'B').trim().charAt(0).toUpperCase();
  const authorBgColor = voiceData.authorColor || '#16A34A';

  return (
    <div
      data-desk-item="true"
      data-item-id={item.id}
      data-item-type="voice_note"
      onClick={(e) => {
        e.stopPropagation();
        selectItem(item.id);
      }}
      style={{
        transform: `translate(${Math.round(item.x)}px, ${Math.round(item.y)}px) rotate(${item.rotation}deg) scale(${item.scale || 1})`,
        transformOrigin: '0 0',
        zIndex: isSelected ? 50 : item.zIndex || 10,
        textRendering: 'geometricPrecision'
      }}
      className={`absolute select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Floating Control Toolbar on Top (Hover or Selected) */}
      <div 
        className={`absolute -top-10 left-11 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full border border-slate-200/90 shadow-md transition-all z-30 ${
          isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
        }`}
      >
        {/* Rotation Handle */}
        <button
          type="button"
          title="Xoay vật thể (Chạm 2 lần để về 0°)"
          onPointerDown={handleRotateMouseDown}
          onDoubleClick={handleRotateDoubleClick}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-grab active:cursor-grabbing touch-none touch-target"
        >
          <RotateTwoWay className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>

        <div className="w-[1px] h-3 bg-slate-200 my-auto" />

        {/* Playback Speed Button */}
        <button
          type="button"
          onClick={handleCycleSpeed}
          title="Tốc độ phát âm thanh"
          className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
        >
          {playbackSpeed}x
        </button>

        {/* Mute Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          title={isMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Download Audio */}
        {(resolvedAudioSource || voiceData.audioUrl || voiceData.audioBlob) && (
          <button
            type="button"
            onClick={handleDownloadAudio}
            title="Tải file ghi âm về máy"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-[1px] h-3 bg-slate-200 my-auto" />

        {/* Delete with 2-step confirmation */}
        <button
          type="button"
          onClick={handleDeleteClick}
          title={confirmDelete ? 'Bấm lần nữa để xác nhận xóa vĩnh viễn' : 'Xóa ghi chú âm thanh'}
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
            confirmDelete
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
          }`}
        >
          {confirmDelete ? 'Xác nhận?' : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Horizontal Layout: Avatar on the Left + Audio Bubble on the Right */}
      <div className="flex items-start gap-2.5">
        
        {/* 1. Left Component: Creator Avatar */}
        <div 
          title={`Người ghi: ${voiceData.authorName || 'Bạn'}`}
          className="relative shrink-0 mt-1 cursor-default select-none"
        >
          {voiceData.authorAvatar ? (
            <img 
              src={voiceData.authorAvatar} 
              alt={voiceData.authorName || 'Avatar'} 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
              style={{ width: 36, height: 36 }}
            />
          ) : (
            <div 
              style={{ backgroundColor: authorBgColor }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white"
            >
              {authorInitial}
            </div>
          )}

          {/* Glowing Speaking Ripple Indicator when playing */}
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0068FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0068FF] ring-2 ring-white" />
            </span>
          )}
        </div>

        {/* 2. Right Component: Audio Bubble (Zalo Voice Bubble Specs) */}
        <div className="flex flex-col">
          <div
            onPointerDown={handlePointerDown}
            onMouseDown={handleMouseDown}
            className={`flex items-center gap-3.5 px-4 py-2.5 bg-white rounded-[22px] border transition-all cursor-grab active:cursor-grabbing select-none touch-none ${
              isSelected 
                ? 'border-[#0068FF] shadow-lg shadow-blue-500/10 ring-2 ring-[#0068FF]/20' 
                : 'border-slate-200/90 shadow-md shadow-slate-200/70 hover:shadow-lg hover:border-slate-300'
            }`}
            style={{ minWidth: 280, maxWidth: 360 }}
          >
            {/* Left inside Bubble: Round Play/Pause button (#0068FF) */}
            <button
              type="button"
              onClick={handleTogglePlay}
              title={isPlaying ? 'Tạm dừng phát' : 'Phát ghi âm'}
              className="w-10 h-10 rounded-full bg-[#0068FF] hover:bg-[#0057d9] text-white flex items-center justify-center shadow-md shadow-blue-600/30 active:scale-90 transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white stroke-[2.4]" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white translate-x-0.5 stroke-[2.4]" />
              )}
            </button>

            {/* Middle inside Bubble: Waveform + Timer MM:SS */}
            <div className="flex-1 flex flex-col justify-center min-w-[130px] gap-1">
              {/* Waveform Bars */}
              <div 
                ref={waveformContainerRef}
                onClick={handleSeek}
                title="Nhấn để tua âm thanh"
                className="flex items-center gap-[3px] h-6 cursor-pointer py-1"
              >
                {waveformBars.map((val, idx) => {
                  const isPassed = idx <= activeBarIndex && (isPlaying || currentTime > 0);
                  // Scale normalized height between 4px and 22px
                  const barHeight = Math.max(4, Math.round((val / 100) * 22));
                  return (
                    <div
                      key={idx}
                      style={{ height: `${barHeight}px` }}
                      className={`w-[3px] rounded-full transition-colors ${
                        isPassed 
                          ? 'bg-[#0068FF]' 
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Timer right below waveform: MM:SS */}
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-semibold text-slate-500 tracking-tight">
                  {formatTime(isPlaying || currentTime > 0 ? currentTime : durationSafe)}
                </span>
                {isPlaying && (
                  <span className="text-[9.5px] font-mono text-slate-400">
                    / {formatTime(durationSafe)}
                  </span>
                )}
              </div>
            </div>

            {/* Right inside Bubble: Secondary Square Rounded Speech-to-Text Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTranscriptOpen(!isTranscriptOpen);
              }}
              title="Chuyển đổi giọng nói thành văn bản (Speech-to-Text)"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 border ${
                isTranscriptOpen 
                  ? 'bg-blue-50 text-[#0068FF] border-blue-200 shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-600 hover:text-slate-900 border-slate-200/70'
              }`}
            >
              <FileText className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Transcript Expandable Card (Toggled via right button) */}
          {isTranscriptOpen && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full max-w-[360px] bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-200/80 animate-fade-in text-slate-900 z-20"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0068FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Văn bản giọng nói
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    title="Sao chép nội dung văn bản"
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTranscript(!isEditingTranscript);
                    }}
                    title={isEditingTranscript ? 'Hủy sửa' : 'Chỉnh sửa văn bản'}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isEditingTranscript ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Convert to Sticky Note */}
                  <button
                    type="button"
                    onClick={handleCreateStickyNoteFromTranscript}
                    title="Tạo Note dán giấy trên bàn học từ văn bản này"
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Tạo Note</span>
                  </button>
                </div>
              </div>

              {/* Body */}
              {isEditingTranscript ? (
                <div className="space-y-2">
                  <textarea
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                    placeholder="Nhập nội dung văn bản cho đoạn ghi âm..."
                    rows={3}
                    className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 leading-relaxed resize-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingTranscript(false)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTranscript}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0068FF] hover:bg-[#0057d9] rounded-lg shadow-2xs cursor-pointer"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-700 leading-relaxed select-text font-normal max-h-36 overflow-y-auto no-scrollbar">
                  {transcriptDraft ? (
                    <p className="whitespace-pre-wrap">{transcriptDraft}</p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Chưa có văn bản chuyển đổi. Nhấn nút cây bút ở trên để thêm ghi chép cho đoạn ghi âm này.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
});
