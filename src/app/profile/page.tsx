'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { DeleteAccount } from '@/components/profile/DeleteAccount';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
import { ArrowLeft, LogOut, Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, status, signOut, isLoading } = useAuth();

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

        {/* 2. Account Settings (Name & BYOK) */}
        <AccountSettings profile={profile} />

        {/* 3. Payment History Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Lịch sử nạp ViToken</h2>
              <p className="text-xs text-slate-500">Các giao dịch chuyển khoản VietQR qua cổng tự động</p>
            </div>
          </div>

          <PaymentHistory />
        </div>

        {/* 4. Delete Account Zone */}
        <DeleteAccount userEmail={user.email || ''} />
      </div>
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
