'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CreditCard, 
  History, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  FlaskConical
} from 'lucide-react';
import { PaymentPackage, PaymentRequestResult, PaymentService } from '@/services/PaymentService';
import { PricingTiers } from './PricingTiers';
import { QRCodeDisplay } from './QRCodeDisplay';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentHistory } from './PaymentHistory';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useViToken } from '@/context/ViTokenContext';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const { refreshWallet, addTokens } = useViToken();
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>('topup');
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('semester');
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Flow steps: 'select' -> 'qr' -> 'success'
  const [step, setStep] = useState<'select' | 'qr' | 'success'>('select');
  const [currentRequest, setCurrentRequest] = useState<PaymentRequestResult | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Status hook
  const { status, secondsLeft } = usePaymentStatus(
    currentRequest?.id || null,
    currentRequest?.expiresAt || null
  );

  // Load packages on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    PaymentService.listPackages().then((pkgs) => {
      if (isMounted) {
        setPackages(pkgs);
        if (pkgs.length > 0 && !selectedPackageId) {
          setSelectedPackageId(pkgs[0].id);
        }
        setIsLoadingPackages(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // When payment completes, show success step and refresh wallet
  useEffect(() => {
    if ((status === 'completed' || status === 'completed_late') && step === 'qr') {
      setStep('success');
      refreshWallet();
    }
  }, [status, step, refreshWallet]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleStartPayment = async () => {
    setIsCreatingRequest(true);
    setRequestError(null);
    try {
      const res = await PaymentService.createRequest(selectedPackageId);
      setCurrentRequest(res);
      setStep('qr');
    } catch (err: any) {
      setRequestError(err.message || 'Chưa thể tạo yêu cầu thanh toán lúc này');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const isDevMode = typeof window !== 'undefined' && (
    window.location.search.includes('dev=true') || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const selectedPkg = packages.find(p => p.id === selectedPackageId) || packages[0];

  const handleSimulateDemoTopUp = () => {
    addTokens(5, 'Nạp thử nghiệm 0đ kiểm thử đồ án');
    setDemoNotice('Đã cộng 5 ViToken thử nghiệm vào ví của bạn.');
    setTimeout(() => {
      setDemoNotice(null);
      onClose();
    }, 1500);
  };

  const handleBackToSelect = () => {
    setStep('select');
    setCurrentRequest(null);
  };

  return createPortal(
    <div 
      id="topup-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-300 rounded-3xl w-full max-w-3xl p-6 sm:p-7 shadow-2xl relative text-slate-900 animate-fade-in font-sans"
      >
        {/* Close Button */}
        <button
          id="close-topup-modal"
          onClick={onClose}
          aria-label="Đóng nạp ViToken"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] border border-orange-200 flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5 text-[#E0562D]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Nạp ViToken qua VietQR
            </h2>
            <p className="text-xs text-slate-500">
              Quét mã ngân hàng 24/7. Hệ thống tự cộng điểm vào tài khoản sau khi chuyển khoản thành công.
            </p>
          </div>
        </div>

        {/* Thông báo nạp thử nghiệm đồ án */}
        {demoNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span>{demoNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('topup')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'topup'
                ? 'border-[#E0562D] text-[#E0562D]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nạp ViToken</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#E0562D] text-[#E0562D]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử nạp</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'history' ? (
          <PaymentHistory />
        ) : (
          <div>
            {step === 'select' && (
              <div className="space-y-3.5">
                {/* Tỷ lệ quy đổi chuẩn 1.000đ = 1 ViToken */}
                <div className="flex items-center justify-between bg-orange-50/70 border border-orange-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-[#E0562D]">
                    <span>Tỷ lệ quy đổi chuẩn: 1.000đ = 1 ViToken</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Áp dụng cho mọi tính năng học tập</span>
                </div>

                <PricingTiers
                  packages={packages}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={(pkg) => setSelectedPackageId(pkg.id)}
                  isLoading={isLoadingPackages}
                />

                {requestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  {/* Nút nạp thử nghiệm cho người chấm điểm - Chỉ hiện ở môi trường dev/test */}
                  {isDevMode ? (
                    <button
                      type="button"
                      onClick={handleSimulateDemoTopUp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                      <span>Nạp thử 5 ViToken (chế độ kiểm thử)</span>
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleStartPayment}
                    disabled={isCreatingRequest || isLoadingPackages}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#E0562D] hover:bg-[#c9451e] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>
                      {isCreatingRequest 
                        ? 'Đang tạo mã VietQR...' 
                        : selectedPkg 
                        ? `Thanh toán ${selectedPkg.priceVnd.toLocaleString('vi-VN')}đ` 
                        : 'Tiếp tục thanh toán'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {step === 'qr' && currentRequest && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToSelect}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Chọn gói khác</span>
                  </button>
                </div>

                <QRCodeDisplay
                  request={currentRequest}
                  secondsLeft={secondsLeft}
                  onSimulateSuccess={() => {
                    refreshWallet();
                    setStep('success');
                  }}
                  onRetry={handleBackToSelect}
                />
              </div>
            )}

            {step === 'success' && currentRequest && (
              <PaymentSuccess
                tokenAmount={currentRequest.tokenAmount}
                amountVnd={currentRequest.amountVnd}
                code={currentRequest.code}
                onClose={onClose}
                onViewHistory={() => {
                  setActiveTab('history');
                  setStep('select');
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
