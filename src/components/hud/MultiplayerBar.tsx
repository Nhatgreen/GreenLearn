'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudySpace } from '@/context/StudySpaceContext';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '@/lib/supabase';
import { getShareRoomUrl } from '@/lib/assets';
import { MultiplayerCursorsLayer } from '../canvas/MultiplayerCursorsLayer';
import { 
  Users, 
  Copy, 
  Check, 
  X, 
  UserPlus, 
  LogOut, 
  Database, 
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle
} from 'lucide-react';

export function MultiplayerBar() {
  const { 
    activeSpace, 
    transform, 
    setTransform, 
    multiplayerPeers, 
    isMultiplayerConnected, 
    isMultiplayerHost, 
    multiplayerRoomId, 
    multiplayerPermission, 
    leaveMultiplayerRoom, 
    isFollowPresenter, 
    setIsFollowPresenter,
    isMicOn,
    isMuted,
    isSpeaking,
    speakingPeers,
    peerAudioVolumes,
    setPeerAudioVolume,
    toggleMic,
    toggleMute,
    micError
  } = useStudySpace();

  const [mounted, setMounted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Supabase input fields
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [dbSavedNotice, setDbSavedNotice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isShareModalOpen) setIsShareModalOpen(false);
        if (isDbConfigOpen) setIsDbConfigOpen(false);
      }

      // Quick Mute/Unmute hotkey 'M' (when not inside inputs)
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleMute();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareModalOpen, isDbConfigOpen, toggleMute]);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
  }, [isDbConfigOpen]);

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = getShareRoomUrl(multiplayerRoomId || activeSpace.id, multiplayerPermission || 'edit');
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveDb = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    setDbSavedNotice(true);
    setTimeout(() => {
      setDbSavedNotice(false);
      setIsDbConfigOpen(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1000);
  };

  const toggleSyncViewport = () => {
    if (!isFollowPresenter) {
      const targetItem = activeSpace.items.find(i => i.type === 'book') || activeSpace.items[0];
      if (targetItem && typeof window !== 'undefined') {
        const itemW = targetItem.type === 'book' ? 980 : 400;
        const itemH = targetItem.type === 'book' ? 640 : 500;
        const targetScale = 0.95;
        const targetX = Math.round(window.innerWidth / 2 - (targetItem.x + itemW / 2) * targetScale);
        const targetY = Math.round(window.innerHeight / 2 - (targetItem.y + itemH / 2) * targetScale);
        setTransform({ x: targetX, y: targetY, scale: targetScale });
      }
      setIsFollowPresenter(true);
    } else {
      setIsFollowPresenter(false);
    }
  };

  const hasRoomQuery = typeof window !== 'undefined' && window.location.search.includes('room=');
  const showBar = !isDismissed && isMultiplayerConnected && (multiplayerPeers.length > 0 || hasRoomQuery);

  return (
    <>
      {/* Bottom Center: Multiplayer Bar (Chỉ hiển thị khi có phòng học nhóm hoặc bạn bè đang online) */}
      {showBar && (
        <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 pointer-events-auto select-none">
          <div className="flex items-center gap-2 bg-white/95 border border-slate-300 rounded-full px-3 py-1.5 shadow-sm backdrop-blur-md animate-fade-in text-slate-900">
            {/* Host Tag & Live Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold pr-2 border-r border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isMultiplayerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <Users className="w-3.5 h-3.5 text-slate-700" />
              <span>{isMultiplayerHost ? 'Chủ phòng: Bạn' : 'Phòng học nhóm'}</span>
            </div>

            {/* Peer Avatars with Discord Speaking Glow & Mute Indicators */}
            {multiplayerPeers.length > 0 && (
              <div className="flex items-center -space-x-1.5 pr-2 border-r border-slate-200">
                {multiplayerPeers.map(p => {
                  const isPeerSpeaking = speakingPeers[p.id] || p.isSpeaking;
                  return (
                    <div
                      key={p.id}
                      title={`${p.name} (${p.role === 'owner' ? 'Chủ phòng' : p.role === 'editor' ? 'Người chỉnh sửa' : 'Người xem'}) - ${p.status}${isPeerSpeaking ? ' • Đang nói 🎤' : p.isMuted ? ' • Đã tắt mic' : ''}`}
                      style={{ backgroundColor: p.avatarColor }}
                      className={`relative w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white shadow-2xs cursor-pointer hover:scale-110 transition-transform ${
                        isPeerSpeaking ? 'ring-2 ring-[#16A34A] ring-offset-1 shadow-sm shadow-green-500/50 scale-105' : ''
                      }`}
                    >
                      {p.name.charAt(0)}
                      {p.isMuted && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white flex items-center justify-center" title="Đã tắt mic">
                          <span className="w-1 h-0.5 bg-white rounded-full" />
                        </span>
                      )}
                      {isPeerSpeaking && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#16A34A] rounded-full border border-white animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Discord-like Voice Chat Button */}
            <button
              type="button"
              onClick={isMicOn ? toggleMute : toggleMic}
              title={
                !isMicOn 
                  ? 'Bật Micro nói chuyện trong phòng (Phím M)' 
                  : isMuted 
                  ? 'Đang tắt tiếng (Bấm để bật lại mic hoặc nhấn phím M)' 
                  : 'Micro đang bật (Bấm để tắt tiếng hoặc nhấn phím M)'
              }
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 touch-target ${
                !isMicOn
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : isMuted
                  ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                  : `bg-[#16A34A] text-white hover:bg-[#15803D] shadow-xs ${isSpeaking ? 'ring-2 ring-green-400 ring-offset-1 animate-pulse' : ''}`
              }`}
            >
              {!isMicOn ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline text-[11px]">Bật Mic</span>
                </>
              ) : isMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline text-[11px]">Đã tắt mic</span>
                </>
              ) : (
                <>
                  <Mic className={`w-3.5 h-3.5 text-white ${isSpeaking ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline text-[11px]">{isSpeaking ? 'Đang nói...' : 'Đang bật mic'}</span>
                </>
              )}
            </button>

            {/* Follow Presenter Mode (Functional Synced Viewport) */}
            <button
              onClick={toggleSyncViewport}
              title="Đồng bộ góc nhìn: Camera tự động bay tới và theo sát góc nhìn người thuyết trình"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                isFollowPresenter 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFollowPresenter ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[11px] font-semibold">{isFollowPresenter ? 'Đang đồng bộ' : 'Đồng bộ góc nhìn'}</span>
            </button>

            <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />

            {/* Add More Peers */}
            <button
              title="Mời thêm bạn bè hoặc cấu hình Supabase"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-black px-2 py-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Mời thêm</span>
            </button>

            {/* Leave / Return to Solo */}
            <button
              title="Về chế độ học cá nhân"
              onClick={() => {
                leaveMultiplayerRoom();
                setIsDismissed(true);
              }}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Presenter Sync Notification Banner */}
      {isFollowPresenter && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 bg-white/95 text-slate-800 px-4 py-2 rounded-full shadow-xl flex items-center gap-3 text-xs font-medium backdrop-blur-md border border-slate-200 animate-fade-in pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Đang đồng bộ góc nhìn theo người thuyết trình</span>
          <button
            onClick={() => setIsFollowPresenter(false)}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-300 transition-colors cursor-pointer"
          >
            Dừng theo dõi
          </button>
        </div>
      )}

      {/* MODAL 1: Mời bạn bè cùng học & Quản lý kết nối Supabase */}
      {isShareModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
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
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Chia sẻ liên kết để bạn bè cùng tham gia học nhóm, đồng bộ camera và tương tác thời gian thực trên bàn học.
            </p>

            {/* Mic Error Banner if any */}
            {micError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{micError}</span>
              </div>
            )}

            {/* Room Link Input Box */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Liên kết phòng học
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:border-[#16A34A] focus-within:bg-white transition-colors">
                <input
                  type="text"
                  readOnly
                  value={getShareRoomUrl(multiplayerRoomId || activeSpace.id, multiplayerPermission || 'edit')}
                  className="bg-transparent text-xs text-slate-800 flex-1 outline-none font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Members in Room & Voice Audio Controls */}
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-800">Bạn học & Âm thanh đàm thoại</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {multiplayerPeers.length + 1} đang kết nối
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Local user */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-900">Bạn ({isMultiplayerHost ? 'Chủ bàn học' : 'Người học'})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isMicOn ? (
                      isMuted ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <MicOff className="w-3 h-3" /> Đã tắt mic
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Mic className="w-3 h-3" /> {isSpeaking ? 'Đang nói 🎤' : 'Đang bật mic'}
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Mic chưa bật</span>
                    )}
                  </div>
                </div>

                {/* Remote peers */}
                {multiplayerPeers.map((peer) => {
                  const peerVol = peerAudioVolumes[peer.id] !== undefined ? peerAudioVolumes[peer.id] : 1.0;
                  const isPeerSpeaking = speakingPeers[peer.id] || peer.isSpeaking;

                  return (
                    <div key={peer.id} className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: peer.avatarColor || '#3b82f6' }} />
                          <span className="font-medium text-slate-800">{peer.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          {isPeerSpeaking ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Mic className="w-3 h-3 animate-bounce" /> Đang nói
                            </span>
                          ) : peer.isMuted ? (
                            <span className="text-rose-500 font-medium flex items-center gap-1">
                              <MicOff className="w-3 h-3" /> Đã tắt mic
                            </span>
                          ) : (
                            <span className="text-slate-400">Trực tuyến</span>
                          )}
                        </div>
                      </div>

                      {/* Peer Audio Volume Slider */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                        {peerVol === 0 ? (
                          <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className="text-[10px] font-medium text-slate-500 shrink-0">Âm lượng</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={peerVol}
                          onChange={(e) => setPeerAudioVolume(peer.id, parseFloat(e.target.value))}
                          className="w-full accent-[#16A34A] h-1 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-[10px] w-7 text-right shrink-0">{Math.round(peerVol * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hotkey hint */}
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Mẹo: Nhấn phím <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-700 font-mono font-bold">M</kbd> để Bật / Tắt mic tức thì</span>
              </div>
            </div>

            {/* Advanced Settings Link */}
            <div className="pt-2 border-t border-slate-100 mb-3">
              <button
                type="button"
                onClick={() => setIsDbConfigOpen(true)}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                + Cài đặt kết nối máy chủ nâng cao
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Cấu hình Supabase Database & Realtime */}
      {isDbConfigOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans">
            <button
              onClick={() => setIsDbConfigOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Database className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kết Nối Cơ Sở Dữ Liệu Supabase</h3>
                <p className="text-[11px] text-slate-500">PostgreSQL + Realtime Channels + pgvector</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Nhập thông tin kết nối từ Supabase Dashboard của bạn (Settings &gt; API). Hệ thống sẽ lưu an toàn trong trình duyệt và kích hoạt tính năng đồng bộ nhiều người chơi ngay lập tức.
            </p>

            <form onSubmit={handleSaveDb} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project URL (NEXT_PUBLIC_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#16A34A] focus:bg-white text-slate-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#16A34A] focus:bg-white text-slate-900 font-mono"
                  required
                />
              </div>

              {dbSavedNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Đã lưu thành công! Đang tải lại kết nối Realtime...</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearSupabaseConfig();
                    setSupabaseUrlInput('');
                    setSupabaseKeyInput('');
                    alert('Đã xóa cấu hình Supabase cục bộ.');
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Xóa cấu hình
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDbConfigOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu & Kết Nối Ngay
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Cursors Overlay for Multiplayer */}
      {mounted && createPortal(
        <MultiplayerCursorsLayer peers={multiplayerPeers} transform={transform} />,
        document.body
      )}
    </>
  );
}
