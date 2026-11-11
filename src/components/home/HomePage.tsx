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
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStudySpace } from '@/context/StudySpaceContext';
import { usePetMascot } from '@/hooks/usePetMascot';
import { useSocialPresence } from '@/hooks/useSocialPresence';
import { PetMascotModal } from '@/components/pet/PetMascotModal';
import { getAssetPath } from '@/lib/assets';
import { StudySpace } from '@/types/studyspace';

interface HomePageProps {
  onEnterDesk: (spaceId?: string) => void;
  onCreateSpace?: (templateType?: 'blank' | 'midterm' | 'curriculum_exam' | 'group_study') => void;
}

export function HomePage({ onEnterDesk, onCreateSpace }: HomePageProps) {
  const { user, profile, status } = useAuth();
  const { spaces, switchSpace, createSpaceFromTemplate } = useStudySpace();
  const { pet, info, currentImageUrl, isClaimedToday, claimToday } = usePetMascot();
  const router = useRouter();

  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

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
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-5 flex flex-col justify-between min-h-screen sticky top-0 h-screen overflow-y-auto no-scrollbar shadow-2xs">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 mb-5 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetPath('/icons/greenlearn-icon.png')}
              alt="GreenLearn"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-contain shadow-xs flex-shrink-0"
              style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px' }}
            />
            <span className="text-lg font-black tracking-tight select-none leading-none">
              <span className="text-[#16A34A]">Green</span>
              <span className="text-[#242D3D]">Learn</span>
            </span>
          </div>

          {/* Search Input */}
          <div className="relative mb-5">
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
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveNav('home')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                activeNav === 'home'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => {
                setActiveNav('my_desks');
                onEnterDesk();
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                activeNav === 'my_desks'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Bàn học của tôi</span>
            </button>

            <button
              onClick={() => setActiveNav('starred')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                activeNav === 'starred'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Đã gắn dấu sao</span>
            </button>

            <button
              onClick={() => setActiveNav('friends')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                activeNav === 'friends'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 stroke-[2.2]" />
                <span>Bạn bè</span>
              </span>
              {onlineCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#166534] text-[10px] font-bold">
                  {onlineCount} online
                </span>
              )}
            </button>

            <Link
              href="/dashboard"
              className="w-full block px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold"
            >
              Nhật ký học
            </Link>

            <Link
              href="/faq"
              className="w-full block px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold"
            >
              Hỏi đáp
            </Link>

            <Link
              href="/about"
              className="w-full block px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-[#166534] hover:bg-green-50/60 transition-colors font-semibold"
            >
              Giới thiệu & Kỹ thuật
            </Link>
          </nav>
        </div>

        {/* Sidebar Middle / Bottom Section */}
        <div className="pt-2 space-y-3">
          {/* Widget: Thú cưng học tập */}
          <button
            type="button"
            onClick={() => setIsPetModalOpen(true)}
            className="w-full p-3 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-white border border-[#BBF7D0] hover:border-[#16A34A] text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-100/80 border border-green-200 flex items-center justify-center p-1 flex-shrink-0 shadow-2xs">
                <img
                  src={currentImageUrl}
                  alt={pet.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{pet.name}</span>
                  <span className="text-[10px] font-bold text-[#166534] bg-green-100/90 px-1.5 py-0.5 rounded-full">
                    Cấp {pet.stage}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  Chuỗi {pet.streakDays} ngày • {pet.isSleeping ? 'Đang ngủ' : 'Tỉnh táo'}
                </p>
              </div>
            </div>
          </button>

          {/* Widget: Mục tiêu học hôm nay */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#16A34A]" />
                Mục tiêu hôm nay
              </span>
              <span className="text-[11px] font-bold text-[#16A34A]">1 / 4 phiên</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: '25%' }} />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight mb-2.5">
              Hoàn thành phiên 25 phút Pomodoro để duy trì chuỗi học.
            </p>
            <button
              type="button"
              onClick={() => onEnterDesk()}
              className="w-full py-1.5 bg-green-50/80 hover:bg-green-100 border border-green-200 text-[#166534] text-[11px] font-bold rounded-xl transition-colors text-center cursor-pointer active:scale-98"
            >
              Bắt đầu phiên 25p
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 md:p-10 flex flex-col max-w-6xl mx-auto overflow-y-auto">
        {/* Sticky Top Bar (Cố định khi cuộn) */}
        <header className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between mb-6 shadow-2xs">
          {/* Breadcrumb bên trái */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Không gian học tập</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">Bàn học của {shortName}</span>
          </div>

          {/* Nút hành động bên phải */}
          <div className="flex items-center gap-3">
            {/* Streak & Pet Badge */}
            <button
              type="button"
              onClick={() => setIsPetModalOpen(true)}
              title={`Thú cưng: ${pet.name} (Cấp ${pet.stage}) • Chuỗi ${pet.streakDays} ngày liên tiếp (Bấm để xem và điểm danh)`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-2 active:scale-98 ${
                isClaimedToday 
                  ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]'
                  : 'bg-white border border-slate-200 text-slate-800 hover:border-[#16A34A] hover:bg-green-50/50 hover:shadow-xs'
              }`}
            >
              <img
                src={currentImageUrl}
                alt={pet.name}
                className="w-5 h-5 object-contain"
              />
              <span>Chuỗi {pet.streakDays} ngày · {isClaimedToday ? 'Đã điểm danh' : 'Điểm danh'}</span>
            </button>

            {/* Avatar tròn bên phải */}
            <Link
              href="/profile?from=home"
              title={`Hồ sơ cá nhân (${userName})`}
              className="w-8 h-8 rounded-full shrink-0 border border-slate-200 hover:border-[#16A34A] bg-white shadow-2xs overflow-hidden flex items-center justify-center transition-all cursor-pointer active:scale-95"
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
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
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
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer active:scale-95 flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[2.4]" />
                <span>Thêm bạn bè</span>
              </button>
            </div>

            {/* 3 Thẻ thống kê */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Thẻ 1: Tổng bạn bè */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{buddies.length}</div>
                  <div className="text-xs text-slate-500 font-medium">Bạn bè đã lưu</div>
                </div>
              </div>

              {/* Thẻ 2: Đang trực tuyến */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
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
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
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
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  className="flex items-center gap-2"
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
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#16A34A] focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
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

            {/* Thanh Tìm Kiếm & Bộ Lọc */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
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

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={friendsSearch}
                  onChange={(e) => setFriendsSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#16A34A] transition-colors"
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
                      className="bg-white border border-slate-200 hover:border-green-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
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

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
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
                          <div className="text-[11px] mt-0.5">
                            {buddy.online && buddy.currentRoom ? (
                              <span className="text-sky-600 font-semibold truncate block">
                                Phòng: {buddy.currentRoom}
                              </span>
                            ) : buddy.online ? (
                              <span className="text-emerald-600 font-semibold">Đang trực tuyến</span>
                            ) : (
                              <span className="text-slate-400">Ngoại tuyến</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {buddy.online && buddy.currentRoom ? (
                          <button
                            type="button"
                            onClick={() => {
                              requestJoinRoom(buddy.currentRoom!, buddy);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
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
                            className="px-3 py-1.5 rounded-xl bg-[#F0FDF4] hover:bg-green-100 text-[#166534] border border-[#BBF7D0] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
                          >
                            <Send className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>Mời học</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFriend(buddy.id)}
                          title="Xóa bạn khỏi danh sách"
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
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
        ) : (
          <>
            {/* Lời chào: Căn trái cùng trục với các khối bên dưới */}
            <div className="mb-8 mt-1 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-slate-900 tracking-tight">
                  Ôn bài thôi, <span className="text-[#16A34A] font-serif font-bold">{shortName}</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Không gian học thức tích hợp AI 2.5D — Nền tảng học tập mở & miễn phí trọn đời
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-bold self-start sm:self-auto shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Mầm Xanh: Cấp {pet.stage} • {info.title}</span>
              </div>
            </div>

        {/* ================= SECTION 1: Bắt đầu bàn học mới ================= */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900">Bắt đầu bàn học mới</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Chọn một mẫu, hoặc mở bàn trống rồi thả tài liệu vào.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTemplate('blank')}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-green-600/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Tạo bàn học</span>
            </button>
          </div>

          {/* 4 Template Cards với hình xem trước lớn và mô tả rõ ràng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Bàn học trống */}
            <div
              onClick={() => handleSelectTemplate('blank')}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50/70 group-hover:border-[#16A34A] group-hover:bg-[#F0FDF4]/50 transition-colors gap-1.5">
                <Plus className="w-7 h-7 text-slate-400 group-hover:text-[#16A34A] stroke-[1.8] transition-colors" />
                <span className="text-[11px] font-medium text-slate-600 group-hover:text-[#166534]">Thả tài liệu vào đây</span>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                Bàn học trống
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Bàn học tự do, kéo thả tài liệu tùy ý
              </p>
            </div>

            {/* Card 2: Ôn thi giữa kỳ */}
            <div
              onClick={() => handleSelectTemplate('midterm')}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-slate-100 p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#F0FDF4]/60 transition-colors">
                {/* Cuốn sách nâu lớn rõ chi tiết */}
                <div className="w-24 h-16 rounded-xs border-2 border-[#5c3920] bg-white shadow-xs flex overflow-hidden">
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
                <div className="w-10 h-13 rounded-2xs bg-[#fef08a] border border-amber-200/80 shadow-xs p-1 flex flex-col gap-1">
                  <div className="w-full h-1 bg-amber-300/80 rounded-2xs" />
                  <div className="w-6 h-0.5 bg-amber-600/60 rounded-full mt-1" />
                  <div className="w-7 h-0.5 bg-amber-600/40 rounded-full" />
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                Ôn thi giữa kỳ
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Giáo trình lý thuyết + vở ghi chú vàng
              </p>
            </div>

            {/* Card 3: Giáo trình + đề thi */}
            <div
              onClick={() => handleSelectTemplate('curriculum_exam')}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-slate-100 p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#F0FDF4]/60 transition-colors">
                {/* 2 Tờ tài liệu A4 song song */}
                <div className="w-14 h-18 rounded-xs bg-white border border-slate-300 shadow-xs p-1.5 flex flex-col gap-1">
                  <div className="w-8 h-1 bg-[#16A34A] rounded-full" />
                  <div className="w-10 h-0.5 bg-slate-300 rounded-full mt-1" />
                  <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
                  <div className="w-9 h-0.5 bg-slate-200 rounded-full" />
                </div>
                <div className="w-14 h-18 rounded-xs bg-white border border-slate-300 shadow-xs p-1.5 flex flex-col gap-1 relative">
                  <div className="w-8 h-1 bg-sky-600 rounded-full" />
                  <div className="w-10 h-0.5 bg-slate-300 rounded-full mt-1" />
                  <div className="w-9 h-0.5 bg-slate-300 rounded-full" />
                  {/* Sticky note nhỏ đè góc */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-7 rounded-2xs bg-[#fef08a] border border-amber-200 shadow-xs" />
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                Giáo trình + đề thi
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Giáo trình và đề thi mở song song
              </p>
            </div>

            {/* Card 4: Học nhóm */}
            <div
              onClick={() => handleSelectTemplate('group_study')}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-lg hover:shadow-green-600/10 hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-slate-100 p-3 flex items-center justify-center relative overflow-hidden group-hover:bg-[#F0FDF4]/60 transition-colors">
                {/* Bìa sổ chung ở trung tâm */}
                <div className="w-22 h-15 rounded-xs bg-[#242D3D] shadow-xs flex items-center justify-center">
                  <div className="w-16 h-10 border border-green-300/40 rounded-2xs flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-green-300 tracking-wider">ROOM</span>
                  </div>
                </div>

                {/* Con trỏ chuột 1 */}
                <div className="absolute top-2.5 left-4 flex items-start gap-0.5">
                  <MousePointer2 className="w-4 h-4 text-[#16A34A] fill-[#16A34A] -rotate-12 drop-shadow-xs" />
                  <span className="px-1.5 py-0.5 bg-[#16A34A] text-white text-[9px] font-bold rounded-md shadow-xs leading-none">
                    {shortName}
                  </span>
                </div>

                {/* Con trỏ chuột 2 */}
                <div className="absolute bottom-2.5 right-4 flex items-start gap-0.5">
                  <MousePointer2 className="w-4 h-4 text-emerald-600 fill-emerald-600 -rotate-12 drop-shadow-xs" />
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-md shadow-xs leading-none">
                    Bạn học
                  </span>
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                Học nhóm
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Cùng bạn bè ôn bài thời gian thực
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: Mở lại gần đây ================= */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-bold text-slate-900">Mở lại gần đây</h2>
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

          {/* Table Container */}
          <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Table Header: Chữ xám đậm đạt tương phản */}
            <div className="grid grid-cols-12 text-xs font-bold text-slate-500 py-3 px-4 bg-slate-50/80 border-b border-slate-200">
              <div className="col-span-6">Tên bàn học</div>
              <div className="col-span-3 text-left">Tài liệu & ghi chú</div>
              <div className="col-span-3 text-right pr-2">Mở lần cuối</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {displayedSpaces.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
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
                      className="grid grid-cols-12 items-center py-3.5 px-4 hover:bg-[#F0FDF4]/50 transition-colors cursor-pointer group"
                    >
                      {/* Name & Subtitle kèm Thumbnail nhỏ 56x40px */}
                      <div className="col-span-6 pr-3 flex items-center gap-3">
                        {/* Ảnh thu nhỏ bàn học 56x40px */}
                        <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:border-[#16A34A]/60 transition-colors">
                          {idx % 2 === 0 ? (
                            <div className="w-7 h-5 rounded-xs border border-green-700 bg-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-2xs bg-[#bbf7d0]" />
                            </div>
                          ) : (
                            <div className="flex gap-0.5">
                              <div className="w-4 h-6 rounded-xs bg-white border border-slate-300" />
                              <div className="w-4 h-6 rounded-xs bg-white border border-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Text info */}
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

                      {/* Summary of Items */}
                      <div className="col-span-3 text-xs text-slate-600 font-medium">
                        {getSpaceSummary(space, idx)}
                      </div>

                      {/* Specific Last Opened Time */}
                      <div className="col-span-3 text-xs text-slate-400 text-right pr-2">
                        {getRecentTimeString(idx)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
        </>
        )}

      </main>

      {/* MODAL: Thú Cưng Học Tập & Điểm Danh */}
      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />
    </div>
  );
}
