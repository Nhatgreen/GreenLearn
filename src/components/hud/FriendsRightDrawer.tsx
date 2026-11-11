'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Share2, 
  Check, 
  Send, 
  LogIn, 
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useSocialPresence } from '@/hooks/useSocialPresence';
import { useStudySpace } from '@/context/StudySpaceContext';
import { SocialFriendService } from '@/services/SocialFriendService';

interface FriendsRightDrawerProps {
  isFocusMode?: boolean;
}

export function FriendsRightDrawer({ isFocusMode = false }: FriendsRightDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [nameOrEmailInput, setNameOrEmailInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    spaces,
    activeSpace,
    multiplayerRoomId,
    isMultiplayerConnected,
    startHostingRoom,
    joinMultiplayerRoom,
    multiplayerPermission
  } = useStudySpace();

  const {
    currentUser,
    buddies,
    onlineCount,
    sendDeskInvite,
    addFriend,
    removeFriend,
    requestJoinRoom
  } = useSocialPresence(multiplayerRoomId || activeSpace?.id, activeSpace?.name);

  const activeRoomId = multiplayerRoomId || activeSpace?.id;

  // Xử lý thêm bạn bè nhanh bằng dấu +
  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameOrEmailInput.trim();
    if (!clean) return;

    const res = addFriend(clean);
    setFeedback({ text: res.msg, isError: !res.ok });
    if (res.ok) {
      setNameOrEmailInput('');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Mời bạn vào bàn học hiện tại
  const handleInviteFriend = (friendNameOrBuddy: any) => {
    const targetRoom = activeRoomId || activeSpace?.id || `space-${Date.now()}`;
    if (!isMultiplayerConnected) {
      startHostingRoom(targetRoom, multiplayerPermission);
    }
    const res = sendDeskInvite(friendNameOrBuddy, targetRoom);
    setFeedback({ text: res.msg, isError: !res.ok });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Xin phép chủ phòng vào học cùng (Host Approval)
  const handleJoinFriendRoom = (buddy: any) => {
    if (!buddy?.currentRoom) return;
    requestJoinRoom(buddy.currentRoom, buddy);
  };

  // Sao chép liên kết phòng bàn học
  const handleCopyDeskLink = () => {
    if (typeof window === 'undefined') return;
    const targetRoom = activeRoomId || activeSpace?.id || 'demo';
    if (!isMultiplayerConnected) {
      startHostingRoom(targetRoom, multiplayerPermission);
    }
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?space=${encodeURIComponent(activeSpace?.id || '')}&room=${encodeURIComponent(targetRoom)}&perm=${multiplayerPermission}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Lọc danh sách bạn bè
  const filteredBuddies = useMemo(() => {
    return buddies.filter((b) => {
      if (filterMode === 'online' && !b.online) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.email && b.email.toLowerCase().includes(q))
      );
    });
  }, [buddies, filterMode, searchQuery]);

  // Nếu đang ở chế độ Focus và drawer đang mở, tự động đóng để không gây phân tâm
  if (isFocusMode && isOpen) {
    // Cho phép người dùng chủ động mở lại nếu muốn
  }

  return (
    <>
      {/* 1. NÚT KÉO / THẺ TAB ẨN PHẢI (COLLAPSED TRIGGER TAB) */}
      {!isOpen && (
        <div className="fixed right-1 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title={`Bạn bè & Trạng thái trực tuyến (${onlineCount} bạn online) — Bấm để mở`}
            className="flex flex-col items-center justify-center py-3 px-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-[#16A34A] border border-slate-300 rounded-l-2xl shadow-lg transition-all active:scale-95 cursor-pointer group hover:border-[#16A34A]"
          >
            <div className="relative flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-slate-800 group-hover:text-[#16A34A] stroke-[2.2] transition-colors" />
              {onlineCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-2 ring-white animate-pulse" />
              )}
            </div>

            {onlineCount > 0 ? (
              <span className="mt-1.5 px-1 py-0.2 rounded-full bg-emerald-100 text-[#166534] text-[9.5px] font-bold">
                {onlineCount}
              </span>
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#16A34A] mt-1.5 transition-colors" />
            )}
          </button>
        </div>
      )}

      {/* 2. THANH BÊN PHẢI ĐÃ MỞ (EXPANDED FRIENDS DRAWER) */}
      {isOpen && (
        <div className="fixed right-1 top-1/2 -translate-y-1/2 z-40 pointer-events-auto w-80 max-w-[calc(100vw-16px)] max-h-[85vh] bg-white/98 backdrop-blur-md rounded-2xl border border-slate-300 shadow-2xl p-4 flex flex-col font-sans select-none animate-fade-in">
          {/* HEADER */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
                <Users className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                  <span>Bạn bè & Bạn học</span>
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  <span className="text-[#166534] font-semibold">{onlineCount} trực tuyến</span> · {buddies.length} bạn bè
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Nút dấu cộng (+) để lưu kết bạn nhanh */}
              <button
                type="button"
                onClick={() => setIsAddingFriend(prev => !prev)}
                title={isAddingFriend ? "Đóng ô thêm bạn" : "Thêm và lưu bạn bè mới (+)"}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isAddingFriend
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-green-50 hover:bg-green-100 text-[#16A34A] border border-green-200'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.4]" />
              </button>

              {/* Nút thu gọn drawer về mép phải */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu gọn thanh bạn bè"
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Ô NHẬP LƯU BẠN BÈ MỚI (KHI BẤM DẤU +) */}
          {isAddingFriend && (
            <div className="mt-3 p-2.5 bg-green-50/70 border border-green-200 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-[#16A34A] stroke-[2.4]" />
                  <span>Lưu bạn học mới</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingFriend(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <form onSubmit={handleAddFriendSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Tên hoặc email bạn học..."
                  value={nameOrEmailInput}
                  onChange={(e) => {
                    setNameOrEmailInput(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#16A34A]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Lưu
                </button>
              </form>
            </div>
          )}

          {/* THÔNG BÁO FEEDBACK (LƯU BẠN / MỜI HỌC) */}
          {feedback && (
            <div
              className={`mt-2.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border animate-fade-in ${
                feedback.isError
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-green-50 text-[#166534] border-green-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* BỘ LỌC VÀ TÌM KIẾM BẠN BÈ */}
          <div className="mt-3 mb-2 flex items-center justify-between gap-1.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Tất cả ({buddies.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('online')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'online'
                    ? 'bg-white text-[#166534] shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online ({onlineCount})</span>
              </button>
            </div>

            {/* Ô tìm kiếm nhỏ gọn nếu danh sách có trên 4 bạn */}
            {buddies.length > 4 && (
              <div className="relative flex-1 max-w-[110px]">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#16A34A] focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* DANH SÁCH BẠN BÈ CUỘN DỌC */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[140px] max-h-[380px]">
            {filteredBuddies.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p>
                  {filterMode === 'online'
                    ? 'Chưa có bạn nào đang online'
                    : 'Chưa có bạn bè trong danh sách'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingFriend(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-[#166534] text-xs font-bold border border-green-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Lưu bạn học mới</span>
                </button>
              </div>
            ) : (
              filteredBuddies.map((buddy) => {
                const isCurrentRoom = buddy.currentRoom && buddy.currentRoom === activeRoomId;
                const isInOtherRoom = buddy.currentRoom && buddy.currentRoom !== activeRoomId;

                return (
                  <div
                    key={buddy.id}
                    className="p-2.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-green-300 rounded-xl transition-all shadow-2xs group flex items-center justify-between gap-2"
                  >
                    {/* Avatar & Thông tin */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                          style={{ backgroundColor: buddy.avatarColor || '#16A34A' }}
                        >
                          {buddy.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white ${
                            buddy.online
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                          title={buddy.online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {buddy.name}
                        </div>
                        <div className="text-[10px] truncate">
                          {isCurrentRoom ? (
                            <span className="text-[#166534] font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#16A34A]" />
                              <span>Cùng phòng</span>
                            </span>
                          ) : isInOtherRoom ? (
                            <span className="text-sky-600 font-semibold truncate block max-w-[120px]">
                              {SocialFriendService.getFriendlyRoomName(buddy, spaces)}
                            </span>
                          ) : buddy.online ? (
                            <span className="text-emerald-600 font-semibold">Trực tuyến</span>
                          ) : (
                            <span className="text-slate-400">Ngoại tuyến</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bộ nút hành động nhanh */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Nếu bạn đang ở phòng khác: nút "Xin vào cùng" */}
                      {isInOtherRoom && (
                        <button
                          type="button"
                          onClick={() => handleJoinFriendRoom(buddy)}
                          title={`Xin phép vào phòng học cùng ${buddy.name}`}
                          className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold border border-sky-200 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Xin vào</span>
                        </button>
                      )}

                      {/* Nút Mời học */}
                      {!isCurrentRoom && (
                        <button
                          type="button"
                          onClick={() => handleInviteFriend(buddy)}
                          title={`Mời ${buddy.name} vào bàn học này`}
                          className="px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-[#16A34A] text-[10px] font-bold border border-green-200 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          <span>Mời học</span>
                        </button>
                      )}

                      {/* Nút xóa bạn khỏi danh sách */}
                      <button
                        type="button"
                        onClick={() => removeFriend(buddy.id)}
                        title="Xóa khỏi danh sách bạn bè"
                        className="p-1 text-slate-300 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER: SAO CHÉP LIÊN KẾT BÀN HỌC */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 truncate">
              {currentUser.name ? `Bạn là: ${currentUser.name}` : 'Sẵn sàng học nhóm'}
            </span>

            <button
              type="button"
              onClick={handleCopyDeskLink}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-green-50 hover:text-[#166534] hover:border-green-300 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
              title="Sao chép link mời bạn vào bàn học này"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-[#16A34A]" />
                  <span className="text-[#166534] font-bold">Đã chép link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3" />
                  <span>Chép link bàn</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
