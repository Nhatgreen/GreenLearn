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
  MousePointer2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStudySpace } from '@/context/StudySpaceContext';
import { usePetMascot } from '@/hooks/usePetMascot';
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
  const [activeNav, setActiveNav] = useState<'home' | 'my_desks' | 'starred'>('home');

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
    <div className="w-full min-h-screen bg-[#faf8f5] text-stone-900 flex font-sans selection:bg-green-100 selection:text-[#16A34A]">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-64 flex-shrink-0 border-r border-[#ece7e1] bg-[#faf8f5] p-5 flex flex-col justify-between min-h-screen sticky top-0 h-screen overflow-y-auto no-scrollbar">
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
            <div className="flex items-center gap-2 bg-[#f3eee8] border border-stone-200/90 rounded-xl px-3 py-2 text-xs text-stone-800 focus-within:border-stone-400 focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm bàn học, tài liệu..."
                className="w-full bg-transparent placeholder:text-stone-500 text-stone-800 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveNav('home')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeNav === 'home'
                  ? 'bg-[#eee8df] text-stone-900 font-bold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-[#f3eee7]'
              }`}
            >
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => {
                setActiveNav('my_desks');
                onEnterDesk();
              }}
              className={`w-full text-left px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeNav === 'my_desks'
                  ? 'bg-[#eee8df] text-stone-900 font-bold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-[#f3eee7]'
              }`}
            >
              <span>Bàn học của tôi</span>
            </button>

            <button
              onClick={() => setActiveNav('starred')}
              className={`w-full text-left px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                activeNav === 'starred'
                  ? 'bg-[#eee8df] text-stone-900 font-bold'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-[#f3eee7]'
              }`}
            >
              <span>Đã gắn dấu sao</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full block px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-[#f3eee7] transition-colors"
            >
              Nhật ký học
            </Link>

            <Link
              href="/faq"
              className="w-full block px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-[#f3eee7] transition-colors"
            >
              Hỏi đáp
            </Link>

            <Link
              href="/about"
              className="w-full block px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-[#f3eee7] transition-colors"
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
            className="w-full p-3 rounded-2xl bg-white border border-[#e8dfd3] hover:border-green-300 text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center p-1 flex-shrink-0">
                <img
                  src={currentImageUrl}
                  alt={pet.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 truncate">{pet.name}</span>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-1.5 py-0.5 rounded-full">
                    Cấp {pet.stage}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 truncate">
                  Chuỗi {pet.streakDays} ngày • {pet.isSleeping ? 'Đang ngủ' : 'Tỉnh táo'}
                </p>
              </div>
            </div>
          </button>

          {/* Widget: Mục tiêu học hôm nay */}
          <div className="p-3.5 rounded-2xl bg-[#f5efe6] border border-[#e8dfd3]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#16A34A]" />
                Mục tiêu hôm nay
              </span>
              <span className="text-[11px] font-bold text-[#16A34A]">1 / 4 phiên</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200/90 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: '25%' }} />
            </div>
            <p className="text-[10px] text-stone-600 leading-tight">
              Hoàn thành 25 phút Pomodoro để duy trì chuỗi học.
            </p>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 md:p-10 flex flex-col max-w-6xl mx-auto overflow-y-auto">
        {/* Sticky Top Bar (Cố định khi cuộn) */}
        <header className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 py-3.5 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#ece7e1] flex items-center justify-between mb-6">
          {/* Breadcrumb bên trái */}
          <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
            <span>Không gian học tập</span>
            <span>/</span>
            <span className="text-stone-900 font-bold">Bàn học của {shortName}</span>
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
                  ? 'bg-emerald-50/90 border border-emerald-200 text-emerald-800'
                  : 'bg-white border border-stone-200/90 text-stone-800 hover:border-[#16A34A] hover:shadow-xs'
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
              className="w-8.5 h-8.5 rounded-full border border-stone-300 hover:border-[#16A34A] bg-white shadow-2xs overflow-hidden flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={userName}
                  className="w-full h-full object-cover"
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
            <button onClick={() => setClaimFeedback(null)} className="text-stone-400 hover:text-stone-600 font-bold px-1.5 cursor-pointer">✕</button>
          </div>
        )}

        {/* Lời chào: Căn trái cùng trục với các khối bên dưới, kích thước 36-40px gọn gàng */}
        <div className="mb-8 mt-1 text-left">
          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
            Ôn bài thôi, <span className="text-[#16A34A] font-serif font-normal">{shortName}</span>
          </h1>
        </div>

        {/* ================= SECTION 1: Bắt đầu bàn học mới ================= */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-sm md:text-base font-bold text-stone-900">Bắt đầu bàn học mới</h2>
              <p className="text-xs md:text-sm text-stone-700 font-medium mt-0.5">
                Chọn một mẫu, hoặc mở bàn trống rồi thả tài liệu vào.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectTemplate('blank')}
              className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Tạo bàn học</span>
            </button>
          </div>

          {/* 4 Template Cards với hình xem trước lớn và mô tả rõ ràng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Bàn học trống (Viền trung tính, chỉ hiện cam khi hover/focus) */}
            <div
              onClick={() => handleSelectTemplate('blank')}
              className="bg-white border border-stone-200/90 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center bg-stone-50/70 group-hover:border-[#16A34A]/60 transition-colors gap-1.5">
                <Plus className="w-7 h-7 text-stone-400 group-hover:text-[#16A34A] stroke-[1.8] transition-colors" />
                <span className="text-[11px] font-medium text-stone-600">Thả tài liệu vào đây</span>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-stone-900 group-hover:text-[#16A34A] transition-colors">
                Bàn học trống
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Bàn học tự do, kéo thả tài liệu tùy ý
              </p>
            </div>

            {/* Card 2: Ôn thi giữa kỳ */}
            <div
              onClick={() => handleSelectTemplate('midterm')}
              className="bg-white border border-stone-200/90 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-[#eef1f5] p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#e8ebf0] transition-colors">
                {/* Cuốn sách nâu lớn rõ chi tiết */}
                <div className="w-24 h-16 rounded-xs border-2 border-[#5c3920] bg-white shadow-xs flex overflow-hidden">
                  <div className="w-1/2 border-r border-stone-200 p-1.5 flex flex-col gap-1">
                    <div className="w-8 h-0.5 bg-stone-400 rounded-full" />
                    <div className="w-6 h-0.5 bg-stone-300 rounded-full" />
                    <div className="w-7 h-0.5 bg-stone-300 rounded-full" />
                  </div>
                  <div className="w-1/2 p-1.5 flex flex-col gap-1">
                    <div className="w-7 h-0.5 bg-[#16A34A] rounded-full" />
                    <div className="w-8 h-0.5 bg-stone-300 rounded-full" />
                    <div className="w-5 h-0.5 bg-stone-300 rounded-full" />
                  </div>
                </div>
                {/* Tờ ghi chú vàng cạnh sách */}
                <div className="w-10 h-13 rounded-2xs bg-[#fef08a] border border-amber-200/80 shadow-xs p-1 flex flex-col gap-1">
                  <div className="w-full h-1 bg-amber-300/80 rounded-2xs" />
                  <div className="w-6 h-0.5 bg-amber-600/60 rounded-full mt-1" />
                  <div className="w-7 h-0.5 bg-amber-600/40 rounded-full" />
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-stone-900 group-hover:text-[#16A34A] transition-colors">
                Ôn thi giữa kỳ
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Giáo trình lý thuyết + vở ghi chú vàng
              </p>
            </div>

            {/* Card 3: Giáo trình + đề thi */}
            <div
              onClick={() => handleSelectTemplate('curriculum_exam')}
              className="bg-white border border-stone-200/90 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-[#eef1f5] p-3 flex items-center justify-center gap-3 relative overflow-hidden group-hover:bg-[#e8ebf0] transition-colors">
                {/* 2 Tờ tài liệu A4 song song */}
                <div className="w-14 h-18 rounded-xs bg-white border border-stone-300/90 shadow-xs p-1.5 flex flex-col gap-1">
                  <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                  <div className="w-10 h-0.5 bg-stone-300 rounded-full mt-1" />
                  <div className="w-8 h-0.5 bg-stone-300 rounded-full" />
                  <div className="w-9 h-0.5 bg-stone-200 rounded-full" />
                </div>
                <div className="w-14 h-18 rounded-xs bg-white border border-stone-300/90 shadow-xs p-1.5 flex flex-col gap-1 relative">
                  <div className="w-8 h-1 bg-blue-500 rounded-full" />
                  <div className="w-10 h-0.5 bg-stone-300 rounded-full mt-1" />
                  <div className="w-9 h-0.5 bg-stone-300 rounded-full" />
                  {/* Sticky note nhỏ đè góc */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-7 rounded-2xs bg-[#fef08a] border border-amber-200 shadow-xs" />
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-stone-900 group-hover:text-[#16A34A] transition-colors">
                Giáo trình + đề thi
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Giáo trình và đề thi mở song song
              </p>
            </div>

            {/* Card 4: Học nhóm (Vẽ lại 2 con trỏ chuột kèm tên trực quan) */}
            <div
              onClick={() => handleSelectTemplate('group_study')}
              className="bg-white border border-stone-200/90 rounded-2xl p-3.5 flex flex-col hover:border-[#16A34A] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-[#eef1f5] p-3 flex items-center justify-center relative overflow-hidden group-hover:bg-[#e8ebf0] transition-colors">
                {/* Bìa sổ chung ở trung tâm */}
                <div className="w-22 h-15 rounded-xs bg-[#5c3920] shadow-xs flex items-center justify-center opacity-85">
                  <div className="w-16 h-10 border border-amber-200/30 rounded-2xs flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-amber-100 tracking-wider">ROOM</span>
                  </div>
                </div>

                {/* Con trỏ chuột 1: Màu Cam ViT kèm nhãn tên "Thành" */}
                <div className="absolute top-2.5 left-4 flex items-start gap-0.5">
                  <MousePointer2 className="w-4 h-4 text-[#16A34A] fill-[#16A34A] -rotate-12 drop-shadow-xs" />
                  <span className="px-1.5 py-0.5 bg-[#16A34A] text-white text-[9px] font-bold rounded-md shadow-xs leading-none">
                    {shortName}
                  </span>
                </div>

                {/* Con trỏ chuột 2: Màu Tím kèm nhãn tên "Bạn học" */}
                <div className="absolute bottom-2.5 right-4 flex items-start gap-0.5">
                  <MousePointer2 className="w-4 h-4 text-purple-600 fill-purple-600 -rotate-12 drop-shadow-xs" />
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-bold rounded-md shadow-xs leading-none">
                    Bạn học
                  </span>
                </div>
              </div>
              <span className="mt-3 text-xs md:text-sm font-bold text-stone-900 group-hover:text-[#16A34A] transition-colors">
                Học nhóm
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                Cùng bạn bè ôn bài thời gian thực
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: Mở lại gần đây ================= */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-bold text-stone-900">Mở lại gần đây</h2>
            {spaces.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSpaces(!showAllSpaces)}
                className="text-xs font-bold text-[#16A34A] hover:text-[#166534] hover:underline cursor-pointer"
              >
                {showAllSpaces ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="w-full">
            {/* Table Header: Chữ xám đậm đạt tương phản */}
            <div className="grid grid-cols-12 text-xs font-bold text-stone-700 pb-2.5 border-b border-stone-200 px-3 tracking-wider uppercase">
              <div className="col-span-6">Tên bàn học</div>
              <div className="col-span-3 text-left">Tài liệu & Ghi chú</div>
              <div className="col-span-3 text-right pr-2">Mở lần cuối</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-stone-100">
              {displayedSpaces.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 italic">
                  Chưa có bàn học nào phù hợp với tìm kiếm
                </div>
              ) : (
                displayedSpaces.map((space, idx) => {
                  return (
                    <div
                      key={space.id}
                      onClick={() => handleOpenSpace(space.id)}
                      className="grid grid-cols-12 items-center py-3 px-3 rounded-xl hover:bg-stone-100/80 transition-colors cursor-pointer group"
                    >
                      {/* Name & Subtitle kèm Thumbnail nhỏ 56x40px */}
                      <div className="col-span-6 pr-3 flex items-center gap-3">
                        {/* Ảnh thu nhỏ bàn học 56x40px */}
                        <div className="w-14 h-10 rounded-lg bg-[#f1ede6] border border-stone-300/80 shadow-2xs flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:border-[#16A34A]/60 transition-colors">
                          {idx % 2 === 0 ? (
                            <div className="w-7 h-5 rounded-xs border border-[#5c3920] bg-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-2xs bg-[#fef08a]" />
                            </div>
                          ) : (
                            <div className="flex gap-0.5">
                              <div className="w-4 h-6 rounded-xs bg-white border border-stone-300" />
                              <div className="w-4 h-6 rounded-xs bg-white border border-stone-300" />
                            </div>
                          )}
                        </div>

                        {/* Text info */}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-stone-900 group-hover:text-[#16A34A] transition-colors truncate">
                            {space.name}
                          </div>
                          {space.description && (
                            <div className="text-xs text-stone-600 truncate mt-0.5">
                              {space.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary of Items */}
                      <div className="col-span-3 text-xs text-stone-700 font-medium">
                        {getSpaceSummary(space, idx)}
                      </div>

                      {/* Specific Last Opened Time */}
                      <div className="col-span-3 text-xs text-stone-600 text-right pr-2">
                        {getRecentTimeString(idx)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

      </main>

      {/* MODAL: Thú Cưng Học Tập & Điểm Danh */}
      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />
    </div>
  );
}
