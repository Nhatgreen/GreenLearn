import { describe, it, expect } from 'vitest';
import {
  calculatePetStage,
  calculateNextStageProgress,
  isYesterday,
  isSameDay,
  resolvePetState,
  getPetAssetUrl,
  formatDateStr,
} from './petHelpers';

describe('petHelpers', () => {
  describe('calculatePetStage', () => {
    it('returns stage 1 for 0, 1, and 2 days', () => {
      expect(calculatePetStage(0)).toBe(1);
      expect(calculatePetStage(1)).toBe(1);
      expect(calculatePetStage(2)).toBe(1);
    });

    it('returns stage 2 for 3 to 6 days', () => {
      expect(calculatePetStage(3)).toBe(2);
      expect(calculatePetStage(5)).toBe(2);
      expect(calculatePetStage(6)).toBe(2);
    });

    it('returns stage 3 for 7 to 13 days', () => {
      expect(calculatePetStage(7)).toBe(3);
      expect(calculatePetStage(10)).toBe(3);
      expect(calculatePetStage(13)).toBe(3);
    });

    it('returns stage 4 for 14 to 29 days', () => {
      expect(calculatePetStage(14)).toBe(4);
      expect(calculatePetStage(20)).toBe(4);
      expect(calculatePetStage(29)).toBe(4);
    });

    it('returns stage 5 for 30 days and beyond', () => {
      expect(calculatePetStage(30)).toBe(5);
      expect(calculatePetStage(100)).toBe(5);
    });
  });

  describe('calculateNextStageProgress', () => {
    it('calculates progress for stage 1 towards stage 2', () => {
      const progress = calculateNextStageProgress(1);
      expect(progress.currentStage).toBe(1);
      expect(progress.nextStage).toBe(2);
      expect(progress.daysNeeded).toBe(2); // needs 3 - 1 = 2
    });

    it('calculates 100% for stage 5', () => {
      const progress = calculateNextStageProgress(45);
      expect(progress.currentStage).toBe(5);
      expect(progress.nextStage).toBeNull();
      expect(progress.progressPercent).toBe(100);
      expect(progress.daysNeeded).toBe(0);
    });
  });

  describe('isSameDay & isYesterday', () => {
    const fixedToday = new Date('2026-11-10T10:00:00Z');

    it('detects same day correctly', () => {
      expect(isSameDay('2026-11-10', fixedToday)).toBe(true);
      expect(isSameDay('2026-11-09', fixedToday)).toBe(false);
    });

    it('detects yesterday correctly', () => {
      expect(isYesterday('2026-11-09', fixedToday)).toBe(true);
      expect(isYesterday('2026-11-10', fixedToday)).toBe(false);
      expect(isYesterday('2026-11-08', fixedToday)).toBe(false);
    });
  });

  describe('resolvePetState', () => {
    const fixedToday = new Date('2026-11-10T10:00:00Z');

    it('defaults to stage 1, sleeping, streak 0 when empty', () => {
      const state = resolvePetState(null, fixedToday);
      expect(state.name).toBe('Mầm Xanh');
      expect(state.streakDays).toBe(0);
      expect(state.stage).toBe(1);
      expect(state.isSleeping).toBe(true);
      expect(state.unlockedStages).toEqual([1]);
    });

    it('is awake and preserves streak if claimed today', () => {
      const state = resolvePetState(
        {
          name: 'Bé Xanh',
          streakDays: 7,
          lastStudyDate: '2026-11-10',
        },
        fixedToday
      );
      expect(state.name).toBe('Bé Xanh');
      expect(state.streakDays).toBe(7);
      expect(state.stage).toBe(3);
      expect(state.isSleeping).toBe(false);
      expect(state.unlockedStages).toContain(1);
      expect(state.unlockedStages).toContain(2);
      expect(state.unlockedStages).toContain(3);
    });

    it('sleeps but preserves streak if last studied yesterday', () => {
      const state = resolvePetState(
        {
          streakDays: 7,
          lastStudyDate: '2026-11-09',
        },
        fixedToday
      );
      expect(state.streakDays).toBe(7);
      expect(state.stage).toBe(3);
      expect(state.isSleeping).toBe(true);
    });

    it('resets streak to 0 and sleeps if missed more than 1 day', () => {
      const state = resolvePetState(
        {
          streakDays: 15,
          lastStudyDate: '2026-11-07',
        },
        fixedToday
      );
      expect(state.streakDays).toBe(0);
      expect(state.stage).toBe(1);
      expect(state.isSleeping).toBe(true);
    });
  });

  describe('getPetAssetUrl', () => {
    it('returns stage image with transparent png', () => {
      const awakeUrl = getPetAssetUrl(3, false);
      expect(awakeUrl).toContain('/pet/stage3.png');

      const sleepingUrl = getPetAssetUrl(2, true);
      expect(sleepingUrl).toContain('/pet/sleeping-stage2.png');
    });
  });
});
