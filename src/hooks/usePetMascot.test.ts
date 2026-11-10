import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePetMascot } from './usePetMascot';
import { PET_STORAGE_KEY, LEGACY_STREAK_KEY } from '@/lib/petHelpers';

describe('usePetMascot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default state when localStorage is empty', () => {
    const { result } = renderHook(() => usePetMascot());
    expect(result.current.pet.name).toBe('Mầm Xanh');
    expect(result.current.pet.streakDays).toBe(0);
    expect(result.current.pet.stage).toBe(1);
    expect(result.current.pet.isSleeping).toBe(true);
    expect(result.current.isClaimedToday).toBe(false);
  });

  it('claims today, wakes the pet and increments streak', () => {
    const { result } = renderHook(() => usePetMascot());

    act(() => {
      const res = result.current.claimToday();
      expect(res.success).toBe(true);
      expect(res.newStreak).toBe(1);
    });

    expect(result.current.pet.streakDays).toBe(1);
    expect(result.current.pet.isSleeping).toBe(false);
    expect(result.current.isClaimedToday).toBe(true);

    // Calling again on same day should not double claim
    act(() => {
      const res2 = result.current.claimToday();
      expect(res2.success).toBe(false);
    });
    expect(result.current.pet.streakDays).toBe(1);
  });

  it('renames pet successfully', () => {
    const { result } = renderHook(() => usePetMascot());

    act(() => {
      result.current.renamePet('Bé Mầm Đáng Yêu');
    });

    expect(result.current.pet.name).toBe('Bé Mầm Đáng Yêu');
    const stored = JSON.parse(localStorage.getItem(PET_STORAGE_KEY) || '{}');
    expect(stored.name).toBe('Bé Mầm Đáng Yêu');
  });

  it('auto-claims when study seconds reach 180s', () => {
    const { result } = renderHook(() => usePetMascot());

    act(() => {
      result.current.addStudySeconds(120);
    });
    expect(result.current.isClaimedToday).toBe(false);

    act(() => {
      const { autoClaimed } = result.current.addStudySeconds(60);
      expect(autoClaimed).toBe(true);
    });

    expect(result.current.isClaimedToday).toBe(true);
    expect(result.current.pet.streakDays).toBe(1);
    expect(result.current.pet.isSleeping).toBe(false);
  });
});
