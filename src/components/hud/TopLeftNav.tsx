'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStudySpace } from '@/context/StudySpaceContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  Compass, 
  Search, 
  Plus, 
  ChevronDown,
  BookMarked,
  BookOpen,
  FileText,
  StickyNote,
  GraduationCap,
  X,
  LogIn,
  User as UserIcon,
  BarChart2,
  Share2,
  Info
} from 'lucide-react';
import { getAssetPath } from '@/lib/assets';
import { PomodoroChip } from './PomodoroChip';

export function TopLeftNav() {
  const { 
    spaces, 
    activeSpaceId, 
    activeSpace, 
    switchSpace, 
    createSpace,
    searchQuery,
    setSearchQuery,
    selectItem,
    transform,
    resetDeskRotation,
    setTransform,
    isMultiplayerConnected,
    startHostingRoom,
    multiplayerPermission
  } = useStudySpace();

  const { user, profile } = useAuth();
  const router = useRouter();

  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceSubject, setNewSpaceSubject] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Slide-out search & 3-item dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCreateNewSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    createSpace(newSpaceName.trim(), newSpaceSubject.trim() || 'Học tập');
    setNewSpaceName('');
    setNewSpaceSubject('');
    setIsNewSpaceModalOpen(false);
    setIsSpaceMenuOpen(false);
  };

  // Filtered documents on current desk
  const filteredDeskItems = activeSpace.items.filter(item => {
    if (!searchQuery.trim()) return true;
    return item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const handleSelectDeskItem = (itemId: string) => {
    const targetItem = activeSpace.items.find(i => i.id === itemId);
    if (!targetItem) return;

    selectItem(itemId);

    // Pan camera smoothly to center on the target item
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const itemCenterX = targetItem.x + (targetItem.type === 'book' ? 490 : 180);
    const itemCenterY = targetItem.y + (targetItem.type === 'book' ? 320 : 250);

    setTransform(prev => ({
      ...prev,
      x: winW / 2 - itemCenterX * prev.scale,
      y: winH / 2 - itemCenterY * prev.scale
    }));

    setIsSearchFocused(false);
  };

  const getItemTypeIcon = (item: typeof activeSpace.items[0]) => {
    if (item.isExamSheet) return <GraduationCap className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />;
    if (item.type === 'book') return <BookOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />;
    if (item.type === 'sticky_note') return <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />;
  };

  const isSearchExpanded = isSearchFocused || isSearchHovered || searchQuery.length > 0;

  return (
    <div className="relative flex flex-col gap-2 pointer-events-auto">
      {/* HUD Pill: Brand & Space Selector & Slide-out Search (+30% size on desktop, compact on mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/95 border border-slate-300 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 shadow-sm backdrop-blur-md text-slate-900">
        {/* Brand Text GreenLearn in Green (#16A34A) & Dark (#242D3D) */}
        <div className="flex items-center gap-1 sm:gap-1.5 pr-2 sm:pr-3 border-r border-slate-200">
          <Link
            href="/?view=home"
            onClick={() => {
              if (typeof window !== 'undefined') {
                try { localStorage.setItem('greenlearn_current_view', 'home'); } catch (e) {}
              }
            }}
            title="Trang chủ GreenLearn"
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getAssetPath('/icons/greenlearn-icon.png')} 
              alt="GreenLearn" 
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" 
              style={{ width: '24px', height: '24px', maxWidth: '24px', maxHeight: '24px' }}
            />
            <span 
              className="text-sm sm:text-lg font-black tracking-tight select-none leading-none hidden md:inline landscape-phone:hidden"
            >
              <span className="text-[#16A34A]">Green</span>
              <span className="text-[#242D3D]">Learn</span>
            </span>
          </Link>
        </div>

        {/* Space Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsSpaceMenuOpen(!isSpaceMenuOpen)}
            className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-slate-900 hover:text-black transition-colors px-1 py-0.5 rounded-lg cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800 stroke-[2.4]" />
            <span className="max-w-[70px] sm:max-w-[220px] truncate">{activeSpace.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 stroke-[2.4]" />
          </button>

          {/* Spaces Menu */}
          {isSpaceMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-300 rounded-xl shadow-xl p-2 z-50 text-slate-900 animate-fade-in font-medium">
              <div className="text-[10px] font-black text-slate-500 px-2 py-1 tracking-wider uppercase">
                Bàn học của bạn
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto my-1">
                {spaces.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchSpace(s.id);
                      setIsSpaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      s.id === activeSpaceId 
                        ? 'bg-green-50 text-[#166534] border border-[#BBF7D0] font-bold' 
                        : 'text-slate-800 hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{s.items.length} món</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsSpaceMenuOpen(false);
                    setIsNewSpaceModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.4]" />
                  <span>Tạo bàn học mới</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Slide-out Search Bar (Chỉ hiện icon kính lúp, hover trượt sang phải, ấn vào list tối đa 3 tài liệu) */}
        <div 
          ref={searchContainerRef}
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => setIsSearchHovered(false)}
          className="relative pl-2.5 border-l border-slate-200 flex items-center"
        >
          <button
            title="Tìm tài liệu trên bàn học"
            onClick={() => setIsSearchFocused(true)}
            className="text-slate-700 hover:text-black transition-colors p-1 rounded-lg flex-shrink-0 cursor-pointer"
          >
            <Search className="w-4.5 h-4.5 text-slate-800 stroke-[2.4]" />
          </button>

          {/* Slide-out Input container */}
          <div className={`transition-all duration-300 ease-out flex items-center overflow-hidden ${
            isSearchExpanded ? 'w-32 sm:w-52 pl-1.5 opacity-100' : 'w-0 pl-0 opacity-0'
          }`}>
            <input
              type="text"
              placeholder="Tìm tài liệu trên bàn..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none pr-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-800 pr-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.4]" />
              </button>
            )}
          </div>

          {/* Search Dropdown: List max 3 items on screen, scrollable if more */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-300 rounded-xl shadow-2xl p-1.5 z-50 text-slate-900 animate-fade-in">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                <span>TÀI LIỆU TRÊN BÀN</span>
                <span className="font-mono">{filteredDeskItems.length} mục</span>
              </div>

              {filteredDeskItems.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400 italic">
                  Không tìm thấy tài liệu phù hợp
                </div>
              ) : (
                <div className="max-h-[142px] overflow-y-auto space-y-1 my-0.5 no-scrollbar">
                  {filteredDeskItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectDeskItem(item.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors group cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        {getItemTypeIcon(item)}
                      </div>
                      <span className="truncate font-semibold text-slate-800 group-hover:text-[#16A34A] flex-1">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Pomodoro HUD Chip */}
        <div className="pl-2 border-l border-slate-200 hidden sm:flex items-center">
          <PomodoroChip />
        </div>

        {/* Direct Invite Button & Dashboard & User Account */}
        <div className="pl-2 border-l border-slate-200 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!isMultiplayerConnected) {
                startHostingRoom(activeSpace.id, multiplayerPermission);
              }
              window.dispatchEvent(new CustomEvent('greenlearn:open-invite-modal'));
            }}
            title="Mời bạn cùng học (Multiplayer Realtime)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-[#16A34A] border border-green-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.4]" />
            <span className="hidden md:inline landscape-phone:hidden">Mời bạn</span>
            {isMultiplayerConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping" />
            )}
          </button>

          <Link
            href="/dashboard"
            title="Thống kê học tập (Dashboard)"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <BarChart2 className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {user ? (
            <Link
              href="/profile?from=desk"
              title={`Hồ sơ cá nhân (${profile?.display_name || user.email})`}
              className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 hover:border-[#16A34A] transition-colors flex items-center justify-center bg-[#F0FDF4] text-[#16A34A] font-bold text-xs shadow-xs shrink-0"
              style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', maxWidth: '28px', maxHeight: '28px' }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile?.display_name || 'Avatar'}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  style={{ width: '100%', height: '100%', maxWidth: '28px', maxHeight: '28px', objectFit: 'cover' }}
                />
              ) : (
                <span>{(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}</span>
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              title="Đăng nhập tài khoản"
              className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.4]" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Modal: Tạo Bàn Học Mới */}
      {isNewSpaceModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-900 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tạo bàn học mới</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mỗi bàn học là một không gian riêng để bạn sắp xếp sách vở, tài liệu và ghi chú.
            </p>
            <form onSubmit={handleCreateNewSpace} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên bàn học
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ôn thi giữa kỳ Machine Learning"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-green-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Môn học / Chủ đề
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toán ứng dụng, AI..."
                  value={newSpaceSubject}
                  onChange={(e) => setNewSpaceSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-green-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewSpaceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Tạo bàn học
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
