'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ByokStore } from '@/lib/byokStore';
import { testAiConnection } from '@/lib/aiClient';
import { 
  Flame, 
  Cpu, 
  ExternalLink, 
  CheckCircle2, 
  X,
  Bot,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Bell
} from 'lucide-react';

interface StreakData {
  streakDays: number;
  lastClaimDate: string | null;
}

const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Khuyên dùng - Phản hồi nhanh & tiết kiệm chi phí' },
  { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship - Trả lời xuất sắc và chi tiết nhất' },
  { id: 'o3-mini', name: 'o3-mini', tag: 'Mô hình lý luận toán học & lập trình sâu' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'Đa nhiệm nâng cao' },
];

export function TopRightWallet() {
  const [mounted, setMounted] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Streak state
  const [streak, setStreak] = useState<StreakData>({ streakDays: 1, lastClaimDate: null });
  const [dailyClaimResult, setDailyClaimResult] = useState<string | null>(null);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState('');

  // AI state
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load streak from localStorage
    try {
      const saved = localStorage.getItem('greenlearn_streak');
      if (saved) {
        setStreak(JSON.parse(saved));
      } else {
        const legacy = localStorage.getItem('vitudy_streak');
        if (legacy) {
          setStreak(JSON.parse(legacy));
        }
      }
    } catch {}

    // Load AI config
    const key = ByokStore.get('openai') || '';
    setApiKeyInput(key);
    try {
      const savedModel = localStorage.getItem('greenlearn_ai_model');
      if (savedModel) setSelectedModel(savedModel);
    } catch {}

    // Daily reminder
    try {
      const savedReminder = localStorage.getItem('greenlearn_daily_reminder');
      if (savedReminder !== null) setDailyReminder(savedReminder === 'true');
    } catch {}
  }, []);

  // Countdown until midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftToMidnight(`${hours}h ${minutes}p`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDailyModalOpen(false);
        setIsAiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const isTodayClaimed = streak.lastClaimDate === todayDateStr;
  const currentDayOfWeek = (new Date().getDay() + 6) % 7; // 0 = T2, 6 = CN

  const handleClaim = () => {
    const nextDays = isTodayClaimed ? streak.streakDays : (streak.streakDays + 1);
    const updated: StreakData = {
      streakDays: nextDays,
      lastClaimDate: todayDateStr,
    };
    setStreak(updated);
    try {
      localStorage.setItem('greenlearn_streak', JSON.stringify(updated));
    } catch {}
    setDailyClaimResult(`Tuyệt vời! Bạn đã duy trì chuỗi học tập ${nextDays} ngày liên tiếp.`);
  };

  const handleTestConnection = async () => {
    setTestConnectionStatus('testing');
    setTestResultMessage(null);
    const res = await testAiConnection({
      model: selectedModel,
      apiKey: apiKeyInput.trim(),
    });
    setTestConnectionStatus(res.success ? 'success' : 'error');
    setTestResultMessage(res.message);
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    ByokStore.set('openai', apiKeyInput.trim());
    try {
      localStorage.setItem('greenlearn_ai_model', selectedModel);
    } catch {}
    setSaveSuccessMessage('Đã lưu cấu hình OpenAI API thành công.');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      setIsAiModalOpen(false);
    }, 1000);
  };

  const WEEK_DAYS = [
    { key: 'mon', label: 'T2', fullLabel: 'Thứ Hai' },
    { key: 'tue', label: 'T3', fullLabel: 'Thứ Ba' },
    { key: 'wed', label: 'T4', fullLabel: 'Thứ Tư' },
    { key: 'thu', label: 'T5', fullLabel: 'Thứ Năm' },
    { key: 'fri', label: 'T6', fullLabel: 'Thứ Sáu' },
    { key: 'sat', label: 'T7', fullLabel: 'Thứ Bảy' },
    { key: 'sun', label: 'CN', fullLabel: 'Chủ Nhật' },
  ];

  return (
    <>
      <div 
        data-tour="wallet-market"
        className="relative flex items-center bg-white/95 border border-slate-300 rounded-2xl p-1.5 shadow-sm backdrop-blur-md pointer-events-auto select-none"
      >
        {/* Daily Streak Button */}
        <button
          onClick={() => {
            setDailyClaimResult(null);
            setIsDailyModalOpen(true);
            setIsAiModalOpen(false);
          }}
          title={`Chuỗi học tập: ${streak.streakDays} ngày liên tiếp (Bấm để điểm danh)`}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer group ${
            isDailyModalOpen ? 'bg-slate-200' : 'hover:bg-slate-100'
          }`}
        >
          {streak.streakDays > 0 ? (
            <div className="relative flex items-center justify-center w-10 h-10">
              <Flame className="w-8.5 h-8.5 text-[#16A34A] fill-[#16A34A] drop-shadow-xs transition-transform group-hover:scale-105" />
              <span className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-black font-mono text-white select-none pointer-events-none leading-none">
                {streak.streakDays}
              </span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center w-10 h-10">
              <Flame className="w-7.5 h-7.5 text-slate-400 stroke-[2] transition-transform group-hover:scale-105" />
              <span className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10.5px] font-bold font-mono text-slate-500 select-none pointer-events-none leading-none">
                0
              </span>
            </div>
          )}
        </button>

        <div className="w-[1px] h-6 bg-slate-200 my-auto mx-0.5" />

        {/* AI Bot Pill */}
        <button
          id="ai-config-trigger-btn"
          data-tour="inteline-btn"
          onClick={() => {
            setIsAiModalOpen(true);
            setIsDailyModalOpen(false);
          }}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer ${
            isAiModalOpen 
              ? 'bg-slate-200 text-slate-900' 
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
          title={`Cài đặt kết nối AI OpenAI (Mô hình: ${selectedModel})`}
        >
          <Bot className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>
      </div>

      {/* MODAL: Điểm danh hằng ngày */}
      {isDailyModalOpen && mounted && createPortal(
        <div 
          id="streak-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDailyModalOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center text-slate-900 animate-fade-in font-sans"
          >
            <button
              id="close-streak-modal"
              onClick={() => setIsDailyModalOpen(false)}
              aria-label="Đóng điểm danh"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-2.5">
              <Flame className="w-7 h-7 text-[#16A34A] fill-[#16A34A]" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Điểm danh hằng ngày
            </h3>
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              Duy trì thói quen học tập đều đặn để tích lũy chuỗi ngày và mở khóa trang phục thú cưng.
            </p>

            {/* 7 Day States Grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-3.5">
              {WEEK_DAYS.map((day, idx) => {
                const isToday = idx === currentDayOfWeek;
                const isPast = idx < currentDayOfWeek;
                const isClaimedToday = isToday && isTodayClaimed;
                const isPastClaimed = isPast && (streak.streakDays >= (currentDayOfWeek - idx));
                const isClaimed = isClaimedToday || isPastClaimed;
                const isMissed = isPast && !isClaimed;

                return (
                  <div key={day.key} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border shadow-2xs select-none relative ${
                        isClaimed
                          ? 'bg-emerald-500 border-emerald-600 text-white font-bold'
                          : isToday && !isTodayClaimed
                          ? 'bg-[#F0FDF4] border-[#16A34A] text-[#166534] font-black ring-2 ring-[#16A34A] ring-offset-2 animate-pulse'
                          : isToday && isTodayClaimed
                          ? 'bg-emerald-500 border-emerald-600 text-white font-bold ring-2 ring-emerald-500 ring-offset-1'
                          : isMissed
                          ? 'bg-slate-100 border-dashed border-slate-300 text-slate-400 opacity-60'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {isClaimed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isMissed ? (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">lỡ</span>
                      ) : (
                        <Flame className="w-4 h-4 text-[#16A34A]" />
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold mt-1.5 select-none ${
                        isToday ? 'text-[#16A34A] font-black' : 'text-slate-600'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Streak Days Progress */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 text-left">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Flame className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
                  <span>Chuỗi {streak.streakDays} ngày liên tiếp</span>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A]">
                  Mốc 7 ngày
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(12, (((streak.streakDays % 7) || (streak.streakDays > 0 ? 7 : 0)) / 7) * 100))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-2 leading-tight">
                Học tập ít nhất 3 phút mỗi ngày để duy trì ngọn lửa học tập xanh mát.
              </div>
            </div>

            {/* Daily Reminder Toggle */}
            <label className="flex items-center justify-center gap-2 text-[11.5px] text-slate-600 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDailyReminder(checked);
                  if (checked && typeof window !== 'undefined' && 'Notification' in window) {
                    Notification.requestPermission();
                  }
                  try {
                    localStorage.setItem('greenlearn_daily_reminder', String(checked));
                  } catch {}
                }}
                className="w-3.5 h-3.5 accent-[#16A34A] rounded cursor-pointer"
              />
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>Nhắc tôi qua thông báo trình duyệt mỗi ngày</span>
              </span>
            </label>

            {dailyClaimResult ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs mb-1 font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{dailyClaimResult}</span>
              </div>
            ) : isTodayClaimed ? (
              <button
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-xl text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Đã điểm danh hôm nay • Lần tiếp sau {timeLeftToMidnight}</span>
              </button>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4 fill-white text-white" />
                <span>Điểm danh hôm nay</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Cài đặt kết nối AI (OpenAI BYOK) */}
      {isAiModalOpen && mounted && createPortal(
        <div 
          id="ai-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAiModalOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans"
          >
            <button
              id="close-ai-modal"
              onClick={() => setIsAiModalOpen(false)}
              aria-label="Đóng cài đặt AI"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Kết nối AI OpenAI (BYOK)</h3>
                <p className="text-xs text-slate-500">
                  Dùng Khóa API OpenAI riêng của bạn để phân tích, tóm tắt và sinh đề thi.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAiConfig} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 mt-4">
              {/* Nhập Khóa API */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-900">
                    1. Khóa API OpenAI (API Key)
                  </label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#16A34A] hover:underline flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>Lấy Khóa API tại OpenAI</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-proj-... hoặc sk-..."
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setTestConnectionStatus('idle');
                      setTestResultMessage(null);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 outline-none focus:border-[#16A34A] font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                    className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1 leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Khóa chỉ lưu trên trình duyệt của bạn (localStorage) và gọi thẳng <code>api.openai.com</code>. Không gửi tới máy chủ trung gian.
                  </span>
                </div>

                {/* Security Warning Box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-start gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Cảnh báo bảo mật:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Khóa chỉ lưu trên trình duyệt của bạn. <strong>Không dùng trên máy công cộng</strong>. Lưu ý rằng gói <strong>ChatGPT Plus không bao gồm API</strong>; API tính phí riêng theo mức sử dụng thực tế của tài khoản OpenAI của bạn.
                  </p>
                </div>
              </div>

              {/* Chọn Mô Hình & Kiểm Tra */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="openai-model-select" className="font-bold text-slate-900">
                    2. Chọn Mô hình OpenAI
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {OPENAI_MODELS.length} mô hình
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      id="openai-model-select"
                      value={selectedModel}
                      onChange={(e) => {
                        setSelectedModel(e.target.value);
                        setTestConnectionStatus('idle');
                        setTestResultMessage(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-[#16A34A] cursor-pointer shadow-2xs"
                    >
                      {OPENAI_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnectionStatus === 'testing' || !apiKeyInput.trim()}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-50 text-xs font-bold transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{testConnectionStatus === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra key'}</span>
                  </button>
                </div>

                {/* Kết quả kiểm tra */}
                {testConnectionStatus === 'success' && testResultMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="leading-tight">{testResultMessage}</span>
                  </div>
                )}
                {testConnectionStatus === 'error' && testResultMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="leading-tight">{testResultMessage}</span>
                  </div>
                )}
              </div>

              {saveSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
