import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViTokenService } from './ViTokenService';

describe('ViTokenService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getWallet returns default wallet structure when Supabase is not configured', async () => {
    const wallet = await ViTokenService.getWallet('');
    expect(wallet.balance).toBe(50);
    expect(wallet.streakDays).toBe(1);
    expect(wallet.history).toBeDefined();
  });

  it('claimStreak returns failure when unauthenticated and Supabase is null', async () => {
    const res = await ViTokenService.claimStreak();
    expect(res.success).toBe(false);
  });
});
