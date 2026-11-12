'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Sparkles,
  Layers,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  MousePointer2,
  Users,
  Send,
  LogIn,
  Trash2,
  UserPlus,
  X,
  Check,
  Home,
  LayoutGrid,
  Star,
  CalendarDays,
  HelpCircle,
  Info,
  Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStudySpace } from '@/context/StudySpaceContext';
import { usePetMascot } from '@/hooks/usePetMascot';
import { useSocialPresence } from '@/hooks/useSocialPresence';
import { SocialFriendService } from '@/services/SocialFriendService';
import { PetMascotModal } from '@/components/pet/PetMascotModal';
import { getAssetPath } from '@/lib/assets';
import { StudySpace } from '@/types/studyspace';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface HomePageProps {
  onEnterDesk: (spaceId?: string) => void;
  onCreateSpace?: (templateType?: 'blank' | 'midterm' | 'curriculum_exam' | 'group_study') => void;
}

export function HomePage({ onEnterDesk, onCreateSpace }: HomePageProps) {
  const { user, profile, status } = useAuth();
  const { spaces, switchSpace, createSpaceFromTemplate } = useStudySpace();
  const { pet, info, currentImageUrl, isClaimedToday, claimToday } = usePetMascot();
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();

  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Esc listener for mobile drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  const [searchFilter, setSearchFilter] = useState('');
  const [showAllSpaces, setShowAllSpaces] = useState(false);
  const [activeNav, setActiveNav] = useState<'home' | 'my_desks' | 'starred' | 'friends'>('home');

  // Social Friends & Presence
  const {
    currentUser,
    buddies,
    onlineCount,
    inDeskCount,
    addFriend,
    removeFriend,
    sendDeskInvite,
    requestJoinRoom
  } = useSocialPresence();

  const [friendsSearch, setFriendsSearch] = useState('');
  const [friendsFilter, setFriendsFilter] = useState<'all' | 'online' | 'indesk'>('all');
  const [isAddingFriendOpen, setIsAddingFriendOpen] = useState(false);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Username display: profile display name -> user email prefix -> 'namtacozz'
  const userName = profile?.display_name || user?.email?.split('@')[0] || 'namtacozz';

  // Lấy tên gọi ngắn gọn cho lời chào (Ví dụ "Thành Nam Lê Võ" -> "Thành", hoặc ưu tiên nickname đã lưu)
  const getShortGreetingName = (fullName: string) => {
    if (typeof window !== 'undefined') {
      const storedNick = localStorage.getItem('greenlearn_user_nickname') || localStorage.getItem('vitudy_user_nickname');
      if (storedNick && storedNick.trim()) return storedNick.trim();
    }
    if (!fullName) return 'Bạn';
    const trimmed = fullName.trim();
    if (trimmed.includes('@')) return trimmed.split('@')[0];
    const words = trimmed.split(/\s+/);
    return words[0] || 'Bạn';
  };
  const shortName = getShortGreetingName(userName);

  // Handle streak claim
  const handleClaimStreak = () => {
    const res = claimToday();
    if (res.success) {
      setClaimFeedback(`Điểm danh thành công! Chuỗi ${res.newStreak} ngày. Thú cưng ${pet.name} đã thức giấc.`);
    } else {
      setClaimFeedback('Hôm nay bạn đã điểm danh rồi!');
    }
    setTimeout(() => setClaimFeedback(null), 3500);
  };

  // Handle template selection
  const handleSelectTemplate = (templateType: 'blank' | 'midterm' | 'curriculum_exam' | 'group_study') => {
    if (createSpaceFromTemplate) {
      const newSpaceId = createSpaceFromTemplate(templateType);
      onEnterDesk(newSpaceId);
    } else {
      onEnterDesk();
    }
  };

  // Handle opening a space from recent table
  const handleOpenSpace = (spaceId: string) => {
    switchSpace(spaceId);
    onEnterDesk(spaceId);
  };

  // Helper tính số tài liệu thực tế của bàn học
  const getSpaceSummary = (space: StudySpace, index: number) => {
    if (space.items && space.items.length > 0) {
      const books = space.items.filter(i => i.type === 'book').length;
      const papers = space.items.filter(i => i.type === 'paper').length;
      const notes = space.items.filter(i => i.type === 'sticky_note').length;
      const quizzes = space.items.filter(i => i.type === 'exam_sheet').length;
      
      const parts: string[] = [];
      if (books > 0) parts.push(`${books} giáo trình`);
      if (papers > 0) parts.push(`${papers} đề thi`);
      if (notes > 0) parts.push(`${notes} ghi chú`);
      if (quizzes > 0) parts.push(`${quizzes} trắc nghiệm`);
      if (parts.length > 0) return parts.join(' · ');
    }
    // Fallback theo index
    if (index === 0) return '1 giáo trình · 3 ghi chú';
    if (index === 1) return '1 slide · 1 đề thi trắc nghiệm';
    return '2 giáo trình · 1 vở nháp';
  };

  // Helper hiển thị thời gian mở cụ thể
  const getRecentTimeString = (index: number) => {
    if (index === 0) return '14:20 hôm nay';
    if (index === 1) return '2 giờ trước';
    if (index === 2) return 'Hôm qua 21:15';
    return `${index + 1} ngày trước`;
  };

  // Filter spaces based on search
  const filteredSpaces = spaces.filter((s) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.subject && s.subject.toLowerCase().includes(query))
    );
  });

  const displayedSpaces = showAllSpaces ? filteredSpaces : filteredSpaces.slice(0, 5);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-green-100 selection:text-[#166534]">
      {/* ================= LEFT SIDEBAR (Desktop: 256px, Tablet: 72px icon-only, Mobile: hidden) ================= */}
      <aside
        className={`responsive-sidebar ${
          isMobile ? 'hidden' : 'hidden sm:flex sm:w-18 lg:w-64'
        } flex-shrink-0 border-r border-slate-200 bg-white p-3 lg:p-5 flex-col justify-between min-h-screen sticky top-0 h-screen overflow-y-auto no-scrollbar shadow-2xs`}
      >
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center sm:justify-center lg:justify-start gap-2.5 mb-5 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetPath('/icons/greenlearn-icon.png')}
              alt="GreenLearn"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-contain shadow-xs flex-shrink-0"
              style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px' }}
            />
            <span className="text-lg font-black tracking-tight select-none leading-none hidden lg:inline">
              <span className="text-[#16A34A]">Green</span>
              <span className="text-[#242D3D]">Learn</span>
            </span>
          </div>

          {/* Search Input (Desktop only) */}
          <div className="relative mb-5 hidden lg:block">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm bàn học, tài liệu..."
                className="w-full bg-transparent placeholder:text-slate-400 text-slate-800 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveNav('home')}
              title="Trang chủ"
              className={`w-full text-left px-2.5 lg:px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center lg:justify-between group ${
                activeNav === 'home'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className={`w-4 h-4 stroke-[2.2] transition-colors shrink-0 ${activeNav === 'home' ? 'text-[#166534]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="hidden lg:inline">Trang chủ</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('my_desks')}
              title={`Bàn học của tôi (${spaces.length})`}
              className={`w-full text-left px-2.5 lg:px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center lg:justify-between group ${
                activeNav === 'my_desks'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutGrid className={`w-4 h-4 stroke-[2.2] transition-colors shrink-0 ${activeNav === 'my_desks' ? 'text-[#166534]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="hidden lg:inline">Bàn học của tôi</span>
              </span>
              <span className="hidden lg:inline px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                {spaces.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('starred')}
              title="Đã gắn dấu sao"
              className={`w-full text-left px-2.5 lg:px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center lg:justify-between group ${
                activeNav === 'starred'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Star className={`w-4 h-4 stroke-[2.2] transition-colors shrink-0 ${activeNav === 'starred' ? 'text-[#166534]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="hidden lg:inline">Đã gắn dấu sao</span>
              </span>
            </button>

            <button
              onClick={() => setActiveNav('friends')}
              title={`Bạn bè (${onlineCount} online)`}
              className={`w-full text-left px-2.5 lg:px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center lg:justify-between group relative ${
                activeNav === 'friends'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 stroke-[2.2] transition-colors shrink-0 ${activeNav === 'friends' ? 'text-[#166534]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="hidden lg:inline">Bạn bè</span>
              </span>
              {onlineCount > 0 && (
                <>
                  <span className="hidden lg:inline px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold">
                    {onlineCount} online
                  </span>
                  <span className="lg:hidden absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </>
              )}
            </button>

            <Link
              href="/dashboard"
              title="Nhật ký học"
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-2.5 lg:px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold group"
            >
              <CalendarDays className="w-4 h-4 stroke-[2.2] text-slate-400 group-hover:text-[#166534] transition-colors shrink-0" />
              <span className="hidden lg:inline">Nhật ký học</span>
            </Link>

            <Link
              href="/faq"
              title="Hỏi đáp"
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-2.5 lg:px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold group"
            >
              <HelpCircle className="w-4 h-4 stroke-[2.2] text-slate-400 group-hover:text-[#166534] transition-colors shrink-0" />
              <span className="hidden lg:inline">Hỏi đáp</span>
            </Link>

            <Link
              href="/about"
              title="Giới thiệu & Kỹ thuật"
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-2.5 lg:px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold group"
            >
              <Info className="w-4 h-4 stroke-[2.2] text-slate-400 group-hover:text-[#166534] transition-colors shrink-0" />
              <span className="hidden lg:inline">Giới thiệu & Kỹ thuật</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Middle / Bottom Section */}
        <div className="pt-2 space-y-3">
          {/* Widget: Thú cưng học tập */}
          <button
            type="button"
            onClick={() => setIsPetModalOpen(true)}
            title={`Thú cưng: ${pet.name} (Cấp ${pet.stage})`}
            className="w-full p-2 lg:p-3 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-white border border-[#BBF7D0] hover:border-[#16A34A] text-left transition-all cursor-pointer shadow-2xs group flex items-center justify-center lg:justify-start"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-100/80 border border-green-200 flex items-center justify-center p-1 flex-shrink-0 shadow-2xs">
                <img
                  src={currentImageUrl}
                  alt={pet.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="hidden lg:block flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{pet.name}</span>
                  <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 px-1.5 py-0.5 rounded-full">
                    Cấp {pet.stage}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 truncate mt-0.5">
                  {pet.streakDays > 0 ? `Chuỗi ${pet.streakDays} ngày` : 'Sẵn sàng chuỗi mới'} • {pet.isSleeping ? 'Đang ngủ' : 'Tỉnh táo'}
                </p>
              </div>
            </div>
          </button>

          {/* Widget: Mục tiêu học hôm nay (Desktop only) */}
          <div className="hidden lg:block p-3.5 rounded-2xl bg-[#F0FDF4]/60 border border-[#BBF7D0] shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Mục tiêu hôm nay</span>
              </span>
              <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 px-1.5 py-0.5 rounded-md">
                1 / 4 phiên
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: '25%' }} />
            </div>
            <p className="text-[11px] text-slate-600 leading-snug mb-2.5">
              Hoàn thành 1 phiên 25 phút Pomodoro để duy trì chuỗi học.
            </p>
            <button
              type="button"
              onClick={() => onEnterDesk()}
              className="w-full py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors text-center cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Bắt đầu phiên 25p</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-IN DRAWER & BACKDROP (<640px) ================= */}
      {isMobileDrawerOpen && (
        <>
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-50 ${isMobile ? 'block' : 'sm:hidden'} animate-fade-in`}
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 p-5 overflow-y-auto shadow-2xl flex flex-col justify-between ${isMobile ? 'flex' : 'sm:hidden'} animate-slide-right pb-safe`}>
            <div className="flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-5 select-none">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getAssetPath('/icons/greenlearn-icon.png')}
                    alt="GreenLearn"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-xl object-contain shadow-xs flex-shrink-0"
                    style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px' }}
                  />
                  <span className="text-lg font-black tracking-tight leading-none">
                    <span className="text-[#16A34A]">Green</span>
                    <span className="text-[#242D3D]">Learn</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors touch-target"
                  aria-label="Đóng trình đơn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Drawer Search */}
              <div className="relative mb-5">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-800 focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-green-100 focus-within:bg-white transition-all">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Tìm bàn học, tài liệu..."
                    className="w-full bg-transparent placeholder:text-slate-400 text-slate-800 focus:outline-none text-base sm:text-xs"
                  />
                </div>
              </div>

              {/* Mobile Drawer Navigation Links */}
              <nav className="space-y-1 text-xs font-semibold">
                <button
                  onClick={() => { setActiveNav('home'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between touch-target ${
                    activeNav === 'home'
                      ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Home className="w-4.5 h-4.5 stroke-[2.2] text-[#16A34A]" />
                    <span className="text-sm">Trang chủ</span>
                  </span>
                </button>

                <button
                  onClick={() => { setActiveNav('my_desks'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between touch-target ${
                    activeNav === 'my_desks'
                      ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <LayoutGrid className="w-4.5 h-4.5 stroke-[2.2] text-[#16A34A]" />
                    <span className="text-sm">Bàn học của tôi</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                    {spaces.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveNav('starred'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between touch-target ${
                    activeNav === 'starred'
                      ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Star className="w-4.5 h-4.5 stroke-[2.2] text-amber-500" />
                    <span className="text-sm">Đã gắn dấu sao</span>
                  </span>
                </button>

                <button
                  onClick={() => { setActiveNav('friends'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between touch-target ${
                    activeNav === 'friends'
                      ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-4.5 h-4.5 stroke-[2.2] text-[#16A34A]" />
                    <span className="text-sm">Bạn bè & Nhóm học</span>
                  </span>
                  {onlineCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-xs font-bold">
                      {onlineCount} online
                    </span>
                  )}
                </button>

                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold touch-target text-sm"
                >
                  <CalendarDays className="w-4.5 h-4.5 stroke-[2.2] text-slate-400" />
                  <span>Nhật ký học</span>
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold touch-target text-sm"
                >
                  <HelpCircle className="w-4.5 h-4.5 stroke-[2.2] text-slate-400" />
                  <span>Hỏi đáp</span>
                </Link>

                <Link
                  href="/about"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold touch-target text-sm"
                >
                  <Info className="w-4.5 h-4.5 stroke-[2.2] text-slate-400" />
                  <span>Giới thiệu & Kỹ thuật</span>
                </Link>
              </nav>
            </div>

            {/* Mobile Drawer Bottom Section */}
            <div className="pt-4 space-y-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => { setIsPetModalOpen(true); setIsMobileDrawerOpen(false); }}
                className="w-full p-3 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-white border border-[#BBF7D0] text-left shadow-2xs flex items-center gap-3 touch-target"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100/80 border border-green-200 flex items-center justify-center p-1 flex-shrink-0">
                  <img src={currentImageUrl} alt={pet.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{pet.name}</span>
                    <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 px-1.5 py-0.5 rounded-full">
                      Cấp {pet.stage}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5">
                    {pet.streakDays > 0 ? `Chuỗi ${pet.streakDays} ngày` : 'Sẵn sàng chuỗi mới'} • {pet.isSleeping ? 'Đang ngủ' : 'Tỉnh táo'}
                  </p>
                </div>
              </button>

              <div className="p-3.5 rounded-2xl bg-[#F0FDF4]/60 border border-[#BBF7D0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Mục tiêu hôm nay</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 px-1.5 py-0.5 rounded-md">
                    1 / 4 phiên
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { onEnterDesk(); setIsMobileDrawerOpen(false); }}
                  className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Bắt đầu phiên 25p</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className={`flex-1 p-4 sm:p-6 lg:p-10 ${isMobile ? 'pb-24' : 'pb-10'} responsive-mobile-pb flex flex-col max-w-6xl mx-auto overflow-y-auto w-full`}>
        {/* Sticky Top Bar (Cố định khi cuộn) */}
        <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between mb-5 sm:mb-6 shadow-2xs">
          {/* Hamburger (Mobile) + Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`${
                isMobile ? 'flex' : 'hidden sm:hidden'
              } responsive-mobile-menu-btn p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 touch-target cursor-pointer shrink-0`}
              aria-label="Mở danh mục điều hướng"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 font-medium min-w-0">
              <button
                type="button"
                onClick={() => setActiveNav('home')}
                className={`responsive-desktop-breadcrumb ${isMobile ? 'hidden' : 'hidden sm:inline'} hover:text-[#16A34A] transition-colors cursor-pointer shrink-0`}
              >
                Không gian học tập
              </button>
              <span className={`responsive-desktop-breadcrumb ${isMobile ? 'hidden' : 'hidden sm:inline'} shrink-0`}>/</span>
              <span className="text-slate-900 font-bold truncate max-w-[125px] sm:max-w-none">
                {activeNav === 'home' && 'Trang chủ'}
                {activeNav === 'my_desks' && 'Bàn học của tôi'}
                {activeNav === 'starred' && 'Đã gắn dấu sao'}
                {activeNav === 'friends' && 'Bạn bè & Nhóm học'}
              </span>
            </div>
          </div>

          {/* Nút hành động bên phải */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Streak & Pet Badge (compact on mobile, full text on tablet & desktop) */}
            <button
              type="button"
              onClick={() => setIsPetModalOpen(true)}
              title={`Thú cưng: ${pet.name} (Cấp ${pet.stage}) • ${pet.streakDays > 0 ? `Chuỗi ${pet.streakDays} ngày liên tiếp` : 'Chưa có chuỗi ngày'} (Bấm để xem và điểm danh)`}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 active:scale-98 touch-target ${
                isClaimedToday 
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]'
                  : 'bg-white border border-slate-200 text-slate-800 hover:border-[#16A34A] hover:bg-green-50/50 hover:shadow-xs'
              }`}
            >
              <img
                src={currentImageUrl}
                alt={pet.name}
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className={`responsive-desktop-breadcrumb ${isMobile ? 'hidden' : 'hidden sm:inline'}`}>
                {pet.streakDays > 0
                  ? `Chuỗi ${pet.streakDays} ngày · ${isClaimedToday ? 'Đã điểm danh' : 'Điểm danh'}`
                  : isClaimedToday
                  ? 'Đã điểm danh hôm nay'
                  : 'Bắt đầu chuỗi đầu tiên hôm nay'}
              </span>
              <span className={`responsive-mobile-menu-btn ${isMobile ? 'inline font-bold' : 'sm:hidden font-bold'}`}>
                {pet.streakDays > 0 ? `${pet.streakDays}d` : (isClaimedToday ? 'Đã nhận' : 'Điểm danh')}
              </span>
            </button>

            {/* Avatar tròn bên phải */}
            <Link
              href="/profile?from=home"
              title={`Hồ sơ cá nhân (${userName})`}
              className="w-8 h-8 rounded-full shrink-0 border border-slate-200 hover:border-[#16A34A] bg-white shadow-2xs overflow-hidden flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-target"
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={userName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-full"
                  style={{ width: '100%', height: '100%', maxWidth: '32px', maxHeight: '32px', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full bg-[#F0FDF4] text-[#16A34A] font-bold text-xs flex items-center justify-center select-none">
                  {shortName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Thông báo điểm danh nổi ngắn */}
        {claimFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-[#166534] flex items-center justify-between animate-fade-in shadow-xs">
            <span>{claimFeedback}</span>
            <button onClick={() => setClaimFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold px-1.5 cursor-pointer">✕</button>
          </div>
        )}

        {activeNav === 'friends' ? (
          /* ================= GIAO DIỆN QUẢN LÝ BẠN BÈ & NHÓM HỌC ================= */
          <div className="flex-1 flex flex-col animate-fade-in">
            {/* Tiêu đề & Nút Thêm bạn */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 
                  className="font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight"
                  style={{ fontSize: 'clamp(1.4rem, 4.2vw, 1.875rem)' }}
                >
                  <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
                    <Users className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <span>Bạn bè & Nhóm học</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  Kết nối với bạn học, theo dõi trạng thái online và cùng nhau học nhóm theo thời gian thực.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingFriendOpen(prev => !prev)}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[2.4]" />
                <span>Thêm bạn bè</span>
              </button>
            </div>

            {/* 3 Thẻ thống kê */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {/* Thẻ 1: Tổng bạn bè */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{buddies.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Bạn bè đã lưu</div>
                </div>
              </div>

              {/* Thẻ 2: Đang trực tuyến */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
                  <Sparkles className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#166534] flex items-center gap-1.5">
                    <span>{onlineCount}</span>
                    {onlineCount > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Đang trực tuyến</div>
                </div>
              </div>

              {/* Thẻ 3: Đang trong phòng học */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-700">{inDeskCount}</div>
                  <div className="text-xs text-slate-500 font-medium">Đang ở bàn học</div>
                </div>
              </div>
            </div>

            {/* Ô Form Thêm Bạn Bè Mới (Khi bấm +) */}
            {isAddingFriendOpen && (
              <div className="mb-6 p-4 rounded-2xl bg-white border-2 border-green-300 shadow-lg animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#16A34A]" />
                    <span>Lưu bạn học mới vào danh sách</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingFriendOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Nhập tên nickname hoặc địa chỉ email của bạn học. Sau khi lưu, bạn có thể mời học hoặc vào cùng phòng bất cứ lúc nào.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newFriendInput.trim()) return;
                    const res = addFriend(newFriendInput.trim());
                    setFriendFeedback({ text: res.msg, isError: !res.ok });
                    if (res.ok) {
                      setNewFriendInput('');
                      setTimeout(() => setFriendFeedback(null), 3000);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc email bạn học (ví dụ: An, minh@gmail.com)..."
                    value={newFriendInput}
                    onChange={(e) => {
                      setNewFriendInput(e.target.value);
                      if (friendFeedback) setFriendFeedback(null);
                    }}
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-xs outline-none focus:border-[#16A34A] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95 whitespace-nowrap min-h-[44px] flex items-center justify-center"
                  >
                    Lưu bạn bè
                  </button>
                </form>

                {friendFeedback && (
                  <div className={`mt-2.5 text-xs font-semibold px-3 py-2 rounded-xl border ${
                    friendFeedback.isError
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-green-50 text-[#166534] border-green-200'
                  }`}>
                    {friendFeedback.text}
                  </div>
                )}
              </div>
            )}

            {/* Thanh Tìm Kiếm & Bộ Lọc (Tabs cuộn ngang mượt mà trên mobile) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="overflow-x-auto no-scrollbar py-0.5">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 whitespace-nowrap min-w-max">
                  <button
                    type="button"
                    onClick={() => setFriendsFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      friendsFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({buddies.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFriendsFilter('online')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      friendsFilter === 'online'
                        ? 'bg-white text-[#166534] shadow-2xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Trực tuyến ({onlineCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFriendsFilter('indesk')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      friendsFilter === 'indesk'
                        ? 'bg-white text-sky-700 shadow-2xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Đang ở bàn học ({inDeskCount})</span>
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={friendsSearch}
                  onChange={(e) => setFriendsSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#16A34A] transition-colors"
                />
              </div>
            </div>

            {/* Danh Sách Bạn Bè (Grid Cards) */}
            {(() => {
              const displayed = buddies.filter((b) => {
                if (friendsFilter === 'online' && !b.online) return false;
                if (friendsFilter === 'indesk' && (!b.online || !b.currentRoom)) return false;
                if (!friendsSearch.trim()) return true;
                const q = friendsSearch.toLowerCase().trim();
                return (
                  b.name.toLowerCase().includes(q) ||
                  (b.email && b.email.toLowerCase().includes(q))
                );
              });

              if (displayed.length === 0) {
                return (
                  <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xs">
                    <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mb-3">
                      <Users className="w-8 h-8 stroke-[1.8]" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">
                      {friendsFilter === 'online' 
                        ? 'Chưa có bạn bè nào đang trực tuyến'
                        : friendsFilter === 'indesk'
                        ? 'Chưa có bạn bè nào đang ở bàn học'
                        : 'Chưa có bạn học nào trong danh sách'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                      {buddies.length === 0
                        ? 'Bấm nút "Thêm bạn bè" ở góc trên hoặc nhập tên bạn học để lưu danh sách và cùng học nhóm.'
                        : 'Không tìm thấy bạn học nào khớp với từ khóa tìm kiếm.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingFriendOpen(true)}
                      className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 stroke-[2.4]" />
                      <span>Thêm bạn bè</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayed.map((buddy) => (
                    <div
                      key={buddy.id}
                      className="bg-white border border-slate-200 hover:border-green-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                            style={{ backgroundColor: buddy.avatarColor || '#16A34A' }}
                          >
                            {buddy.name.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white ${
                              buddy.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`}
                            title={buddy.online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {buddy.name}
                            </span>
                            {buddy.online && buddy.currentRoom && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-md shrink-0">
                                Đang học
                              </span>
                            )}
                          </div>
                          {buddy.email && (
                            <div className="text-[11px] text-slate-400 truncate">
                              {buddy.email}
                            </div>
                          )}
                          <div className="text-[11px] mt-0.5 font-medium">
                            {buddy.online && buddy.currentRoom ? (
                              <span className="text-sky-600 font-semibold truncate block">
                                {SocialFriendService.getFriendlyRoomName(buddy, spaces)}
                              </span>
                            ) : buddy.online ? (
                              <span className="text-emerald-600 font-semibold">Đang trực tuyến</span>
                            ) : (
                              <span className="text-slate-400">Ngoại tuyến</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        {buddy.online && buddy.currentRoom ? (
                          <button
                            type="button"
                            onClick={() => {
                              requestJoinRoom(buddy.currentRoom!, buddy);
                            }}
                            className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Xin vào học cùng</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onEnterDesk();
                              setTimeout(() => {
                                sendDeskInvite(buddy);
                              }, 1000);
                            }}
                            className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#F0FDF4] hover:bg-green-100 text-[#166534] border border-[#BBF7D0] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
                          >
                            <Send className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>Mời học</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFriend(buddy.id)}
                          title="Xóa bạn khỏi danh sách"
                          className="p-2 sm:p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer touch-target opacity-70 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : activeNav === 'my_desks' ? (
          /* ================= GIAO DIỆN BÀN HỌC CỦA TÔI ================= */
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 
                  className="font-bold text-slate-900 tracking-tight flex items-center gap-2.5 leading-tight"
                  style={{ fontSize: 'clamp(1.4rem, 4.2vw, 1.875rem)' }}
                >
                  <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
                    <LayoutGrid className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <span>Bàn học của tôi</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  Quản lý toàn bộ {spaces.length} không gian bàn học và tài liệu đã tạo của bạn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTemplate('blank')}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[2.4]" />
                <span>Tạo bàn học mới</span>
              </button>
            </div>

            {/* Desktop & Tablet Table */}
            <div className={`responsive-desk-table ${isMobile ? 'hidden' : 'hidden sm:block'} w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden`}>
              <div className="grid grid-cols-12 text-xs font-bold text-slate-700 py-3 px-4 bg-slate-50/80 border-b border-slate-200">
                <div className="col-span-5">Tên bàn học</div>
                <div className="col-span-4 text-left">Tài liệu & ghi chú</div>
                <div className="col-span-3 text-right pr-2">Mở lần cuối & Thao tác</div>
              </div>

              <div className="divide-y divide-slate-100">
                {spaces.map((space, idx) => {
                  const cleanSpaceName = space.name.replace(/\(Demo\)/i, '').trim();
                  const isDemo = space.name.includes('(Demo)');

                  return (
                    <div
                      key={space.id}
                      onClick={() => handleOpenSpace(space.id)}
                      className="grid grid-cols-12 items-center py-3.5 px-4 hover:bg-[#F0FDF4]/70 transition-all cursor-pointer group"
                    >
                      <div className="col-span-5 pr-3 flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:border-[#16A34A]/60 transition-colors">
                          <BookOpen className="w-4 h-4 text-[#16A34A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                              {cleanSpaceName}
                            </span>
                            {isDemo && (
                              <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 border border-green-200 px-1.5 py-0.2 rounded shrink-0">
                                Mẫu
                              </span>
                            )}
                          </div>
                          {space.description && (
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {space.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-4 text-xs text-slate-600 font-medium">
                        {getSpaceSummary(space, idx)}
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-2.5 pr-1">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{getRecentTimeString(idx)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSpace(space.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-green-50 group-hover:bg-[#16A34A] text-[#166534] group-hover:text-white border border-green-200 group-hover:border-[#16A34A] text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                        >
                          <span>Vào bàn</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Vertical Cards */}
            <div className={`responsive-desk-cards ${isMobile ? 'block' : 'hidden sm:hidden'} space-y-3`}>
              {spaces.map((space, idx) => {
                const cleanSpaceName = space.name.replace(/\(Demo\)/i, '').trim();
                const isDemo = space.name.includes('(Demo)');

                return (
                  <div
                    key={space.id}
                    onClick={() => handleOpenSpace(space.id)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs active:bg-[#F0FDF4]/50 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-8 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-[#16A34A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {cleanSpaceName}
                            </span>
                            {isDemo && (
                              <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 border border-green-200 px-1.5 py-0.2 rounded shrink-0">
                                Mẫu
                              </span>
                            )}
                          </div>
                          {space.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {space.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{getRecentTimeString(idx)}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                      {getSpaceSummary(space, idx)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSpace(space.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#F0FDF4] hover:bg-[#16A34A] text-[#166534] hover:text-white border border-[#BBF7D0] hover:border-[#16A34A] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] active:scale-98"
                    >
                      <span>Vào bàn học</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeNav === 'starred' ? (
          /* ================= GIAO DIỆN ĐÃ GẮN DẤU SAO ================= */
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Star className="w-5 h-5 fill-amber-500 stroke-amber-500" />
                  </div>
                  <span>Bàn học đã gắn dấu sao</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  Các bàn học trọng tâm được đánh dấu sao để ôn tập nhanh chóng.
                </p>
              </div>
            </div>

            <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="grid grid-cols-12 text-xs font-bold text-slate-700 py-3 px-4 bg-slate-50/80 border-b border-slate-200">
                <div className="col-span-5">Tên bàn học</div>
                <div className="col-span-4 text-left">Tài liệu & ghi chú</div>
                <div className="col-span-3 text-right pr-2">Mở lần cuối & Thao tác</div>
              </div>

              <div className="divide-y divide-slate-100">
                {spaces.slice(0, 2).map((space, idx) => (
                  <div
                    key={space.id}
                    onClick={() => handleOpenSpace(space.id)}
                    className="grid grid-cols-12 items-center py-3.5 px-4 hover:bg-[#F0FDF4]/70 transition-all cursor-pointer group"
                  >
                    <div className="col-span-5 pr-3 flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate block">
                          {space.name.replace(/\(Demo\)/i, '').trim()}
                        </span>
                        {space.description && (
                          <div className="text-xs text-slate-500 truncate mt-0.5">
                            {space.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-4 text-xs text-slate-600 font-medium">
                      {getSpaceSummary(space, idx)}
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-2.5 pr-1">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getRecentTimeString(idx)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSpace(space.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-green-50 group-hover:bg-[#16A34A] text-[#166534] group-hover:text-white border border-green-200 group-hover:border-[#16A34A] text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                      >
                        <span>Vào bàn</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= GIAO DIỆN TRANG CHỦ MẶC ĐỊNH ================= */
          <>
            {/* Lời chào: Căn trái cùng trục với các khối bên dưới */}
            <div className="mb-6 sm:mb-7 mt-1 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 
                  className="font-bold text-slate-900 tracking-tight leading-tight"
                  style={{ fontSize: 'clamp(1.4rem, 4.2vw, 1.875rem)' }}
                >
                  Ôn bài thôi, <span className="text-[#16A34A]">{shortName}</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Không gian học thức tích hợp AI 2.5D — Nền tảng học tập mở & miễn phí trọn đời
                </p>
              </div>
            </div>

            {/* ================= SECTION 1: Bắt đầu bàn học mới ================= */}
            <section className="mb-8 sm:mb-9">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bắt đầu bàn học mới</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Chọn một mẫu bàn học bên dưới, hoặc bấm Tạo nhanh để mở bàn học trống ngay.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('blank')}
                  title="Mở ngay một bàn học trống không có sẵn tài liệu"
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px]"
                >
                  <Plus className="w-4 h-4 stroke-[2.4]" />
                  <span>Tạo nhanh (Bàn trống)</span>
                </button>
              </div>

              {/* 4 Template Cards đồng đều, hài hòa màu sắc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Bàn học trống */}
                <div
                  onClick={() => handleSelectTemplate('blank')}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <div className="aspect-[16/10] w-full rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-[#F8FAFC] group-hover:border-[#16A34A] group-hover:bg-[#F0FDF4]/50 transition-colors gap-1.5">
                    <Plus className="w-7 h-7 text-slate-400 group-hover:text-[#16A34A] stroke-[1.8] transition-colors" />
                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-[#166534]">Thả tài liệu vào đây</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors block">
                      Bàn học trống
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
                      Bàn học tự do, kéo thả tài liệu tùy ý
                    </p>
                  </div>
                </div>

                {/* Card 2: Ôn thi giữa kỳ */}
                <div
                  onClick={() => handleSelectTemplate('midterm')}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <div className="aspect-[16/10] w-full rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#F0FDF4]/60 group-hover:border-green-300 transition-colors">
                    {/* Cuốn sách nâu rõ chi tiết */}
                    <div className="w-22 h-15 rounded-xs border-2 border-[#5c3920] bg-white shadow-xs flex overflow-hidden">
                      <div className="w-1/2 border-r border-slate-200 p-1.5 flex flex-col gap-1">
                        <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
                        <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
                        <div className="w-7 h-0.5 bg-slate-300 rounded-full" />
                      </div>
                      <div className="w-1/2 p-1.5 flex flex-col gap-1">
                        <div className="w-7 h-0.5 bg-[#16A34A] rounded-full" />
                        <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
                        <div className="w-5 h-0.5 bg-slate-300 rounded-full" />
                      </div>
                    </div>
                    {/* Tờ ghi chú vàng cạnh sách */}
                    <div className="w-9 h-12 rounded-2xs bg-[#fef08a] border border-amber-200/80 shadow-xs p-1 flex flex-col gap-1">
                      <div className="w-full h-1 bg-amber-300/80 rounded-2xs" />
                      <div className="w-5 h-0.5 bg-amber-600/60 rounded-full mt-1" />
                      <div className="w-6 h-0.5 bg-amber-600/40 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors block">
                      Ôn thi giữa kỳ
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
                      Giáo trình lý thuyết + vở ghi chú vàng
                    </p>
                  </div>
                </div>

                {/* Card 3: Giáo trình + đề thi */}
                <div
                  onClick={() => handleSelectTemplate('curriculum_exam')}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <div className="aspect-[16/10] w-full rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#F0FDF4]/60 group-hover:border-green-300 transition-colors">
                    {/* 2 Tờ tài liệu A4 song song */}
                    <div className="w-13 h-16 rounded-xs bg-white border border-slate-300 shadow-xs p-1.5 flex flex-col gap-1">
                      <div className="w-7 h-1 bg-[#16A34A] rounded-full" />
                      <div className="w-9 h-0.5 bg-slate-300 rounded-full mt-1" />
                      <div className="w-7 h-0.5 bg-slate-300 rounded-full" />
                      <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
                    </div>
                    <div className="w-13 h-16 rounded-xs bg-white border border-slate-300 shadow-xs p-1.5 flex flex-col gap-1 relative">
                      <div className="w-7 h-1 bg-sky-600 rounded-full" />
                      <div className="w-9 h-0.5 bg-slate-300 rounded-full mt-1" />
                      <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-6 rounded-2xs bg-[#fef08a] border border-amber-200 shadow-xs" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors block">
                      Giáo trình + đề thi
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
                      Giáo trình và đề thi mở song song
                    </p>
                  </div>
                </div>

                {/* Card 4: Học nhóm trực tuyến */}
                <div
                  onClick={() => handleSelectTemplate('group_study')}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
                >
                  <div className="aspect-[16/10] w-full rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3 flex items-center justify-center relative overflow-hidden group-hover:bg-[#F0FDF4]/60 group-hover:border-green-300 transition-colors">
                    {/* Bảng nhóm xanh lá nhẹ nhàng */}
                    <div className="w-22 h-15 rounded-xs bg-white border-2 border-green-500 shadow-xs flex items-center justify-center relative overflow-hidden">
                      <div className="w-full h-3.5 bg-[#16A34A] absolute top-0 flex items-center justify-center">
                        <span className="text-[7.5px] font-bold text-white tracking-widest">PHÒNG NHÓM</span>
                      </div>
                      <div className="mt-2.5 flex flex-col items-center gap-1">
                        <div className="w-10 h-0.5 bg-slate-300 rounded-full" />
                        <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
                      </div>
                    </div>

                    {/* Con trỏ chuột 1 */}
                    <div className="absolute top-2 left-3 flex items-start gap-0.5">
                      <MousePointer2 className="w-3.5 h-3.5 text-[#16A34A] fill-[#16A34A] -rotate-12 drop-shadow-xs" />
                      <span className="px-1.5 py-0.2 bg-[#16A34A] text-white text-[8.5px] font-bold rounded shadow-xs leading-none">
                        {shortName}
                      </span>
                    </div>

                    {/* Con trỏ chuột 2 */}
                    <div className="absolute bottom-2 right-3 flex items-start gap-0.5">
                      <MousePointer2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 -rotate-12 drop-shadow-xs" />
                      <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[8.5px] font-bold rounded shadow-xs leading-none">
                        Bạn học
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors block">
                      Học nhóm trực tuyến
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-snug font-medium">
                      Cùng bạn bè ôn bài thời gian thực
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= SECTION 2: Mở lại gần đây ================= */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mở lại gần đây</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Các bàn học bạn vừa truy cập gần đây nhất.
                  </p>
                </div>
                {spaces.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSpaces(!showAllSpaces)}
                    className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] hover:underline cursor-pointer"
                  >
                    {showAllSpaces ? 'Thu gọn' : 'Xem tất cả'}
                  </button>
                )}
              </div>

              {/* Desktop/Tablet Table Format */}
              <div className={`responsive-desk-table ${isMobile ? 'hidden' : 'hidden sm:block'} w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden`}>
                <div className="grid grid-cols-12 text-xs font-bold text-slate-700 py-3.5 px-4 bg-slate-50/90 border-b border-slate-200">
                  <div className="col-span-5">Tên bàn học</div>
                  <div className="col-span-4 text-left">Tài liệu & ghi chú</div>
                  <div className="col-span-3 text-right pr-2">Mở lần cuối & Thao tác</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {displayedSpaces.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 italic">
                      Chưa có bàn học nào phù hợp với tìm kiếm
                    </div>
                  ) : (
                    displayedSpaces.map((space, idx) => {
                      const cleanSpaceName = space.name.replace(/\(Demo\)/i, '').trim();
                      const isDemo = space.name.includes('(Demo)');

                      return (
                        <div
                          key={space.id}
                          onClick={() => handleOpenSpace(space.id)}
                          className="grid grid-cols-12 items-center py-3.5 px-4 hover:bg-[#F0FDF4]/70 transition-all cursor-pointer group"
                        >
                          {/* Cột 1: Tên & Thumbnail (col-span-5) */}
                          <div className="col-span-5 pr-3 flex items-center gap-3">
                            <div className="w-13 h-9 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:border-[#16A34A]/60 transition-colors">
                              {idx % 2 === 0 ? (
                                <div className="w-7 h-5 rounded-xs border border-green-700 bg-white flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-2xs bg-[#bbf7d0]" />
                                </div>
                              ) : (
                                <div className="flex gap-0.5">
                                  <div className="w-3.5 h-5 rounded-xs bg-white border border-slate-300" />
                                  <div className="w-3.5 h-5 rounded-xs bg-white border border-slate-300" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors truncate">
                                  {cleanSpaceName}
                                </span>
                                {isDemo && (
                                  <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 border border-green-200 px-1.5 py-0.2 rounded shrink-0">
                                    Mẫu
                                  </span>
                                )}
                              </div>
                              {space.description && (
                                <div className="text-xs text-slate-500 truncate mt-0.5">
                                  {space.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Cột 2: Tài liệu & Ghi chú (col-span-4) */}
                          <div className="col-span-4 text-xs text-slate-600 font-medium">
                            {getSpaceSummary(space, idx)}
                          </div>

                          {/* Cột 3: Thời gian & Nút Vào bàn (col-span-3) */}
                          <div className="col-span-3 flex items-center justify-end gap-2.5 pr-1">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{getRecentTimeString(idx)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSpace(space.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-green-50 group-hover:bg-[#16A34A] text-[#166534] group-hover:text-white border border-green-200 group-hover:border-[#16A34A] text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                            >
                              <span>Vào bàn</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mobile Vertical Card List — Triệt tiêu cuộn ngang */}
              <div className={`responsive-desk-cards ${isMobile ? 'block' : 'hidden sm:hidden'} space-y-3`}>
                {displayedSpaces.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-2xl">
                    Chưa có bàn học nào phù hợp với tìm kiếm
                  </div>
                ) : (
                  displayedSpaces.map((space, idx) => {
                    const cleanSpaceName = space.name.replace(/\(Demo\)/i, '').trim();
                    const isDemo = space.name.includes('(Demo)');

                    return (
                      <div
                        key={space.id}
                        onClick={() => handleOpenSpace(space.id)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs active:bg-[#F0FDF4]/50 transition-all flex flex-col gap-3"
                      >
                        {/* Top: Thumbnail, Tên bàn học & Thời gian */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-8 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {idx % 2 === 0 ? (
                                <div className="w-6 h-4 rounded-xs border border-green-700 bg-white flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-2xs bg-[#bbf7d0]" />
                                </div>
                              ) : (
                                <div className="flex gap-0.5">
                                  <div className="w-3 h-4 rounded-xs bg-white border border-slate-300" />
                                  <div className="w-3 h-4 rounded-xs bg-white border border-slate-300" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {cleanSpaceName}
                                </span>
                                {isDemo && (
                                  <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 border border-green-200 px-1.5 py-0.2 rounded shrink-0">
                                    Mẫu
                                  </span>
                                )}
                              </div>
                              {space.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                                  {space.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{getRecentTimeString(idx)}</span>
                          </span>
                        </div>

                        {/* Middle: Tóm tắt tài liệu & ghi chú */}
                        <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                          {getSpaceSummary(space, idx)}
                        </div>

                        {/* Bottom: Nút Vào bàn full-width min-h-[44px] */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSpace(space.id);
                          }}
                          className="w-full py-2.5 rounded-xl bg-[#F0FDF4] hover:bg-[#16A34A] text-[#166534] hover:text-white border border-[#BBF7D0] hover:border-[#16A34A] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] active:scale-98"
                        >
                          <span>Vào bàn học</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

      </main>

      {/* ================= FIXED BOTTOM NAVIGATION BAR (<640px & Touch Mobile) ================= */}
      <nav
        aria-label="Mobile Navigation"
        className={`responsive-bottom-nav fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe ${
          isMobile ? 'flex' : 'hidden sm:hidden'
        } items-center justify-around h-16 shadow-lg`}
      >
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
            activeNav === 'home' ? 'text-[#16A34A] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeNav === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Trang chủ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('my_desks')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
            activeNav === 'my_desks' ? 'text-[#16A34A] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${activeNav === 'my_desks' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Bàn học</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('friends')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors relative ${
            activeNav === 'friends' ? 'text-[#16A34A] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className={`w-5 h-5 ${activeNav === 'friends' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Bạn bè</span>
          {onlineCount > 0 && (
            <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors text-slate-500 hover:text-[#16A34A]"
        >
          <CalendarDays className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Nhật ký</span>
        </Link>

        <Link
          href="/faq"
          className="flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors text-slate-500 hover:text-[#16A34A]"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">Hỏi đáp</span>
        </Link>
      </nav>

      {/* MODAL: Thú Cưng Học Tập & Điểm Danh */}
      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />
    </div>
  );
}
