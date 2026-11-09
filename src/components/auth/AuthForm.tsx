'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthResult } from '@/context/AuthContext';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSignIn?: (email: string, pass: string) => Promise<AuthResult>;
  onSignUp?: (email: string, pass: string, name?: string) => Promise<AuthResult>;
  isLoading?: boolean;
  error?: string | null;
}

export function AuthForm({ mode, onSignIn, onSignUp, isLoading = false, error: externalError }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (mode === 'login' && onSignIn) {
      const res = await onSignIn(email, password);
      if (!res.success && res.error) {
        setLocalError(res.error);
      }
    } else if (mode === 'signup' && onSignUp) {
      const res = await onSignUp(email, password, displayName);
      if (!res.success && res.error) {
        setLocalError(res.error);
      }
    }
  };

  const errorMessage = localError || externalError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" spellCheck={false}>
      {mode === 'signup' && (
        <div>
          <label htmlFor="displayName" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Họ và tên
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@vidu.com"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium leading-relaxed">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <span>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</span>
        )}
      </button>
    </form>
  );
}
