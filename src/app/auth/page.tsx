'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAssetPath } from '@/lib/assets';

export default function AuthPage() {
  const router = useRouter();
  const { user, status, signIn, signUp, signInWithOAuth, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace('/');
    }
  }, [status, user, router]);

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setOauthError(null);
    const res = await signInWithOAuth(provider);
    if (!res.success && res.error) {
      setOauthError(res.error);
    }
  };

  const handleSignIn = async (email: string, pass: string) => {
    setOauthError(null);
    const res = await signIn(email, pass);
    if (res.success) {
      router.replace('/');
    }
    return res;
  };

  const handleSignUp = async (email: string, pass: string, name?: string) => {
    setOauthError(null);
    const res = await signUp(email, pass, name);
    if (res.success) {
      router.replace('/');
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-[#16A34A] font-black text-xl mb-3 shadow-xs border border-green-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getAssetPath('/icons/greenlearn-icon.png')} 
              alt="GreenLearn" 
              width={36} 
              height={36} 
              className="w-9 h-9 object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Đăng nhập GreenLearn' : 'Đăng ký tài khoản GreenLearn'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' 
              ? 'Tiếp tục không gian học tập và đồng bộ dữ liệu đám mây' 
              : 'Không gian học tập 2.5D hoàn toàn miễn phí'}
          </p>
        </div>

        {/* OAuth Notification/Error Banner */}
        {oauthError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed animate-fade-in">
            {oauthError}
          </div>
        )}

        {/* OAuth Providers */}
        <OAuthButtons onOAuth={handleOAuth} disabled={isLoading} />

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 bg-white px-2">
            hoặc với email
          </div>
        </div>

        {/* Credentials Form */}
        <AuthForm
          mode={mode}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isLoading={isLoading}
        />

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-slate-600">
          {mode === 'login' ? (
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-[#16A34A] hover:underline"
              >
                Đăng ký ngay
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-[#16A34A] hover:underline"
              >
                Đăng nhập
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Back to Guest Desk */}
      <div className="mt-4">
        <Link
          href="/?view=desk"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về bàn học (Chế độ khách)</span>
        </Link>
      </div>
    </div>
  );
}
