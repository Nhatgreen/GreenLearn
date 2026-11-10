'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { DeleteAccount } from '@/components/profile/DeleteAccount';
import { usePetMascot } from '@/hooks/usePetMascot';
import { PetMascotModal } from '@/components/pet/PetMascotModal';
import { ArrowLeft, LogOut, Loader2, Sparkles, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, status, signOut, isLoading } = useAuth();
  const { pet, info, currentImageUrl } = usePetMascot();
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  const fromParam = searchParams.get('from');
  const [returnDestination, setReturnDestination] = useState<'desk' | 'home'>('home');

  useEffect(() => {
    if (fromParam === 'desk' || fromParam === 'home') {
      setReturnDestination(fromParam);
      return;
    }
    // Fallback: check last active view saved in sessionStorage
    try {
      const stored = sessionStorage.getItem('greenlearn_last_view') || sessionStorage.getItem('vitudy_last_view');
      if (stored === 'desk' || stored === 'home') {
        setReturnDestination(stored);
      }
    } catch {
      // ignore
    }
  }, [fromParam]);

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/auth');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const returnHref = returnDestination === 'desk' ? '/?view=desk' : '/?view=home';
  const returnLabel = returnDestination === 'desk' ? 'Về Bàn Học' : 'Về Trang Chủ';

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Ưu tiên router.back() nếu lịch sử trình duyệt còn trong trang
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(returnHref);
    }
  };

  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={returnHref}
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{returnLabel}</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* 1. Profile Header */}
        <ProfileHeader profile={profile} email={user.email || ''} />

        {/* 2. Thú Cưng Đồng Hành */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gradient-to-b from-green-50 to-slate-50 border border-green-200/80 rounded-2xl p-1.5 shadow-2xs">
                <img
                  src={currentImageUrl}
                  alt={pet.name}
                  className="w-full h-full object-contain"
                />
                <span className={`absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white ${
                  pet.streakDays > 0 ? 'bg-[#16A34A] text-white' : 'bg-slate-400 text-white'
                }`}>
                  Cấp {pet.stage}
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-bold text-slate-900">Thú cưng: {pet.name}</h3>
                  <span className="text-xs font-bold text-[#16A34A] bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    {info.title}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    pet.isSleeping ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {pet.isSleeping ? <Moon className="w-3 h-3 text-slate-500" /> : <Sun className="w-3 h-3 text-[#16A34A]" />}
                    <span>{pet.isSleeping ? 'Đang say giấc' : 'Đang thức'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chuỗi học tập liên tục: <span className="font-bold text-slate-800">{pet.streakDays} ngày</span> • Đã mở khóa {pet.unlockedStages.length}/5 cấp độ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPetModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100/80 border border-green-300 text-[#166534] text-xs font-bold transition-all cursor-pointer active:scale-95 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Xem thú cưng</span>
            </button>
          </div>
        </div>

        {/* 3. Account Settings (Name & BYOK) */}
        <AccountSettings profile={profile} />

        {/* 4. Delete Account Zone */}
        <DeleteAccount userEmail={user.email || ''} />
      </div>

      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
