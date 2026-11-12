'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ByokStore } from '@/lib/byokStore';
import { 
  testAiConnection, 
  AiProvider, 
  PROVIDER_MODELS, 
  CHATGPT_MODEL_GROUPS,
  exchangeOpenAiCode
} from '@/lib/aiClient';
import { 
  startOpenAiPkceLogin,
  getOpenAiOAuthSession,
  clearOpenAiOAuthSession,
  OpenAiOAuthSession
} from '@/lib/openaiOAuth';
import { usePetMascot } from '@/hooks/usePetMascot';
import { PetMascotModal } from '@/components/pet/PetMascotModal';
import { 
  Cpu, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Bot, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  ClipboardPaste,
  Sparkles,
  MoreHorizontal,
  Upload,
  Share2
} from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Pet Mascot & Streak Hook
  const { pet, currentImageUrl } = usePetMascot();

  // AI Configuration State
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('byok_openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [openAiKeyInput, setOpenAiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);

  // ChatGPT OAuth State
  const [oauthSession, setOauthSession] = useState<OpenAiOAuthSession | null>(null);
  const [chatGptCodeInput, setChatGptCodeInput] = useState<string>('');
  const [isExchangingOAuth, setIsExchangingOAuth] = useState(false);
  const [hasOpenedPkceWindow, setHasOpenedPkceWindow] = useState(false);

  // Testing & Save Feedback
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Load saved settings
    const storedProvider = (localStorage.getItem('greenlearn_ai_provider') || 'byok_openai') as AiProvider;
    setSelectedProvider(storedProvider);

    const savedGemini = ByokStore.get('gemini') || '';
    const savedOpenAi = ByokStore.get('openai') || '';
    setGeminiKeyInput(savedGemini);
    setOpenAiKeyInput(savedOpenAi);

    const savedSession = getOpenAiOAuthSession();
    setOauthSession(savedSession);

    const savedModel = localStorage.getItem('greenlearn_ai_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    } else {
      setSelectedModel(storedProvider === 'byok_gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
    }
  }, []);

  // Update selected model when changing provider if current model doesn't belong to it
  const handleSelectProvider = (provider: AiProvider) => {
    setSelectedProvider(provider);
    setTestConnectionStatus('idle');
    setTestResultMessage(null);

    const availableModels = PROVIDER_MODELS[provider] || [];
    const isCurrentModelValid = availableModels.some(m => m.id === selectedModel);
    if (!isCurrentModelValid) {
      if (provider === 'byok_gemini') {
        setSelectedModel('gemini-2.5-flash');
      } else {
        setSelectedModel('gpt-4o-mini');
      }
    }
  };

  // Keyboard shortcut Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPetModalOpen(false);
        setIsAiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // PKCE OAuth handlers
  const handleStartOpenAiPkce = async () => {
    try {
      const { authorizeUrl } = await startOpenAiPkceLogin();
      setHasOpenedPkceWindow(true);
      window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setTestConnectionStatus('error');
      setTestResultMessage(`Không thể mở cổng đăng nhập OpenAI: ${err?.message || err}`);
    }
  };

  const handleConnectOpenAiInput = async (rawInput: string) => {
    if (!rawInput.trim()) return;
    setIsExchangingOAuth(true);
    setTestConnectionStatus('idle');
    setTestResultMessage(null);
    try {
      const session = await exchangeOpenAiCode(rawInput.trim());
      setOauthSession(session);
      setChatGptCodeInput('');
      setTestConnectionStatus('success');
      setTestResultMessage(`Kết nối tài khoản ChatGPT thành công! (${session.email || 'Đã xác thực'})`);
    } catch (err: any) {
      setTestConnectionStatus('error');
      setTestResultMessage(err?.message || 'Không thể xác thực mã callback.');
    } finally {
      setIsExchangingOAuth(false);
    }
  };

  const handlePasteAndConnectOneClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setTestConnectionStatus('error');
        setTestResultMessage('Bộ nhớ tạm rỗng. Hãy sao chép đường dẫn callback từ tab đăng nhập trước.');
        return;
      }
      setChatGptCodeInput(text.trim());
      await handleConnectOpenAiInput(text.trim());
    } catch {
      setTestConnectionStatus('error');
      setTestResultMessage('Không thể đọc bộ nhớ tạm. Vui lòng dán trực tiếp vào ô bên dưới.');
    }
  };

  const handleDisconnectChatGPT = () => {
    clearOpenAiOAuthSession();
    setOauthSession(null);
    setTestConnectionStatus('idle');
    setTestResultMessage(null);
  };

  const handleTestConnection = async () => {
    setTestConnectionStatus('testing');
    setTestResultMessage(null);

    const apiKey = selectedProvider === 'byok_gemini' 
      ? geminiKeyInput.trim() 
      : selectedProvider === 'byok_openai' 
      ? openAiKeyInput.trim() 
      : undefined;

    const res = await testAiConnection({
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
      accessToken: oauthSession?.accessToken,
    });

    setTestConnectionStatus(res.success ? 'success' : 'error');
    setTestResultMessage(res.message);
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      localStorage.setItem('greenlearn_ai_provider', selectedProvider);
      localStorage.setItem('greenlearn_ai_model', selectedModel);

      if (selectedProvider === 'byok_gemini') {
        ByokStore.set('gemini', geminiKeyInput.trim());
      } else if (selectedProvider === 'byok_openai') {
        ByokStore.set('openai', openAiKeyInput.trim());
      }
    } catch {}

    setSaveSuccessMessage('Đã lưu cấu hình kết nối AI thành công.');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      setIsAiModalOpen(false);
    }, 1000);
  };

  return (
    <>
      <div 
        data-tour="wallet-market"
        className="relative flex items-center bg-white/95 border border-slate-300 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-sm backdrop-blur-md pointer-events-auto select-none"
      >
        {/* Daily Streak & Pet Button */}
        <button
          onClick={() => {
            setIsPetModalOpen(true);
            setIsAiModalOpen(false);
          }}
          title={`Thú cưng: ${pet.name} (Cấp ${pet.stage}) • Chuỗi ${pet.streakDays} ngày liên tiếp (Bấm để xem và điểm danh)`}
          className={`relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl transition-all cursor-pointer group ${
            isPetModalOpen ? 'bg-green-100 border border-green-300' : 'hover:bg-slate-100'
          }`}
        >
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
            <img
              src={currentImageUrl}
              alt={pet.name}
              className="w-6 h-6 sm:w-7.5 sm:h-7.5 object-contain transition-transform group-hover:scale-110 drop-shadow-xs"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 text-[9px] font-black font-mono px-1 rounded-full border border-white leading-tight shadow-xs ${
                pet.streakDays > 0 ? 'bg-[#16A34A] text-white' : 'bg-slate-400 text-white'
              }`}
            >
              {pet.streakDays}
            </span>
          </div>
        </button>

        <div className="w-[1px] h-5 sm:h-6 bg-slate-200 my-auto mx-0.5" />

        {/* Desktop Direct AI Bot Pill (Giữ nguyên trên màn hình lớn) */}
        <button
          id="ai-config-trigger-btn"
          data-tour="inteline-btn"
          onClick={() => {
            setIsAiModalOpen(true);
            setIsPetModalOpen(false);
          }}
          className={`hidden md:flex landscape-phone:hidden items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
            isAiModalOpen 
              ? 'bg-[#16A34A] text-white shadow-xs font-bold border border-[#15803D]' 
              : 'text-slate-900 hover:text-black hover:bg-slate-100'
          }`}
          title={`Cài đặt kết nối AI (${selectedProvider === 'byok_gemini' ? 'Google Gemini' : selectedProvider === 'oauth_chatgpt' ? 'ChatGPT OAuth' : 'OpenAI'} - ${selectedModel})`}
        >
          <Bot className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] ${isAiModalOpen ? 'text-white' : 'text-slate-900'}`} />
        </button>

        {/* Mobile & Landscape Phone More Menu "⋯" (Gộp Xuất file, Chia sẻ, AI) */}
        <div className="relative flex md:hidden landscape-phone:flex">
          <button
            title="Tùy chọn mở rộng (Xuất file, Chia sẻ, Cài đặt AI)"
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all cursor-pointer ${
              isMoreMenuOpen 
                ? 'bg-[#16A34A] text-white shadow-xs font-bold border border-[#15803D]' 
                : 'text-slate-900 hover:text-black hover:bg-slate-100'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 stroke-[2.4] ${isMoreMenuOpen ? 'text-white' : 'text-slate-900'}`} />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-300 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs font-semibold text-slate-800 font-sans">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('greenlearn:trigger-upload'));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors text-left font-bold text-slate-900 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#16A34A] stroke-[2.4]" />
                <span>Tải lên / Xuất file</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('greenlearn:open-invite-modal'));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors text-left font-bold text-slate-900 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-blue-600 stroke-[2.4]" />
                <span>Chia sẻ phòng học</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsAiModalOpen(true);
                  setIsPetModalOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors text-left font-bold text-slate-900 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
                <span>Cài đặt kết nối AI</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Thú Cưng Học Tập & Điểm Danh Chuỗi Ngày */}
      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />

      {/* MODAL: Cài đặt kết nối AI đa công cụ (Multi-Provider AI Settings) */}
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
              className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Cài đặt kết nối AI
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn công cụ AI để phân tích, tóm tắt và đồng hành học tập thông minh.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAiConfig} className="space-y-4 max-h-[75dvh] overflow-y-auto pr-1">
              {/* Bước 1: Chọn Nhà Cung Cấp */}
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-2">
                  1. Chọn Nhà cung cấp AI
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'byok_gemini' as AiProvider,
                      name: 'Google Gemini',
                      badge: 'Miễn phí AI Studio',
                      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      icon: <GeminiLogo className="w-4 h-4 text-sky-600" />,
                    },
                    {
                      id: 'byok_openai' as AiProvider,
                      name: 'OpenAI API',
                      badge: 'Dùng khóa riêng',
                      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
                      icon: <OpenAILogo className="w-4 h-4 text-slate-800" />,
                    },
                    {
                      id: 'oauth_chatgpt' as AiProvider,
                      name: 'Đăng nhập ChatGPT',
                      badge: 'Tài khoản OAuth',
                      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                      icon: <OpenAILogo className="w-4 h-4 text-purple-600" />,
                    },
                  ].map((opt) => {
                    const isSelected = selectedProvider === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectProvider(opt.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between transition-all select-none ${
                          isSelected
                            ? 'border-2 border-[#16A34A] bg-[#F0FDF4] shadow-xs text-slate-900'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            {opt.icon}
                            <span className="truncate">{opt.name}</span>
                          </div>
                          <input
                            type="radio"
                            name="ai_provider_radio"
                            checked={isSelected}
                            onChange={() => handleSelectProvider(opt.id)}
                            className="accent-[#16A34A] cursor-pointer"
                          />
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border self-start mt-1 ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bước 2: Thông tin xác thực kết nối */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-900">
                    2. Thông tin xác thực kết nối
                  </label>
                  {selectedProvider === 'byok_gemini' && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#16A34A] hover:text-[#15803D] hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Lấy Khóa API tại Google AI Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProvider === 'byok_openai' && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#16A34A] hover:text-[#15803D] hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>Lấy Khóa API tại OpenAI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Input cho Google Gemini */}
                {selectedProvider === 'byok_gemini' && (
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="AIzaSy... (Dán Khóa API Gemini vào đây)"
                        value={geminiKeyInput}
                        onChange={(e) => {
                          setGeminiKeyInput(e.target.value);
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
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Khóa lưu trực tiếp trên máy của bạn (localStorage). Google AI Studio cấp miễn phí hạn mức học tập rộng rãi.</span>
                    </div>
                  </div>
                )}

                {/* Input cho OpenAI BYOK */}
                {selectedProvider === 'byok_openai' && (
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="sk-proj-... hoặc sk-... (Dán Khóa API OpenAI vào đây)"
                        value={openAiKeyInput}
                        onChange={(e) => {
                          setOpenAiKeyInput(e.target.value);
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
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Khóa chỉ lưu trên trình duyệt của bạn (localStorage) và gọi thẳng api.openai.com.</span>
                    </div>
                  </div>
                )}

                {/* Giao diện cho ChatGPT OAuth */}
                {selectedProvider === 'oauth_chatgpt' && (
                  <div className="space-y-2.5">
                    {oauthSession ? (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {oauthSession.email || (oauthSession.accountId ? `Tài khoản #${oauthSession.accountId.slice(0, 8)}` : 'Đã kết nối ChatGPT')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs font-medium">
                          <button
                            type="button"
                            onClick={handleStartOpenAiPkce}
                            className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
                          >
                            Đổi tài khoản
                          </button>
                          <button
                            type="button"
                            onClick={handleDisconnectChatGPT}
                            className="text-slate-500 hover:text-red-600 underline cursor-pointer"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleStartOpenAiPkce}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Bước 1: Đăng nhập ChatGPT</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePasteAndConnectOneClick}
                            disabled={isExchangingOAuth}
                            className="py-2 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                          >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            <span>{isExchangingOAuth ? 'Đang xác thực...' : 'Bước 2: Dán & Kết nối'}</span>
                          </button>
                        </div>

                        {hasOpenedPkceWindow && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                            Sau khi đăng nhập xong trên tab mới, hãy sao chép toàn bộ thanh địa chỉ <code className="font-mono font-bold">http://localhost:1455/...</code> rồi bấm <strong>Bước 2: Dán & Kết nối</strong>.
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Hoặc dán URL callback tại đây..."
                            value={chatGptCodeInput}
                            onChange={(e) => setChatGptCodeInput(e.target.value)}
                            onPaste={(e) => {
                              const pasted = e.clipboardData?.getData('text');
                              if (pasted && (pasted.includes('code=') || pasted.includes('refresh_token') || pasted.includes('access_token'))) {
                                e.preventDefault();
                                setChatGptCodeInput(pasted.trim());
                                void handleConnectOpenAiInput(pasted.trim());
                              }
                            }}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#16A34A] focus:bg-white font-mono shadow-2xs"
                          />
                          {chatGptCodeInput.trim() && (
                            <button
                              type="button"
                              onClick={() => handleConnectOpenAiInput(chatGptCodeInput)}
                              disabled={isExchangingOAuth}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shrink-0"
                            >
                              Kết nối
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400">
                          Bảo mật chuẩn OAuth 2.0 PKCE. Đăng nhập trực tiếp với OpenAI, tự động gia hạn token.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bước 3: Chọn Mô Hình & Kiểm Tra Kết Nối */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="ai-model-select" className="font-bold text-slate-900">
                    3. Chọn Mô hình AI
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {PROVIDER_MODELS[selectedProvider]?.length || 0} mô hình
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-[#16A34A] cursor-pointer shadow-2xs"
                    >
                      {selectedProvider === 'oauth_chatgpt' ? (
                        CHATGPT_MODEL_GROUPS.map((group) => (
                          <optgroup key={group.group} label={group.group}>
                            {group.models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} — {m.desc} ({m.id})
                              </option>
                            ))}
                          </optgroup>
                        ))
                      ) : (
                        (PROVIDER_MODELS[selectedProvider] || []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {m.tag}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnectionStatus === 'testing'}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-50 text-xs font-bold transition-all border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{testConnectionStatus === 'testing' ? 'Đang đo...' : 'Kiểm tra key'}</span>
                  </button>
                </div>

                {/* Kết quả kiểm tra */}
                {testConnectionStatus === 'success' && testResultMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="leading-tight">{testResultMessage}</span>
                  </div>
                )}
                {testConnectionStatus === 'error' && testResultMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-fade-in font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
