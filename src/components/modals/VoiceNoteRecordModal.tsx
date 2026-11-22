'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Volume2, 
  Radio, 
  FileText 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStudySpace } from '@/context/StudySpaceContext';
import { VoiceNoteData } from '@/types/studyspace';

interface VoiceNoteRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: VoiceNoteData) => void;
}

const SAMPLE_WAVEFORM = [
  25, 45, 60, 75, 90, 80, 55, 35, 50, 70, 85, 95, 65, 40, 60, 85, 75, 50, 65, 90, 80, 45, 30, 55, 70, 60, 40, 30
];

const SAMPLE_TRANSCRIPT = 'Chào bạn! Nhớ ôn tập kỹ định lý Cauchy và làm bài tập tích phân trước buổi học nhóm ngày mai nhé.';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceNoteRecordModal({ isOpen, onClose, onSave }: VoiceNoteRecordModalProps) {
  const { profile, user } = useAuth();
  const { addVoiceNote } = useStudySpace();

  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveVolume, setLiveVolume] = useState<number[]>(new Array(16).fill(15));
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [waveformResult, setWaveformResult] = useState<number[]>(SAMPLE_WAVEFORM);
  const [transcript, setTranscript] = useState('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordedPeaksRef = useRef<number[]>([]);

  const authorName = profile?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Bạn';
  const authorAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;
  const authorColor = '#16A34A';

  // Clean up all streams and audio contexts on close or unmount
  const stopAllAudioResources = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopAllAudioResources();
      setRecordState('idle');
      setRecordDuration(0);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordedBase64(null);
      setTranscript('');
      setIsPreviewPlaying(false);
      setMicError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopAllAudioResources();
    };
  }, []);

  // Start real microphone recording
  const handleStartRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ ghi âm micro');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // AudioContext & AnalyserNode for dynamic visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      recordedPeaksRef.current = [];

      // Continuous loop reading frequencies
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Map into 16 bars
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 16));
        let sum = 0;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          const normalized = Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          bars.push(normalized);
          sum += normalized;
        }
        setLiveVolume(bars);

        // Store peak average for final waveform
        const avg = Math.round(sum / 16);
        recordedPeaksRef.current.push(avg);

        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);

        // Convert to base64 for persistent storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setRecordedBase64(base64);
        };
        reader.readAsDataURL(audioBlob);

        // Process final waveform (28 bars)
        const peaks = recordedPeaksRef.current;
        if (peaks.length > 0) {
          const targetBars = 28;
          const finalBars: number[] = [];
          for (let i = 0; i < targetBars; i++) {
            const idx = Math.floor((i / targetBars) * peaks.length);
            finalBars.push(Math.max(20, Math.min(95, peaks[idx] || 35)));
          }
          setWaveformResult(finalBars);
        } else {
          setWaveformResult(SAMPLE_WAVEFORM);
        }
      };

      recorder.start(100);

      // Start Web Speech Recognition if supported
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.lang = 'vi-VN';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript;
            }
            if (fullText.trim()) {
              setTranscript(fullText.trim());
            }
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {}
      }

      setRecordState('recording');
      setRecordDuration(0);

      // Duration interval timer
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((Date.now() - startTime) / 1000);
      }, 100);

    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      setMicError('Không thể mở micro. Bạn có thể sử dụng bản ghi âm mẫu bên dưới để tạo Note ghi âm ngay lập tức!');
    }
  };

  // Stop recording and switch to review phase
  const handleStopRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    setRecordState('review');
  };

  // Load sample voice note for demo or fallback
  const handleUseSampleVoiceNote = () => {
    stopAllAudioResources();
    setRecordDuration(5.2);
    setWaveformResult(SAMPLE_WAVEFORM);
    setTranscript(SAMPLE_TRANSCRIPT);
    setRecordedUrl(null);
    setRecordedBase64(null);
    setRecordState('review');
  };

  // Review audio playback toggle
  const handleTogglePreviewPlay = () => {
    if (!recordedUrl) {
      // Simulate preview
      if (isPreviewPlaying) {
        setIsPreviewPlaying(false);
      } else {
        setIsPreviewPlaying(true);
        const start = Date.now();
        const interval = setInterval(() => {
          const elapsed = (Date.now() - start) / 1000;
          if (elapsed >= recordDuration) {
            clearInterval(interval);
            setIsPreviewPlaying(false);
            setPreviewCurrentTime(0);
          } else {
            setPreviewCurrentTime(elapsed);
          }
        }, 100);
      }
      return;
    }

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedUrl);
      previewAudioRef.current = audio;
      audio.ontimeupdate = () => setPreviewCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
      };
    }

    const audio = previewAudioRef.current;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => setIsPreviewPlaying(true)).catch(() => {});
        } else {
          setIsPreviewPlaying(true);
        }
      } catch {
        setIsPreviewPlaying(true);
      }
    }
  };

  // Final confirmation: Place voice note on the Study Desk
  const handleSaveAndPlaceOnDesk = () => {
    const finalData: VoiceNoteData = {
      audioUrl: recordedUrl || undefined,
      audioBlob: recordedBase64 || undefined,
      duration: Math.max(1, Math.round(recordDuration * 10) / 10),
      waveform: waveformResult,
      transcript: transcript.trim() || undefined,
      isTranscribed: !!transcript.trim(),
      authorName,
      authorAvatar,
      authorColor,
      createdAt: new Date().toISOString()
    };

    if (onSave) {
      onSave(finalData);
    } else {
      addVoiceNote(finalData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#0068FF] shadow-xs">
              <Mic className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Note ghi âm (Voice Note)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Ghi âm giọng nói & tạo bong bóng âm thanh trên Bàn học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Pill */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200/70 text-xs">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-4.5 h-4.5 rounded-full object-cover" />
            ) : (
              <div 
                style={{ backgroundColor: authorColor }} 
                className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              >
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-slate-700 font-semibold">{authorName}</span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Chuẩn bong bóng thoại Zalo
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center justify-center">

          {/* STATE 1: IDLE */}
          {recordState === 'idle' && (
            <div className="flex flex-col items-center text-center py-4 space-y-5 w-full">
              {/* Big Record Button */}
              <div className="relative group cursor-pointer" onClick={handleStartRecording}>
                <div className="w-24 h-24 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-all group-hover:scale-105">
                  <div className="w-18 h-18 rounded-full bg-[#0068FF] hover:bg-[#0057d9] text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95">
                    <Mic className="w-8 h-8 stroke-[2.2]" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Nhấn nút để bắt đầu ghi âm
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Ghi lại lời giảng, câu hỏi hoặc ý tưởng nhanh. Hệ thống tự động chuyển thành phụ đề văn bản.
                </p>
              </div>

              {/* Error or Fallback Sample Option */}
              {micError ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left w-full text-xs text-amber-800 space-y-2">
                  <p className="font-semibold">{micError}</p>
                  <button
                    type="button"
                    onClick={handleUseSampleVoiceNote}
                    className="w-full py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Tạo Note ghi âm mẫu ngay
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUseSampleVoiceNote}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 underline underline-offset-4 cursor-pointer pt-1"
                >
                  Hoặc sử dụng bản ghi âm mẫu
                </button>
              )}
            </div>
          )}

          {/* STATE 2: RECORDING */}
          {recordState === 'recording' && (
            <div className="flex flex-col items-center text-center py-2 space-y-5 w-full">
              {/* Animated Live Waves */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full px-4">
                {liveVolume.map((vol, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(8, Math.min(60, vol))}px` }}
                    className="w-1.5 rounded-full bg-[#0068FF] transition-all duration-75"
                  />
                ))}
              </div>

              {/* Live Timer */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-2xl font-mono font-black text-slate-900 tracking-wider">
                  {formatTime(recordDuration)}
                </span>
              </div>

              {/* Real-time transcript preview */}
              <div className="w-full min-h-[46px] p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left text-xs text-slate-700 max-h-24 overflow-y-auto no-scrollbar">
                {transcript ? (
                  <p className="font-medium text-slate-800 leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-slate-400 italic flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    Đang lắng nghe & nhận diện giọng nói...
                  </p>
                )}
              </div>

              {/* Stop & Save Action */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAllAudioResources();
                    setRecordState('idle');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Dừng & Lưu ghi âm</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: REVIEW */}
          {recordState === 'review' && (
            <div className="flex flex-col items-center py-2 space-y-4 w-full text-slate-900">
              
              {/* Preview Zalo Voice Bubble Mockup */}
              <div className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Nghe thử bản ghi</span>
                  <span className="font-mono text-slate-500">{formatTime(recordDuration)}</span>
                </div>

                {/* Pill Mockup */}
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-white rounded-[20px] border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={handleTogglePreviewPlay}
                    className="w-9 h-9 rounded-full bg-[#0068FF] hover:bg-[#0057d9] text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-transform shrink-0"
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-4 h-4 fill-white text-white stroke-[2.4]" />
                    ) : (
                      <Play className="w-4 h-4 fill-white text-white translate-x-0.5 stroke-[2.4]" />
                    )}
                  </button>

                  <div className="flex-1 flex items-center gap-[2px] h-6 py-1">
                    {waveformResult.slice(0, 24).map((h, i) => {
                      const ratio = previewCurrentTime / (recordDuration || 1);
                      const isPassed = i / 24 <= ratio && isPreviewPlaying;
                      return (
                        <div
                          key={i}
                          style={{ height: `${Math.max(4, Math.round((h / 100) * 20))}px` }}
                          className={`w-[3px] rounded-full ${
                            isPassed ? 'bg-[#0068FF]' : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Editable Transcript */}
              <div className="w-full text-left space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Văn bản chuyển đổi (Speech-to-Text):</span>
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Nhập hoặc chỉnh sửa phụ đề cho đoạn ghi âm..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAllAudioResources();
                    setRecordState('idle');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ghi âm lại</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndPlaceOnDesk}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-md shadow-green-600/25 cursor-pointer active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Đặt lên Bàn học</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
