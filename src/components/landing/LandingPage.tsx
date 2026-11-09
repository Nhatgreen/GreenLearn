'use client';

import React from 'react';
import Link from 'next/link';
import { HeroSection } from './HeroSection';
import { FeatureGrid } from './FeatureGrid';
import { PricingSection } from './PricingSection';
import { SiteFooter } from '../common/SiteFooter';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, ArrowRight, User } from 'lucide-react';

interface LandingPageProps {
  onEnterDesk: () => void;
}

export function LandingPage({ onEnterDesk }: LandingPageProps) {
  const { user, status } = useAuth();

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Thanh điều hướng đầu trang */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white flex items-center justify-center font-bold shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">GreenLearn</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <Link href="/dashboard" className="hover:text-[#16A34A] transition-colors">
              Nhật ký học
            </Link>
            <Link href="/faq" className="hover:text-[#16A34A] transition-colors">
              Hỏi đáp
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {status === 'authenticated' && user ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Đăng nhập
              </Link>
            )}

            <button
              type="button"
              onClick={onEnterDesk}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Vào bàn học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="flex-1">
        <HeroSection onEnterDesk={onEnterDesk} />
        <FeatureGrid />
        <PricingSection onSelectPackage={onEnterDesk} />
      </main>

      {/* Chân trang */}
      <SiteFooter />
    </div>
  );
}
