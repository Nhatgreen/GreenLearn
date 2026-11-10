'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ByokStore } from '@/lib/byokStore';
import { testAiConnection } from '@/lib/aiClient';
import { usePetMascot } from '@/hooks/usePetMascot';
import { PetMascotModal } from '@/components/pet/PetMascotModal';
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

const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Khuyên dùng - Phản hồi nhanh & tiết kiệm chi phí' },
  { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship - Trả lời xuất sắc và chi tiết nhất' },
  { id: 'o3-mini', name: 'o3-mini', tag: 'Mô hình lý luận toán học & lập trình sâu' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', tag: 'Đa nhiệm nâng cao' },
];

export function TopRightWallet() {
  const [mounted, setMounted] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Pet Mascot & Streak Hook
  const { pet, currentImageUrl } = usePetMascot();

  // AI state
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Load AI config
    const key = ByokStore.get('openai') || '';
    setApiKeyInput(key);
    try {
      const savedModel = localStorage.getItem('greenlearn_ai_model');
      if (savedModel) setSelectedModel(savedModel);
    } catch {}
  }, []);

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

  return (
    <>
      <div 
        data-tour="wallet-market"
        className="relative flex items-center bg-white/95 border border-slate-300 rounded-2xl p-1.5 shadow-sm backdrop-blur-md pointer-events-auto select-none"
      >
        {/* Daily Streak & Pet Button */}
        <button
          onClick={() => {
            setIsPetModalOpen(true);
            setIsAiModalOpen(false);
          }}
          title={`Thú cưng: ${pet.name} (Cấp ${pet.stage}) • Chuỗi ${pet.streakDays} ngày liên tiếp (Bấm để xem và điểm danh)`}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer group ${
            isPetModalOpen ? 'bg-slate-200' : 'hover:bg-slate-100'
          }`}
        >
          <div className="relative flex items-center justify-center w-10 h-10">
            <img
              src={currentImageUrl}
              alt={pet.name}
              className="w-7.5 h-7.5 object-contain transition-transform group-hover:scale-110 drop-shadow-xs"
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

        <div className="w-[1px] h-6 bg-slate-200 my-auto mx-0.5" />

        {/* AI Bot Pill */}
        <button
          id="ai-config-trigger-btn"
          data-tour="inteline-btn"
          onClick={() => {
            setIsAiModalOpen(true);
            setIsPetModalOpen(false);
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

      {/* MODAL: Thú Cưng Học Tập & Điểm Danh Chuỗi Ngày */}
      <PetMascotModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />

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
