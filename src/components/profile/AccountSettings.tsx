'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { 
  Check, 
  Loader2, 
  KeyRound, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  Activity, 
  ExternalLink,
  ShieldCheck,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface AccountSettingsProps {
  profile: UserProfile | null;
}

export function AccountSettings({ profile }: AccountSettingsProps) {
  const { refreshProfile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [initialDisplayName, setInitialDisplayName] = useState(profile?.display_name || '');
  
  const [nickname, setNickname] = useState('');
  const [initialNickname, setInitialNickname] = useState('');

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Khóa AI cá nhân (lưu 100% trong LocalStorage trình duyệt)
  const [openAiKey, setOpenAiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  const [initialOpenAi, setInitialOpenAi] = useState('');
  const [initialGemini, setInitialGemini] = useState('');

  const [byokSaved, setByokSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ provider: string; status: 'loading' | 'success' | 'error'; message: string } | null>(null);

  // Khởi tạo họ tên & nickname
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
      setInitialDisplayName(profile.display_name);
    }
    if (typeof window !== 'undefined') {
      const storedNick = localStorage.getItem('vitudy_user_nickname') || '';
      setNickname(storedNick);
      setInitialNickname(storedNick);

      const storedOpenAi = localStorage.getItem('vitudy_byok_openai') || '';
      const storedGemini = localStorage.getItem('vitudy_byok_gemini') || '';
      setOpenAiKey(storedOpenAi);
      setInitialOpenAi(storedOpenAi);
      setGeminiKey(storedGemini);
      setInitialGemini(storedGemini);
    }
  }, [profile?.display_name]);

  const hasNameChanged = displayName.trim() !== initialDisplayName.trim() || nickname.trim() !== initialNickname.trim();
  const hasByokChanged = openAiKey.trim() !== initialOpenAi.trim() || geminiKey.trim() !== initialGemini.trim();

  // Xác định phương thức đăng nhập
  const provider = user?.app_metadata?.provider || 'email';
  const providerLabel = provider === 'google' ? 'Tài khoản Google' : 'Mật khẩu & Email';

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !hasNameChanged) return;

    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError('Họ và tên không được để trống.');
      return;
    }

    setIsUpdatingName(true);
    setNameError(null);
    setNameSuccess(false);

    // Lưu nickname vào LocalStorage để đồng bộ với lời chào trang chủ
    if (typeof window !== 'undefined') {
      localStorage.setItem('vitudy_user_nickname', nickname.trim());
      setInitialNickname(nickname.trim());
    }

    const supabase = getSupabase();
    if (!supabase) {
      setNameSuccess(true);
      setInitialDisplayName(trimmed);
      setTimeout(() => setNameSuccess(false), 3000);
      setIsUpdatingName(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', profile.id);

      if (error) throw error;

      setNameSuccess(true);
      setInitialDisplayName(trimmed);
      await refreshProfile();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      setNameError(err.message || 'Lỗi cập nhật họ và tên.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleSaveByok = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('vitudy_byok_openai', openAiKey.trim());
      localStorage.setItem('vitudy_byok_gemini', geminiKey.trim());
      setInitialOpenAi(openAiKey.trim());
      setInitialGemini(geminiKey.trim());
      setByokSaved(true);
      setTimeout(() => setByokSaved(false), 3000);
    }
  };

  const handleClearKey = (provider: 'openai' | 'gemini') => {
    if (typeof window !== 'undefined') {
      if (provider === 'openai') {
        localStorage.removeItem('vitudy_byok_openai');
        setOpenAiKey('');
        setInitialOpenAi('');
      } else {
        localStorage.removeItem('vitudy_byok_gemini');
        setGeminiKey('');
        setInitialGemini('');
      }
      setByokSaved(true);
      setTimeout(() => setByokSaved(false), 2000);
    }
  };

  const handleTestKey = async (provider: 'openai' | 'gemini') => {
    const key = provider === 'openai' ? openAiKey.trim() : geminiKey.trim();
    if (!key) {
      setTestResult({
        provider,
        status: 'error',
        message: 'Vui lòng nhập khóa API trước khi kiểm tra.',
      });
      return;
    }

    setTestResult({ provider, status: 'loading', message: 'Đang kiểm tra kết nối API...' });

    try {
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
          setTestResult({ provider, status: 'success', message: 'Kết nối Google Gemini thành công (Độ trễ thấp)!' });
        } else {
          setTestResult({ provider, status: 'error', message: 'Khóa Gemini không hợp lệ hoặc đã hết hạn mức.' });
        }
      } else {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` }
        });
        if (res.ok) {
          setTestResult({ provider, status: 'success', message: 'Kết nối OpenAI API thành công!' });
        } else {
          setTestResult({ provider, status: 'error', message: 'Khóa OpenAI không hợp lệ hoặc sai quyền truy cập.' });
        }
      }
    } catch {
      setTestResult({ provider, status: 'error', message: 'Lỗi mạng hoặc không thể kết nối tới máy chủ AI.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Account Name & Nickname Form */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
          <UserCheck className="w-4 h-4 text-slate-700" />
          <span>Thông tin cá nhân</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Tên hiển thị này sẽ xuất hiện trên bàn học, trong các phòng học nhóm và lời chào trang chủ.
        </p>

        <form onSubmit={handleUpdateName} className="space-y-4">
          {/* Email (Chỉ đọc) kèm phương thức đăng nhập */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email tài khoản</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={user?.email || profile?.email || ''}
                className="w-full max-w-md px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono outline-none cursor-not-allowed select-all"
              />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{providerLabel}</span>
              </span>
            </div>
          </div>

          {/* Họ và tên đầy đủ */}
          <div>
            <label htmlFor="accountDisplayName" className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên đầy đủ
            </label>
            <input
              id="accountDisplayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập họ và tên của bạn"
              className="w-full max-w-md px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E0562D]/20 focus:border-[#E0562D] transition-all"
            />
          </div>

          {/* Tên gọi ngắn */}
          <div>
            <label htmlFor="accountNickname" className="block text-xs font-semibold text-slate-700 mb-1">
              Tên gọi ngắn (Dùng cho lời chào trang chủ & bàn học)
            </label>
            <input
              id="accountNickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="VD: Thành (để hiển thị &quot;Ôn bài thôi, Thành&quot;)"
              className="w-full max-w-md px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E0562D]/20 focus:border-[#E0562D] transition-all"
            />
          </div>

          {nameError && <p className="text-xs text-red-600 font-medium">{nameError}</p>}
          {nameSuccess && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu thông tin cá nhân thành công!</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isUpdatingName || !hasNameChanged}
            className="px-4 py-2.5 bg-[#E0562D] hover:bg-[#c9451e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            {isUpdatingName ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : nameSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </form>
      </section>

      {/* 2. Khóa AI của riêng bạn (Thay thế thuật ngữ BYOK) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Khóa AI của riêng bạn</h3>
          </div>
          <Link
            href="/?view=desk"
            className="text-[11px] font-bold text-[#E0562D] hover:underline inline-flex items-center gap-1"
            title="Mở giao diện Cài đặt AI đầy đủ trên bàn học"
          >
            <span>Mở Cài đặt kết nối AI</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Khóa API cá nhân chỉ được lưu trữ cục bộ 100% trong trình duyệt máy của bạn (không gửi về máy chủ ViTudy). Khi sử dụng khóa riêng, bạn được miễn phí 0 ViToken cho mọi lượt hỏi bài.
        </p>

        <form onSubmit={handleSaveByok} className="space-y-4 max-w-lg">
          {/* OpenAI Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="byokOpenAi" className="text-xs font-semibold text-slate-700">
                OpenAI API Key (sk-...)
              </label>
              {openAiKey && (
                <button
                  type="button"
                  onClick={() => handleClearKey('openai')}
                  className="text-[10px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Xóa khóa</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  id="byokOpenAi"
                  type={showOpenAi ? 'text' : 'password'}
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E0562D]/20 focus:border-[#E0562D] font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAi(!showOpenAi)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showOpenAi ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleTestKey('openai')}
                className="px-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <Activity className="w-3 h-3" />
                <span>Kiểm tra</span>
              </button>
            </div>
          </div>

          {/* Google Gemini Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="byokGemini" className="text-xs font-semibold text-slate-700">
                Google Gemini API Key (AIzaSy...)
              </label>
              {geminiKey && (
                <button
                  type="button"
                  onClick={() => handleClearKey('gemini')}
                  className="text-[10px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Xóa khóa</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  id="byokGemini"
                  type={showGemini ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E0562D]/20 focus:border-[#E0562D] font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleTestKey('gemini')}
                className="px-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <Activity className="w-3 h-3" />
                <span>Kiểm tra</span>
              </button>
            </div>
          </div>

          {/* Test result banner */}
          {testResult && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.status === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : testResult.status === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {testResult.status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              ) : testResult.status === 'success' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          {byokSaved && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Đã lưu khóa API an toàn trên thiết bị của bạn!</span>
            </p>
          )}

          <button
            type="submit"
            disabled={!hasByokChanged}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            Lưu khóa cá nhân
          </button>
        </form>
      </section>
    </div>
  );
}
