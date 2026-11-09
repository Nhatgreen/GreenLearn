'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useViToken } from '@/context/ViTokenContext';
import { AiProvider } from '@/types/vitoken';
import { 
  Flame, 
  Sparkles, 
  History, 
  Cpu, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  X,
  Bot,
  Store,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
  Bell,
  Plus
} from 'lucide-react';
import { MarketModal } from '../modals/MarketModal';
import { TopUpModal } from '../payment/TopUpModal';
import { testAiConnection } from '@/lib/aiClient';
import { getAssetPath } from '@/lib/assets';

// Vector Coin SVG Icon -> Logo ViToken chính thức từ vitoken.svg
function ViTokenCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={getAssetPath('/icons/vitoken.svg')} 
      alt="ViToken" 
      width={16}
      height={16}
      className={`${className} object-contain inline-block flex-shrink-0`}
      style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px' }}
    />
  );
}

const PROVIDER_MODELS: Record<AiProvider, { id: string; name: string; tag: string }[]> = {
  system: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Mặc định - Phản hồi nhanh & tiết kiệm ViToken' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Chuyên giải tích, công thức & tài liệu dài' },
  ],
  byok_gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Khuyên dùng - Nhanh, thông minh, đa năng' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Tư duy chuyên sâu, giải toán phức tạp' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Tốc độ phản hồi cực nhanh' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Ngữ cảnh cực lớn 2M tokens' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Mô hình tiêu chuẩn ổn định' },
  ],
  byok_openai: [
    { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship - Trả lời xuất sắc và chi tiết nhất' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Tốc độ cực nhanh, tiết kiệm chi phí' },
    { id: 'o3-mini', name: 'o3-mini', tag: 'Mô hình lý luận toán học & lập trình sâu' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'Đa nhiệm nâng cao' },
  ],
  oauth_chatgpt: [
    { id: 'gpt-4o', name: 'ChatGPT Plus GPT-4o', tag: 'Mô hình flagship tài khoản Plus' },
    { id: 'gpt-4o-mini', name: 'ChatGPT Plus Fast', tag: 'Phản hồi nhanh' },
    { id: 'o3-mini', name: 'ChatGPT Plus o3-mini', tag: 'Lý luận toán học chuyên sâu' },
  ],
  oauth_gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Tiêu chuẩn Google AI' },
  ]
};

// Provider SVG Logos
function OpenAILogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.66-4.5042a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1402-2.0252zm-1.1214-9.976a4.4708 4.4708 0 0 1 2.3418-1.9727V12.02l2.02-1.1636a.0804.0804 0 0 1 .0757 0l4.8398 2.7913-5.8428 3.3685a.7948.7948 0 0 0-.3928.6813v.1514L3.633 14.398a4.504 4.504 0 0 1-1.1546-6.449zm16.8993 4.1444l-5.8428-3.3732 2.02-1.1635a.0804.0804 0 0 1 .0757 0l4.8399 2.7913v5.5826a4.4992 4.4992 0 0 1-3.6128 4.4098v-5.6657a.7948.7948 0 0 0-.3928-.6813zm2.5224-3.529a4.4755 4.4755 0 0 1 .5347 3.0136l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0l-5.8428 3.3685V9.6698a.0804.0804 0 0 1 .0332-.0615l4.8804-2.815a4.4992 4.4992 0 0 1 6.1402 2.0252zM8.8856 12.072l2.368-1.365 2.368 1.365v2.7301l-2.368 1.365-2.368-1.365z"/>
    </svg>
  );
}

function GeminiLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24A12 12 0 0 1 0 12 12 12 0 0 1 12 0a12 12 0 0 1 12 12 12 12 0 0 1-12 12zm0-3a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z" fillOpacity="0.1"/>
      <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z"/>
    </svg>
  );
}

export function TopRightWallet() {
  const { wallet, aiConfig, updateAiConfig, claimDailyStreak } = useViToken();

  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeAllModals = () => {
    setIsDailyModalOpen(false);
    setIsHistoryModalOpen(false);
    setIsAiModalOpen(false);
    setIsMarketOpen(false);
    setIsTopUpOpen(false);
  };

  // Form states for AI config
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(aiConfig.provider);
  const [selectedModel, setSelectedModel] = useState<string>(aiConfig.model || 'gpt-4o-mini');
  const [apiKeyInput, setApiKeyInput] = useState((aiConfig as any).apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [chatGptCodeInput, setChatGptCodeInput] = useState('');
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [dailyClaimResult, setDailyClaimResult] = useState<string | null>(null);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Countdown until midnight
  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState('');

  const todayDateStr = new Date().toISOString().split('T')[0];
  const isTodayClaimed = wallet.lastClaimDate === todayDateStr;
  const currentDayOfWeek = (new Date().getDay() + 6) % 7; // 0 = T2, 6 = CN

  // Calculate live countdown to midnight
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

  // Sync reminder from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vitudy_daily_reminder');
      if (saved !== null) {
        setDailyReminder(saved === 'true');
      }
    } catch (e) {}
  }, []);

  // Keyboard shortcut Esc for closing open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDailyModalOpen) setIsDailyModalOpen(false);
        if (isHistoryModalOpen) setIsHistoryModalOpen(false);
        if (isAiModalOpen) setIsAiModalOpen(false);
        if (isTopUpOpen) setIsTopUpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDailyModalOpen, isHistoryModalOpen, isAiModalOpen, isTopUpOpen]);

  // Check if AI config has changes
  const hasAiChanges = useMemo(() => {
    if (selectedProvider !== aiConfig.provider) return true;
    if (selectedModel !== (aiConfig.model || 'gpt-4o-mini')) return true;
    if (selectedProvider.startsWith('byok') && apiKeyInput.trim() !== ((aiConfig as any).apiKey || '')) return true;
    if (selectedProvider === 'oauth_chatgpt' && chatGptCodeInput.trim() !== '') return true;
    return false;
  }, [selectedProvider, selectedModel, apiKeyInput, chatGptCodeInput, aiConfig]);

  const handleClaim = () => {
    const res = claimDailyStreak();
    if (res.earned > 0) {
      setDailyClaimResult(`Tuyệt vời! Bạn đã nhận thành công +${res.earned} ViToken cho ngày hôm nay.`);
    } else {
      setDailyClaimResult(res.message || 'Hôm nay bạn đã nhận thưởng rồi. Hãy quay lại vào ngày mai.');
    }
  };

  const handleSelectProvider = (provider: AiProvider) => {
    setSelectedProvider(provider);
    setTestConnectionStatus('idle');
    setTestResultMessage(null);
    const models = PROVIDER_MODELS[provider] || [];
    if (models.length > 0) {
      setSelectedModel(models[0].id);
    }
  };

  const handleTestConnection = async () => {
    setTestConnectionStatus('testing');
    setTestResultMessage(null);
    try {
      const result = await testAiConnection({
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKeyInput,
        accessToken: chatGptCodeInput
      });
      if (result.success) {
        setTestConnectionStatus('success');
        setTestResultMessage(result.message);
      } else {
        setTestConnectionStatus('error');
        setTestResultMessage(result.message);
      }
    } catch (err: any) {
      setTestConnectionStatus('error');
      setTestResultMessage(err.message || 'Lỗi kiểm tra kết nối.');
    }
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAiConfig({
      provider: selectedProvider,
      apiKey: (selectedProvider === 'byok_gemini' || selectedProvider === 'byok_openai') ? apiKeyInput.trim() : undefined,
      model: selectedModel
    });
    setSaveSuccessMessage('Đã lưu cấu hình AI thành công.');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      setIsAiModalOpen(false);
    }, 1000);
  };

  const WEEK_DAYS = [
    { key: 'mon', label: 'T2', fullLabel: 'Thứ Hai', tokens: 5 },
    { key: 'tue', label: 'T3', fullLabel: 'Thứ Ba', tokens: 5 },
    { key: 'wed', label: 'T4', fullLabel: 'Thứ Tư', tokens: 5 },
    { key: 'thu', label: 'T5', fullLabel: 'Thứ Năm', tokens: 5 },
    { key: 'fri', label: 'T6', fullLabel: 'Thứ Sáu', tokens: 5 },
    { key: 'sat', label: 'T7', fullLabel: 'Thứ Bảy', tokens: 5 },
    { key: 'sun', label: 'CN', fullLabel: 'Chủ Nhật', tokens: 10, isDouble: true },
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
            closeAllModals();
            setDailyClaimResult(null);
            setIsDailyModalOpen(true);
          }}
          title={`Chuỗi học tập: ${wallet.streakDays} ngày liên tiếp (Bấm để điểm danh nhận ViToken)`}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer group ${
            isDailyModalOpen ? 'bg-slate-200' : 'hover:bg-slate-100'
          }`}
        >
          {wallet.streakDays > 0 ? (
            <div className="relative flex items-center justify-center w-10 h-10">
              {/* Ngọn lửa Cam ViT với bụng tròn ôm trọn số chuỗi ngày */}
              <Flame className="w-8.5 h-8.5 text-[#E0562D] fill-[#E0562D] drop-shadow-xs transition-transform group-hover:scale-105" />
              {/* Số chuỗi căn chuẩn xác 100% vào tâm bụng tròn ngọn lửa (x=50%, y=64%) */}
              <span className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-black font-mono text-white select-none pointer-events-none leading-none">
                {wallet.streakDays}
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

        {/* Chợ Tài Liệu */}
        <button
          id="market-trigger-btn"
          onClick={() => {
            closeAllModals();
            setIsMarketOpen(true);
          }}
          title="Chợ Tài Liệu"
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer group ${
            isMarketOpen 
              ? 'bg-slate-200 text-slate-900' 
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Store className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>

        <div className="w-[1px] h-6 bg-slate-200 my-auto mx-0.5" />

        {/* Credit Balance & Top Up Pill */}
        <div className="flex items-center bg-slate-100/70 rounded-xl p-0.5 border border-slate-200">
          <button
            id="wallet-history-trigger-btn"
            onClick={() => {
              closeAllModals();
              setIsHistoryModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 h-9 rounded-lg transition-all cursor-pointer ${
              isHistoryModalOpen ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-800 hover:bg-white/80'
            }`}
            title="Xem lịch sử số dư ViToken (1 V = 1 ViToken)"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getAssetPath('/icons/vitoken.svg')} 
              alt="ViToken" 
              width={20}
              height={20}
              className="w-5 h-5 rounded-full object-contain shrink-0" 
              style={{ width: '20px', height: '20px', maxWidth: '20px', maxHeight: '20px' }}
            />
            <span className="text-xs font-black font-mono text-slate-900">
              {wallet.balance}
            </span>
          </button>

          <button
            id="topup-trigger-btn"
            onClick={() => {
              closeAllModals();
              setIsTopUpOpen(true);
            }}
            title="Nạp ViToken (VietQR)"
            className="flex items-center justify-center w-7 h-9 rounded-lg bg-[#E0562D] hover:bg-[#c9451e] text-white transition-all shadow-xs active:scale-95 cursor-pointer ml-0.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-slate-200 my-auto mx-0.5" />

        {/* AI Bot Pill */}
        <button
          id="ai-config-trigger-btn"
          data-tour="inteline-btn"
          onClick={() => {
            closeAllModals();
            setIsAiModalOpen(true);
          }}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer ${
            isAiModalOpen 
              ? 'bg-slate-200 text-slate-900' 
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
          title={`Cài đặt mô hình AI (Mô hình: ${aiConfig.model})`}
        >
          <Bot className="w-5 h-5 text-slate-900 stroke-[2.4]" />
        </button>
      </div>

      {/* MODAL: Chợ Tài Liệu */}
      <MarketModal
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
      />

      {/* MODAL: Điểm danh nhận ViToken (Section 5) */}
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
            {/* 44px close button touch target */}
            <button
              id="close-streak-modal"
              onClick={() => setIsDailyModalOpen(false)}
              aria-label="Đóng điểm danh"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-2.5">
              <Flame className="w-7 h-7 text-[#E0562D] fill-[#E0562D]" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Điểm danh hằng ngày
            </h3>
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              Điểm danh mỗi ngày nhận 5 ViToken, riêng Chủ Nhật x2 nhận 10 ViToken.
            </p>

            {/* 7 Day States Grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-3.5">
              {WEEK_DAYS.map((day, idx) => {
                const isToday = idx === currentDayOfWeek;
                const isPast = idx < currentDayOfWeek;
                const isClaimedToday = isToday && isTodayClaimed;
                const isSunday = day.key === 'sun';
                // A past day was claimed if user's streak includes it
                const isPastClaimed = isPast && (wallet.streakDays >= (currentDayOfWeek - idx));
                const isClaimed = isClaimedToday || isPastClaimed;
                const isMissed = isPast && !isClaimed;

                return (
                  <div key={day.key} className="flex flex-col items-center" title={`${day.fullLabel}: +${day.tokens} ViToken`}>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border shadow-2xs select-none relative ${
                        isClaimed
                          ? 'bg-emerald-500 border-emerald-600 text-white font-bold'
                          : isToday && !isTodayClaimed
                          ? 'bg-[#FFF7ED] border-[#E0562D] text-[#9A3412] font-black ring-2 ring-[#E0562D] ring-offset-2 animate-pulse'
                          : isToday && isTodayClaimed
                          ? 'bg-emerald-500 border-emerald-600 text-white font-bold ring-2 ring-emerald-500 ring-offset-1'
                          : isSunday
                          ? 'bg-orange-50 border-orange-300 text-[#E0562D] font-black'
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
                        <div className="flex items-center gap-0.5">
                          <span className="text-[11px] font-black font-mono text-slate-900">
                            +{day.tokens}
                          </span>
                          <ViTokenCoin className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold mt-1.5 select-none ${
                        isToday ? 'text-[#E0562D] font-black' : 'text-slate-600'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Streak Days + Next Reward Milestone */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 text-left">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Flame className="w-4 h-4 text-[#E0562D] fill-[#E0562D]" />
                  <span>Chuỗi {wallet.streakDays} ngày</span>
                  <span className="text-[10.5px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                    {(wallet.streakDays % 7) || (wallet.streakDays > 0 ? 7 : 0)}/7 ngày
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#E0562D]">
                  {wallet.streakDays < 7 
                    ? `Mốc 7 ngày: +20 ViToken` 
                    : `Mốc 14 ngày: +50 ViToken`}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-[#E0562D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(12, (((wallet.streakDays % 7) || (wallet.streakDays > 0 ? 7 : 0)) / 7) * 100))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-2 leading-tight">
                Chuỗi tính theo số ngày điểm danh liên tiếp. Bỏ lỡ 1 ngày sẽ tính lại từ ngày 1. Đạt mốc 7 ngày nhận thêm +20 ViToken.
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
                    localStorage.setItem('vitudy_daily_reminder', String(checked));
                  } catch (err) {}
                }}
                className="w-3.5 h-3.5 accent-[#E0562D] rounded cursor-pointer"
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
                <span>Đã nhận hôm nay • Nhận tiếp sau {timeLeftToMidnight}</span>
              </button>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 bg-[#E0562D] hover:bg-[#c9451e] text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ViTokenCoin className="w-4 h-4" />
                <span>Nhận ViToken ngay</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Lịch sử ViToken */}
      {isHistoryModalOpen && mounted && createPortal(
        <div 
          id="history-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHistoryModalOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9990] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-300 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 animate-fade-in font-sans"
          >
            <button
              id="close-history-modal"
              onClick={() => setIsHistoryModalOpen(false)}
              aria-label="Đóng lịch sử"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Lịch sử ViToken</h3>
                  <p className="text-[11px] text-slate-500">Số dư hiện tại: <strong className="font-mono text-slate-900 font-black">{wallet.balance} ViToken</strong></p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setIsTopUpOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#E0562D] hover:bg-[#c9451e] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Nạp ViToken</span>
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mt-3">
              {wallet.history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có giao dịch nào
                </div>
              ) : (
                wallet.history.map(tx => (
                  <div 
                    key={tx.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <span className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} V
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Cài đặt kết nối AI (Section 6) */}
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
            {/* 44px close button touch target */}
            <button
              id="close-ai-modal"
              onClick={() => setIsAiModalOpen(false)}
              aria-label="Đóng cài đặt AI"
              className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Cài đặt kết nối AI</h3>
                <p className="text-xs text-slate-500">
                  Chọn nhà cung cấp trí tuệ nhân tạo để phân tích, tóm tắt và sinh đề thi.
                </p>
              </div>
            </div>

            {/* User ViToken Balance in AI Modal */}
            <div className="my-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
              <span className="text-slate-600 font-medium">Số dư ví của bạn:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-slate-900">{wallet.balance} ViToken</span>
                <div className="w-4 h-4 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center">
                  V
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAiConfig} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* 1. Chọn Nhà Cung Cấp */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  1. Chọn Nhà cung cấp AI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'system' as AiProvider,
                      name: 'ViTudy (Hệ thống)',
                      badge: 'Mặc định',
                      badgeStyle: 'bg-orange-50 text-[#E0562D] border-orange-200',
                      desc: 'Sẵn sàng dùng ngay. Tự động trừ ViToken theo lượt dùng.',
                      icon: <Sparkles className="w-4 h-4 text-[#E0562D]" />
                    },
                    {
                      id: 'byok_gemini' as AiProvider,
                      name: 'Google Gemini',
                      badge: 'Dùng khóa riêng',
                      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      desc: 'Dùng Khóa API cá nhân từ Google AI Studio.',
                      icon: <GeminiLogo className="w-4 h-4 text-sky-600" />
                    },
                    {
                      id: 'byok_openai' as AiProvider,
                      name: 'OpenAI (ChatGPT)',
                      badge: 'Dùng khóa riêng',
                      badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200',
                      desc: 'Dùng Khóa API cá nhân (sk-proj-...).',
                      icon: <OpenAILogo className="w-4 h-4 text-slate-900" />
                    },
                    {
                      id: 'oauth_chatgpt' as AiProvider,
                      name: 'Đăng nhập ChatGPT Plus',
                      badge: 'Tài khoản Plus',
                      badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
                      desc: 'Ủy quyền qua ChatGPT Plus để dùng hạn mức của bạn mà không tốn ViToken.',
                      icon: <OpenAILogo className="w-4 h-4 text-purple-700" />
                    }
                  ].map(opt => {
                    const isSelected = selectedProvider === opt.id;
                    const isCurrentActive = aiConfig.provider === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectProvider(opt.id)}
                        className={`p-2.5 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between transition-all select-none ${
                          isSelected
                            ? 'bg-orange-50/40 border-[#E0562D] ring-1 ring-[#E0562D]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {opt.icon}
                            <span className="font-bold text-slate-900">{opt.name}</span>
                          </div>
                          <input
                            type="radio"
                            name="ai_provider_radio"
                            checked={isSelected}
                            onChange={() => handleSelectProvider(opt.id)}
                            className="accent-[#E0562D] cursor-pointer"
                          />
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug mb-1.5">
                          {opt.desc}
                        </p>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeStyle}`}>
                            {opt.badge}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                              Đang dùng
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Khung Thông tin xác thực */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-900">
                    2. Thông tin xác thực kết nối
                  </label>
                  {selectedProvider === 'byok_gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E0562D] hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Lấy Khóa API Google Gemini</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProvider === 'byok_openai' && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E0562D] hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Lấy Khóa API OpenAI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProvider === 'oauth_chatgpt' && (
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E0562D] hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Mở ChatGPT Plus</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {selectedProvider === 'system' && (
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between leading-relaxed">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E0562D] flex-shrink-0" />
                      <span>Hệ thống ViTudy tích hợp sẵn, không cần khóa API. Chi phí ước tính: <strong>0,05 ViToken</strong> / lượt hỏi (khoảng 50đ).</span>
                    </div>
                  </div>
                )}

                {(selectedProvider === 'byok_gemini' || selectedProvider === 'byok_openai') && (
                  <div>
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={selectedProvider === 'byok_gemini' ? 'AIzaSy... (Dán Khóa API Gemini vào đây)' : 'sk-proj-... (Dán Khóa API OpenAI vào đây)'}
                        value={apiKeyInput}
                        onChange={(e) => {
                          setApiKeyInput(e.target.value);
                          setTestConnectionStatus('idle');
                          setTestResultMessage(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 font-mono shadow-2xs"
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
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Khóa API được lưu cục bộ an toàn trong trình duyệt (localStorage), không lưu trữ trên máy chủ.</span>
                    </div>
                  </div>
                )}

                {selectedProvider === 'oauth_chatgpt' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Dán mã ủy quyền callback hoặc Token ChatGPT Plus..."
                      value={chatGptCodeInput}
                      onChange={(e) => {
                        setChatGptCodeInput(e.target.value);
                        setTestConnectionStatus('idle');
                        setTestResultMessage(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-800 font-mono shadow-2xs"
                    />
                    <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Ủy quyền qua ChatGPT Plus để dùng hạn mức của bạn mà không tốn ViToken.
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Chọn Mô Hình AI & Kiểm tra kết nối */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="ai-model-select" className="font-bold text-slate-900">
                    3. Chọn Mô hình AI
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {PROVIDER_MODELS[selectedProvider]?.length || 0} mô hình khả dụng
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      id="ai-model-select"
                      value={selectedModel}
                      onChange={(e) => {
                        setSelectedModel(e.target.value);
                        setTestConnectionStatus('idle');
                        setTestResultMessage(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-slate-800 cursor-pointer shadow-2xs truncate"
                    >
                      {(PROVIDER_MODELS[selectedProvider] || []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnectionStatus === 'testing'}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-50 text-xs font-bold transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#E0562D]" />
                    <span>{testConnectionStatus === 'testing' ? 'Đang đo ms...' : 'Kiểm tra kết nối'}</span>
                  </button>
                </div>

                {/* Kết quả kiểm tra */}
                {testConnectionStatus === 'success' && testResultMessage && (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="leading-tight">{testResultMessage}</span>
                  </div>
                )}
                {testConnectionStatus === 'error' && testResultMessage && (
                  <div className="p-2 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="leading-tight">{testResultMessage}</span>
                  </div>
                )}
              </div>

              {saveSuccessMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  {!hasAiChanges && (
                    <span className="text-[11px] text-slate-400 italic">Chưa có thay đổi</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={!hasAiChanges}
                    title={!hasAiChanges ? 'Chưa có thay đổi cấu hình' : 'Lưu cài đặt kết nối'}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E0562D] hover:bg-[#c9451e] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* MODAL: Nạp ViToken (VietQR & Sepay) */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
    </>
  );
}
