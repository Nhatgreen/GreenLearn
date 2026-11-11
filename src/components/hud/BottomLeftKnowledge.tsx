'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudySpace } from '@/context/StudySpaceContext';
import { 
  Upload, 
  Share2,
  Copy,
  Check,
  FileText, 
  X,
  Video,
  Square,
  Mic,
  MicOff,
  Download,
  AlertCircle,
  Database,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Loader2,
  QrCode,
  RefreshCw,
  UserMinus,
  UserPlus,
  UserCheck,
  Send,
  Link2,
  Clock,
  Plus
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabase } from '@/lib/supabase';
import { parsePdfFile } from '@/services/PdfParserService';
import { useSocialPresence } from '@/hooks/useSocialPresence';
import { FriendInviteToast } from './FriendInviteToast';
import { DeskInviteNotification, SocialFriend } from '@/services/SocialFriendService';

interface PendingDocument {
  file: File;
  title: string;
  description: string;
  pages: { title?: string; text: string; image?: string }[];
  fileSize: string;
  fileType: string;
}

export function BottomLeftKnowledge() {
  const { 
    addUploadedDocument, 
    activeSpace,
    multiplayerPeers,
    isMultiplayerConnected,
    multiplayerRoomId,
    startHostingRoom,
    joinMultiplayerRoom,
    multiplayerPermission,
    setMultiplayerPermission
  } = useStudySpace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pendingDoc, setPendingDoc] = useState<PendingDocument | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomLinkExpiry, setRoomLinkExpiry] = useState<'24h' | '1h' | 'unlimited'>('24h');
  const [roomSalt, setRoomSalt] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  // Social Friends & Realtime Presence
  const {
    currentUser,
    buddies,
    incomingInvite,
    sendDeskInvite,
    addFriend,
    removeBuddy,
    declineInvite
  } = useSocialPresence(multiplayerRoomId || activeSpace.id, activeSpace.name);

  const [inviteTargetInput, setInviteTargetInput] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomCodeError, setRoomCodeError] = useState('');

  // Lắng nghe sự kiện mở modal mời từ TopLeftNav hoặc các vị trí khác
  useEffect(() => {
    const handleOpenInvite = () => {
      if (!isMultiplayerConnected) {
        startHostingRoom(activeSpace.id, multiplayerPermission);
      }
      setIsShareModalOpen(true);
    };
    window.addEventListener('greenlearn:open-invite-modal', handleOpenInvite);
    return () => window.removeEventListener('greenlearn:open-invite-modal', handleOpenInvite);
  }, [isMultiplayerConnected, activeSpace.id, multiplayerPermission, startHostingRoom]);

  // Esc listener for ShareModal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isShareModalOpen) {
        setIsShareModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareModalOpen]);

  // ================= SUPABASE DATABASE & MULTIPLAYER STATE =================
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [dbSavedNotice, setDbSavedNotice] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  const [supabaseConfigState, setSupabaseConfigState] = useState({ isConfigured: false, url: '', anonKey: '' });

  useEffect(() => {
    if (isShareModalOpen) {
      const cfg = getSupabaseConfig();
      setSupabaseConfigState(cfg);
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
      setDbTestResult({ status: 'idle' });
    }
  }, [isShareModalOpen]);

  const handleTestDatabase = async () => {
    const url = supabaseUrlInput.trim();
    const key = supabaseKeyInput.trim();
    if (!url || !key) {
      setDbTestResult({ status: 'error', message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key.' });
      return;
    }
    setDbTestResult({ status: 'testing' });
    try {
      const startTime = performance.now();
      const res = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      const duration = Math.round(performance.now() - startTime);
      if (res.ok || res.status === 200) {
        setDbTestResult({ status: 'success', message: `Kết nối thành công! Phản hồi sau ${duration}ms.` });
      } else {
        setDbTestResult({ status: 'error', message: `Supabase trả về mã lỗi ${res.status}: ${res.statusText}` });
      }
    } catch (err: any) {
      setDbTestResult({ status: 'error', message: `Lỗi kết nối mạng: ${err.message}` });
    }
  };

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setDbSavedNotice(true);
    setSupabaseConfigState(getSupabaseConfig());
    setTimeout(() => {
      setDbSavedNotice(false);
      setIsDbConfigOpen(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 800);
  };

  const handleClearDb = () => {
    clearSupabaseConfig();
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseConfigState(getSupabaseConfig());
    setDbTestResult({ status: 'idle' });
  };

  // ================= SCREEN & MIC RECORDING STATE =================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<string>('');
  const [recordError, setRecordError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeMicStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount and listen for external record triggers (e.g. from LeftCreationBar)
  useEffect(() => {
    const handleOpenRecord = () => {
      setIsSetupModalOpen(true);
    };
    window.addEventListener('vitudy:open-record-modal', handleOpenRecord);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('vitudy:open-record-modal', handleOpenRecord);
    };
  }, []);

  // Format seconds to mm:ss
  const formatRecordingTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setRecordError(null);
    setIsSetupModalOpen(false);

    try {
      // 1. Capture screen with display audio if available
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true
      });

      let combinedStream = displayStream;

      // 2. Mix microphone audio if requested
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          activeMicStreamRef.current = micStream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioCtxRef.current = audioCtx;
            const dest = audioCtx.createMediaStreamDestination();

            if (displayStream.getAudioTracks().length > 0) {
              audioCtx.createMediaStreamSource(displayStream).connect(dest);
            }
            if (micStream.getAudioTracks().length > 0) {
              audioCtx.createMediaStreamSource(micStream).connect(dest);
            }

            combinedStream = new MediaStream([
              ...displayStream.getVideoTracks(),
              ...dest.stream.getAudioTracks()
            ]);
          }
        } catch (micErr) {
          console.warn('Không thể truy cập microphone, tiếp tục ghi màn hình:', micErr);
        }
      }

      activeStreamRef.current = displayStream;
      chunksRef.current = [];

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = mimeType ? new MediaRecorder(combinedStream, { mimeType }) : new MediaRecorder(combinedStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
        setRecordedBlobSize(blob.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(blob.size / 1024)} KB`);
        setIsFinishModalOpen(true);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Native stop share button listener
      displayStream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

      recorder.start(1000); // 1s slice
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setRecordError(err.message || 'Không thể bắt đầu ghi hình.');
        setIsSetupModalOpen(true);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // Stop all media tracks to turn off recording indicator
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
    if (activeMicStreamRef.current) {
      activeMicStreamRef.current.getTracks().forEach(t => t.stop());
      activeMicStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleDownloadVideo = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `ViTudy_Video_${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle native file input selection (Real PDF & document extraction)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const isText = file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt');

    let parsedPages: { title?: string; text: string; image?: string }[] = [];
    setIsParsingDoc(true);

    try {
      if (isPdf) {
        parsedPages = await parsePdfFile(file);
      } else if (isImage) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        parsedPages = [{
          title: rawName,
          text: '',
          image: dataUrl
        }];
      } else if (isText) {
        const content = await file.text();
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        parsedPages = paragraphs.length > 0
          ? paragraphs.map((p, idx) => ({ title: `Trang ${idx + 1}`, text: p.trim() }))
          : [{ title: rawName, text: content.trim() }];
      } else {
        try {
          const content = await file.text();
          parsedPages = [{ title: rawName, text: content.trim() }];
        } catch {
          parsedPages = [{ title: rawName, text: `Tệp ${file.name}` }];
        }
      }

      setPendingDoc({
        file,
        title: rawName,
        description: '',
        pages: parsedPages,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'TỆP'
      });

      setIsConfirmModalOpen(true);
    } catch (err) {
      console.error('Lỗi nạp tệp:', err);
      alert('Không thể trích xuất nội dung tệp. Vui lòng thử lại với file PDF hoặc hình ảnh khác.');
    } finally {
      setIsParsingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDoc) return;

    const pages = pendingDoc.pages.map(p => ({
      ...p,
      title: p.title || pendingDoc.title
    }));

    addUploadedDocument(pendingDoc.title, pages);
    setIsConfirmModalOpen(false);
    setPendingDoc(null);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="relative flex items-center gap-2 pointer-events-auto select-none font-sans">
      {/* Hidden Native File Explorer Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.epub,image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* 1. Button: Tải lên tài liệu (Hài hòa với thanh dock) */}
      <button
        data-tour="upload-btn"
        disabled={isParsingDoc}
        onClick={() => fileInputRef.current?.click()}
        title={isParsingDoc ? "Đang trích xuất tài liệu..." : "Tải lên tài liệu (PDF, Word, Text, Ảnh...)"}
        className="w-10 h-10 rounded-xl bg-white hover:bg-green-50/80 text-[#16A34A] shadow-sm border border-slate-300 hover:border-green-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer group disabled:opacity-75 disabled:cursor-wait"
      >
        {isParsingDoc ? (
          <Loader2 className="w-4.5 h-4.5 text-[#16A34A] animate-spin" />
        ) : (
          <Upload className="w-4.5 h-4.5 text-[#16A34A] stroke-[2.4] group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Parsing PDF Indicator Toast */}
      {isParsingDoc && mounted && createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-white text-slate-800 px-4 py-2.5 rounded-full shadow-xl border border-green-200 flex items-center gap-2.5 font-sans text-xs font-semibold animate-pulse">
          <Loader2 className="w-4 h-4 text-[#16A34A] animate-spin flex-shrink-0" />
          <span>Đang trích xuất các trang tài liệu PDF...</span>
        </div>,
        document.body
      )}

      {/* 2. Chỉ hiện khi đang ghi hình buổi học (Kích hoạt từ menu dấu + ở thanh công cụ trái) */}
      {isRecording && (
        <div className="flex items-center gap-2 bg-white/95 border border-red-300 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs font-mono font-bold text-red-600 select-none">
            {formatRecordingTime(recordingSeconds)}
          </span>
          <button
            onClick={handleStopRecording}
            title="Dừng ghi hình"
            className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer ml-0.5 active:scale-95"
          >
            <Square className="w-3 h-3 fill-white stroke-none" />
          </button>
        </div>
      )}

      {/* 3. Button: Mời bạn bè & Supabase (Có đèn tín hiệu trạng thái) */}
      <button
        onClick={() => {
          if (!isMultiplayerConnected) {
            startHostingRoom(activeSpace.id, multiplayerPermission);
          }
          setIsShareModalOpen(true);
        }}
        title="Mời bạn cùng học (Multiplayer Realtime)"
        className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-800 shadow-sm border border-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer group relative"
      >
        <Share2 className="w-4.5 h-4.5 text-slate-800 stroke-[2.4] group-hover:scale-110 transition-transform" />
        {isMultiplayerConnected ? (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
        ) : supabaseConfigState.isConfigured ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-1 ring-white" />
        ) : null}
      </button>

      {/* MODAL 1: Cài đặt & Bắt đầu ghi hình */}
      {isSetupModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
            <button
              onClick={() => setIsSetupModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900">
                <Video className="w-4 h-4 text-slate-900 stroke-[2.4]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Ghi hình buổi học</h3>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Ghi lại video màn hình học tập và tương tác trên bàn học để xem lại bài giảng hoặc tải về lưu trữ.
            </p>

            {recordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{recordError}</span>
              </div>
            )}

            {/* Toggle Mic Option */}
            <div 
              onClick={() => setIncludeMic(!includeMic)}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors mb-4"
            >
              <div className="flex items-center gap-2.5">
                {includeMic ? (
                  <Mic className="w-4 h-4 text-[#16A34A] stroke-[2.4]" />
                ) : (
                  <MicOff className="w-4 h-4 text-slate-400 stroke-[2.4]" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">Thu âm Micro</div>
                  <div className="text-[11px] text-slate-500">
                    {includeMic ? 'Đang bật ghi âm giọng nói' : 'Chỉ ghi hình, tắt micro'}
                  </div>
                </div>
              </div>

              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${includeMic ? 'bg-[#16A34A]' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeMic ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStartRecording}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-white stroke-[2.4]" />
                <span>Bắt đầu ghi hình</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Xem lại & Tải video đã ghi về máy */}
      {isFinishModalOpen && recordedBlobUrl && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
            <button
              onClick={() => setIsFinishModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-900 stroke-[2.4]" />
                <h3 className="text-sm font-bold text-slate-900">Bản ghi buổi học hoàn tất</h3>
              </div>
              <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg mr-6">
                {formatRecordingTime(recordingSeconds)} • {recordedBlobSize}
              </div>
            </div>

            {/* Video Preview */}
            <div className="bg-black rounded-xl overflow-hidden mb-4 border border-slate-200">
              <video 
                src={recordedBlobUrl} 
                controls 
                autoPlay 
                className="w-full max-h-72 object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Định dạng chuẩn WebM độ phân giải cao
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFinishModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-white stroke-[2.4]" />
                  <span>Tải video về máy</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Đặt tên và viết mô tả ngắn cho tệp vừa chọn */}
      {isConfirmModalOpen && pendingDoc && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
            <button
              onClick={() => {
                setIsConfirmModalOpen(false);
                setPendingDoc(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-800" />
              <h3 className="text-sm font-bold text-slate-900">Thêm tài liệu vào bàn học</h3>
            </div>

            {/* Selected File Info Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4 text-xs flex items-center justify-between text-slate-600">
              <span className="font-medium truncate mr-2">{pendingDoc.file.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="bg-green-50 text-[#16A34A] border border-green-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                  {pendingDoc.pages.length} trang
                </span>
                <span className="font-mono text-[11px] text-slate-400">{pendingDoc.fileSize}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmUpload} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Tên tài liệu</label>
                <input
                  type="text"
                  required
                  value={pendingDoc.title}
                  onChange={(e) => setPendingDoc({ ...pendingDoc, title: e.target.value })}
                  placeholder="Nhập tên tài liệu hiển thị..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Mô tả ngắn <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  rows={3}
                  value={pendingDoc.description}
                  onChange={(e) => setPendingDoc({ ...pendingDoc, description: e.target.value })}
                  placeholder="Ghi chú tóm tắt nội dung tài liệu..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 outline-none focus:border-slate-800 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setPendingDoc(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#16A34A] hover:bg-[#15803D] text-white transition-colors shadow-sm cursor-pointer"
                >
                  Đặt lên bàn học
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Phòng học nhóm, Chia sẻ & Cấu hình Supabase Realtime */}
      {isShareModalOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareModalOpen(false);
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans flex flex-col max-h-[90vh]"
          >
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
                <Users className="w-4.5 h-4.5 stroke-[2.4]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Mời bạn cùng học</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
              Mời bạn bè cùng vào bàn học để thảo luận, giải đề thi và đối chiếu tài liệu trực tiếp theo thời gian thực.
            </p>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* 1. Mời trực tiếp qua mạng */}
              <div className="mb-4 p-3 bg-green-50/40 border border-green-200 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Mời bạn học trực tiếp</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500">
                    Tên của bạn: <b className="text-slate-800">{currentUser.name}</b>
                  </span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteTargetInput.trim()) return;
                    const targetRoom = multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id);
                    if (!isMultiplayerConnected) {
                      startHostingRoom(targetRoom, multiplayerPermission);
                    }
                    const res = sendDeskInvite(inviteTargetInput.trim(), targetRoom);
                    setInviteMsg({ text: res.msg, isError: !res.ok });
                    if (res.ok) setInviteTargetInput('');
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc email bạn học cần mời..."
                    value={inviteTargetInput}
                    onChange={(e) => {
                      setInviteTargetInput(e.target.value);
                      if (inviteMsg) setInviteMsg(null);
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-[#16A34A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!inviteTargetInput.trim()) return;
                      const res = addFriend(inviteTargetInput.trim());
                      setInviteMsg({ text: res.msg, isError: !res.ok });
                      if (res.ok) setInviteTargetInput('');
                    }}
                    title="Lưu vào danh sách bạn bè mà không gửi ngay (+)"
                    className="px-2.5 py-1.5 bg-white hover:bg-green-50 text-[#16A34A] border border-green-300 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>Lưu bạn</span>
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mời ngay</span>
                  </button>
                </form>
                {inviteMsg && (
                  <div className={`mt-2 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl ${
                    inviteMsg.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-emerald-700 border border-green-200'
                  }`}>
                    {inviteMsg.text}
                  </div>
                )}

                {/* Danh sách đã mời gần đây */}
                {buddies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-green-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10.5px] font-bold text-slate-600 block">
                        Đã mời gần đây (Mời lại nhanh):
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        {buddies.length} bạn
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {buddies.slice(0, 5).map((b) => (
                        <div
                          key={b.id}
                          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl text-xs shadow-2xs hover:border-green-300 transition-colors"
                        >
                          <span 
                            className={`w-2 h-2 rounded-full ${b.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} 
                            title={b.online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                          />
                          <span className="font-semibold text-slate-800 text-[11.5px] max-w-[120px] truncate">{b.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetRoom = multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id);
                              if (!isMultiplayerConnected) {
                                startHostingRoom(targetRoom, multiplayerPermission);
                              }
                              const res = sendDeskInvite(b, targetRoom);
                              setInviteMsg({ text: res.msg, isError: !res.ok });
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-green-50 hover:bg-green-100 text-[#16A34A] text-[10px] font-bold transition-colors cursor-pointer"
                            title="Gửi lại lời mời"
                          >
                            Mời lại
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBuddy(b.id)}
                            className="text-slate-400 hover:text-slate-600 ml-0.5"
                            title="Xóa khỏi danh sách gần đây"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Chia sẻ liên kết phòng */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Hoặc sao chép liên kết phòng học
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newSalt = Math.random().toString(36).substring(2, 8);
                      const newRoom = `${activeSpace.id}-${newSalt}`;
                      setRoomSalt(newSalt);
                      startHostingRoom(newRoom, multiplayerPermission);
                      setCopiedLink(false);
                    }}
                    className="text-[11px] font-bold text-[#16A34A] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Tạo mã liên kết mới để thu hồi liên kết cũ"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tạo mã mới</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:border-[#16A34A] focus-within:bg-white transition-colors">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}${window.location.pathname}?room=${multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id)}&perm=${multiplayerPermission}`
                        : 'https://nhatgreen.github.io/GreenLearn/'
                    }
                    className="bg-transparent text-xs text-slate-800 flex-1 outline-none font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = `${window.location.origin}${window.location.pathname}?room=${multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id)}&perm=${multiplayerPermission}`;
                        navigator.clipboard.writeText(url);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }
                    }}
                    aria-label="Sao chép liên kết phòng học"
                    className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã sao chép' : 'Sao chép link'}</span>
                  </button>
                </div>

                {/* Quick Share Buttons */}
                <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Chia sẻ qua:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?room=${multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id)}&perm=${multiplayerPermission}` : '';
                        window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                    >
                      Zalo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?room=${multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id)}&perm=${multiplayerPermission}` : '';
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors cursor-pointer"
                    >
                      Messenger
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Mã QR</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <select
                      value={roomLinkExpiry}
                      onChange={(e) => setRoomLinkExpiry(e.target.value as any)}
                      className="bg-transparent border-0 text-[11px] font-semibold text-slate-700 cursor-pointer outline-none"
                      aria-label="Thời hạn liên kết"
                    >
                      <option value="24h">Hạn 24 giờ</option>
                      <option value="1h">Hạn 1 giờ</option>
                      <option value="unlimited">Không giới hạn</option>
                    </select>
                  </div>
                </div>

                {/* QR Code Popup preview */}
                {showQrCode && (
                  <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center animate-fade-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?room=${multiplayerRoomId || (roomSalt ? `${activeSpace.id}-${roomSalt}` : activeSpace.id)}&perm=${multiplayerPermission}` : ''
                      )}`}
                      alt="Mã QR phòng học"
                      className="w-32 h-32 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs"
                    />
                    <span className="text-[10.5px] text-slate-600 font-medium mt-1.5">Quét mã bằng điện thoại để vào bàn học</span>
                  </div>
                )}
              </div>

              {/* 3. Phân quyền tham gia */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Quyền của bạn học tham gia
                </span>
                <div 
                  role="radiogroup"
                  aria-label="Quyền của bạn học tham gia"
                  className="grid grid-cols-2 gap-2 text-xs"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={multiplayerPermission === 'view_only'}
                    onClick={() => setMultiplayerPermission('view_only')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      multiplayerPermission === 'view_only'
                        ? 'border-[#16A34A] bg-green-50/60 text-slate-900 font-bold shadow-2xs ring-1 ring-[#16A34A]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">Chỉ xem</div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5 leading-snug">Chỉ xem bàn học và con trỏ chuột</div>
                    </div>
                    {multiplayerPermission === 'view_only' && (
                      <div className="w-3.5 h-3.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={multiplayerPermission === 'edit'}
                    onClick={() => setMultiplayerPermission('edit')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      multiplayerPermission === 'edit'
                        ? 'border-[#16A34A] bg-green-50/60 text-slate-900 font-bold shadow-2xs ring-1 ring-[#16A34A]'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">Cùng chỉnh sửa</div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5 leading-snug">Cùng viết note, vẽ sơ đồ và giải đề</div>
                    </div>
                    {multiplayerPermission === 'edit' && (
                      <div className="w-3.5 h-3.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* 4. Vào nhanh bằng mã phòng (Quick Join Box) */}
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Vào nhanh bằng mã phòng (Room ID)
                </span>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = roomCodeInput.trim();
                    if (!code) {
                      setRoomCodeError('Vui lòng nhập mã phòng');
                      return;
                    }
                    setRoomCodeError('');
                    joinMultiplayerRoom(code);
                    setIsShareModalOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Nhập mã phòng (ví dụ: demo-space-1)..."
                    value={roomCodeInput}
                    onChange={(e) => {
                      setRoomCodeInput(e.target.value);
                      if (roomCodeError) setRoomCodeError('');
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono outline-none focus:border-[#16A34A]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    Vào phòng
                  </button>
                </form>
                {roomCodeError && (
                  <p className="text-[10.5px] text-red-500 mt-1 font-medium">{roomCodeError}</p>
                )}
              </div>

              {/* 5. Người đang cùng học trong phòng */}
              <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-800">Người trong phòng</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    {multiplayerPeers.length + 1} đang online
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isMultiplayerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="font-bold text-slate-800">Bạn (Chủ phòng)</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {isMultiplayerConnected ? 'Trực tuyến' : 'Đang kết nối...'}
                    </span>
                  </div>

                  {multiplayerPeers.map((peer) => (
                    <div key={peer.id} className="flex items-center justify-between text-slate-700 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: peer.avatarColor }} />
                        <span className="font-semibold text-slate-800">{peer.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">
                          {peer.role === 'owner' ? 'Chủ phòng' : peer.role === 'editor' ? 'Chỉnh sửa' : 'Chỉ xem'}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-medium">Đang học cùng</span>
                    </div>
                  ))}

                  {multiplayerPeers.length === 0 && (
                    <div className="text-[11px] text-slate-500 font-medium italic pt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Đang đợi bạn học truy cập liên kết phòng...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Advanced Supabase Settings */}
              <div className="pt-2 border-t border-slate-100 mb-3">
                {!isDbConfigOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsDbConfigOpen(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    + Cài đặt kết nối máy chủ nâng cao
                  </button>
                ) : (
                  <form onSubmit={handleSaveDb} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs animate-fade-in mt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Cấu hình máy chủ Realtime</span>
                      <button
                        type="button"
                        onClick={() => setIsDbConfigOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Ẩn
                      </button>
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Project URL</label>
                      <input
                        type="url"
                        required
                        value={supabaseUrlInput}
                        onChange={(e) => setSupabaseUrlInput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Anon Key</label>
                      <input
                        type="text"
                        required
                        value={supabaseKeyInput}
                        onChange={(e) => setSupabaseKeyInput(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestDatabase}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-300 rounded-lg text-slate-700"
                      >
                        Thử kết nối
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Interactive Live Toast for Received Study Invitations */}
      <FriendInviteToast
        invite={incomingInvite}
        onAccept={(inv) => {
          joinMultiplayerRoom(inv.roomId);
          declineInvite();
          setIsShareModalOpen(false);
        }}
        onDecline={declineInvite}
      />
    </div>
  );
}
