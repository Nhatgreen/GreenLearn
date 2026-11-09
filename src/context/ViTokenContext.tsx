'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViTokenWallet, ViTokenTransaction, AiConfig } from '@/types/vitoken';
import { useAuth } from '@/hooks/useAuth';
import { ViTokenService } from '@/services/ViTokenService';
import { getSupabase } from '@/lib/supabase';

interface ViTokenContextType {
  wallet: ViTokenWallet;
  aiConfig: AiConfig;
  claimDailyStreak: () => { success: boolean; earned: number; message: string };
  addTokens: (amount: number, description: string, type?: ViTokenTransaction['type']) => void;
  spendTokens: (amount: number, description: string, modelUsed?: string) => boolean;
  purchaseKnowledgeItem: (price: number, title: string, author: string) => boolean;
  updateAiConfig: (config: Partial<AiConfig>) => void;
  resetWallet: () => void;
  refreshWallet: () => Promise<void>;
  activeSecondsOnDesk: number;
}

const DEFAULT_WALLET: ViTokenWallet = {
  balance: 50, // Welcome starter pack
  streakDays: 1,
  lastClaimDate: null,
  history: [
    {
      id: 'tx-welcome',
      type: 'signup_bonus',
      amount: 50,
      description: 'Quà tặng chào mừng thành viên mới ViTudy',
      timestamp: new Date().toISOString()
    }
  ]
};

const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'system',
  model: 'gpt-4o-mini',
  hasCustomKey: false,
  isOauthConnected: false
};

const ViTokenContext = createContext<ViTokenContextType | null>(null);

export function ViTokenProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const [wallet, setWallet] = useState<ViTokenWallet>(DEFAULT_WALLET);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);
  const [activeSecondsOnDesk, setActiveSecondsOnDesk] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Đếm thời gian tương tác thực tế trên bàn học
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSecondsOnDesk(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load from localStorage on mount (guest fallback)
  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem('vitudy_wallet');
      if (savedWallet) {
        setWallet(JSON.parse(savedWallet));
      }
      const savedAi = localStorage.getItem('vitudy_ai_config');
      if (savedAi) {
        setAiConfig(JSON.parse(savedAi));
      }
    } catch {
      // fallback to defaults if parse fails
    }
    setIsLoaded(true);
  }, []);

  // Sync from Supabase Cloud and subscribe to Realtime balance changes
  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      ViTokenService.getWallet(user.id).then((cloudWallet) => {
        setWallet(cloudWallet);
      });

      const supabase = getSupabase();
      if (!supabase) return;

      const channel = supabase
        .channel(`profile-balance-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload: any) => {
            if (payload.new && typeof payload.new.vitoken_balance === 'number') {
              setWallet(prev => ({
                ...prev,
                balance: payload.new.vitoken_balance,
                streakDays: payload.new.daily_streak_days ?? prev.streakDays,
                lastClaimDate: payload.new.last_claim_date ?? prev.lastClaimDate,
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [status, user?.id]);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('vitudy_wallet', JSON.stringify(wallet));
        localStorage.setItem('vitudy_ai_config', JSON.stringify(aiConfig));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [wallet, aiConfig, isLoaded]);

  const claimDailyStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    if (wallet.lastClaimDate === today) {
      return { success: false, earned: 0, message: 'Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai nhé.' };
    }

    // Yêu cầu mở bàn học tương tác tối thiểu 3 phút (180s)
    if (activeSecondsOnDesk < 180 && wallet.lastClaimDate !== null) {
      const remainingSec = 180 - activeSecondsOnDesk;
      return {
        success: false,
        earned: 0,
        message: `Vui lòng học và tương tác trên bàn học thêm ${remainingSec} giây để xác thực điểm danh hôm nay.`
      };
    }

    const nextStreak = wallet.streakDays + 1;
    // Cố định 5 ViToken mỗi ngày, riêng Chủ Nhật x2 nhận 10 ViToken
    const isSunday = new Date().getDay() === 0;
    const earned = isSunday ? 10 : 5;

    const newTx: ViTokenTransaction = {
      id: `tx-streak-${Date.now()}`,
      type: 'daily_streak',
      amount: earned,
      description: `Điểm danh liên tiếp ngày ${nextStreak} (+${earned} ViToken${isSunday ? ' - Chủ Nhật x2' : ''})`,
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance + earned,
      streakDays: nextStreak,
      lastClaimDate: today,
      history: [newTx, ...prev.history]
    }));

    if (status === 'authenticated') {
      ViTokenService.claimStreak().catch(err => {
        console.warn('Lỗi đồng bộ claimStreak lên Cloud:', err);
      });
    }

    return { 
      success: true, 
      earned, 
      message: `Điểm danh thành công! Bạn nhận được +${earned} ViToken${isSunday ? ' (Thưởng Chủ Nhật x2)' : ''}.` 
    };
  };

  const addTokens = (amount: number, description: string, type: ViTokenTransaction['type'] = 'referral') => {
    const newTx: ViTokenTransaction = {
      id: `tx-${Date.now()}`,
      type,
      amount,
      description,
      timestamp: new Date().toISOString()
    };
    setWallet(prev => ({
      ...prev,
      balance: prev.balance + amount,
      history: [newTx, ...prev.history]
    }));
  };

  const spendTokens = (amount: number, description: string, modelUsed?: string): boolean => {
    // If user is using personal BYOK or OAuth, AI calls are free of ViToken
    if (aiConfig.provider !== 'system') {
      return true;
    }

    if (wallet.balance < amount) {
      return false;
    }

    const newTx: ViTokenTransaction = {
      id: `tx-${Date.now()}`,
      type: 'ai_usage',
      amount: -amount,
      description,
      modelUsed: modelUsed || aiConfig.model,
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance - amount,
      history: [newTx, ...prev.history]
    }));

    return true;
  };

  // Giao dịch chia sẻ doanh thu 85% cho tác giả, 15% phí nền tảng
  const purchaseKnowledgeItem = (price: number, title: string, author: string): boolean => {
    if (wallet.balance < price) {
      return false;
    }

    const authorEarned = Math.floor(price * 0.85);
    const platformFee = price - authorEarned;

    const buyerTx: ViTokenTransaction = {
      id: `tx-buy-${Date.now()}`,
      type: 'know_buy',
      amount: -price,
      description: `Mở khoá tài liệu Chợ: "${title}" (Tác giả: ${author} nhận ${authorEarned} ViToken, Phí sàn: ${platformFee} ViToken)`,
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      balance: prev.balance - price,
      history: [buyerTx, ...prev.history]
    }));

    return true;
  };

  const updateAiConfig = (config: Partial<AiConfig>) => {
    setAiConfig(prev => ({ ...prev, ...config }));
  };

  const resetWallet = () => {
    setWallet(DEFAULT_WALLET);
  };

  const refreshWallet = async () => {
    if (status === 'authenticated' && user?.id) {
      const cloudWallet = await ViTokenService.getWallet(user.id);
      setWallet(cloudWallet);
    }
  };

  return (
    <ViTokenContext.Provider
      value={{
        wallet,
        aiConfig,
        claimDailyStreak,
        addTokens,
        spendTokens,
        purchaseKnowledgeItem,
        updateAiConfig,
        resetWallet,
        refreshWallet,
        activeSecondsOnDesk
      }}
    >
      {children}
    </ViTokenContext.Provider>
  );
}

export function useViToken() {
  const context = useContext(ViTokenContext);
  if (!context) {
    throw new Error('useViToken must be used within a ViTokenProvider');
  }
  return context;
}
