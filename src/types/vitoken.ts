export type TransactionType = 
  | 'signup_bonus' 
  | 'daily_streak' 
  | 'referral' 
  | 'ai_usage' 
  | 'know_buy' 
  | 'know_sell' 
  | 'audit_deposit';

export interface ViTokenTransaction {
  id: string;
  type: TransactionType;
  amount: number; // positive or negative
  description: string;
  timestamp: string;
  modelUsed?: string;
}

export type AiProvider = 'system' | 'byok_openai' | 'byok_gemini' | 'oauth_chatgpt' | 'oauth_gemini';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  hasCustomKey: boolean;
  isOauthConnected: boolean;
  apiKey?: string;
}

export interface ViTokenWallet {
  balance: number;
  streakDays: number;
  lastClaimDate: string | null;
  history: ViTokenTransaction[];
}
