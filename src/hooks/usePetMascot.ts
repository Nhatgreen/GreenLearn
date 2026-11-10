'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PetState, PetStageInfo, PET_STAGES } from '@/types/pet';
import {
  PET_STORAGE_KEY,
  LEGACY_STREAK_KEY,
  VITUDY_STREAK_KEY,
  resolvePetState,
  calculatePetStage,
  calculateNextStageProgress,
  getPetAssetUrl,
  formatDateStr,
  isSameDay,
  isYesterday,
  NextStageProgress,
} from '@/lib/petHelpers';

export interface UsePetMascotResult {
  pet: PetState;
  info: PetStageInfo;
  isClaimedToday: boolean;
  nextStageProgress: NextStageProgress;
  claimToday: () => { success: boolean; newStreak: number; stageChanged: boolean };
  renamePet: (name: string) => void;
  addStudySeconds: (seconds: number) => { autoClaimed: boolean };
  currentImageUrl: string;
}

export function loadStoredPetState(): PetState {
  if (typeof window === 'undefined') {
    return resolvePetState(null);
  }

  try {
    const rawPet = localStorage.getItem(PET_STORAGE_KEY);
    if (rawPet) {
      const parsed = JSON.parse(rawPet);
      return resolvePetState(parsed);
    }

    // Fallback migration từ legacy streak
    const legacy = localStorage.getItem(LEGACY_STREAK_KEY) || localStorage.getItem(VITUDY_STREAK_KEY);
    if (legacy) {
      const parsedStreak = JSON.parse(legacy);
      const days = typeof parsedStreak.streakDays === 'number' ? parsedStreak.streakDays : 1;
      const lastDate = parsedStreak.lastClaimDate || null;
      return resolvePetState({
        streakDays: days,
        lastStudyDate: lastDate,
      });
    }
  } catch {}

  return resolvePetState(null);
}

export function savePetState(state: PetState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(state));
    // Đồng bộ legacy streak key để tương thích với các component cũ
    localStorage.setItem(
      LEGACY_STREAK_KEY,
      JSON.stringify({
        streakDays: state.streakDays,
        lastClaimDate: state.lastStudyDate,
      })
    );
    window.dispatchEvent(new Event('greenlearn_pet_updated'));
    window.dispatchEvent(new Event('greenlearn_streak_updated'));
  } catch {}
}

export function usePetMascot(): UsePetMascotResult {
  const [pet, setPet] = useState<PetState>(() => loadStoredPetState());

  const refreshState = useCallback(() => {
    setPet(loadStoredPetState());
  }, []);

  useEffect(() => {
    refreshState();

    const handleStorageOrUpdate = () => {
      refreshState();
    };

    window.addEventListener('greenlearn_pet_updated', handleStorageOrUpdate);
    window.addEventListener('greenlearn_streak_updated', handleStorageOrUpdate);
    window.addEventListener('storage', handleStorageOrUpdate);

    return () => {
      window.removeEventListener('greenlearn_pet_updated', handleStorageOrUpdate);
      window.removeEventListener('greenlearn_streak_updated', handleStorageOrUpdate);
      window.removeEventListener('storage', handleStorageOrUpdate);
    };
  }, [refreshState]);

  const todayStr = formatDateStr(new Date());
  const isClaimedToday = isSameDay(pet.lastStudyDate, new Date());

  const info: PetStageInfo = useMemo(() => {
    return PET_STAGES[pet.stage] || PET_STAGES[1];
  }, [pet.stage]);

  const nextStageProgress = useMemo(() => {
    return calculateNextStageProgress(pet.streakDays);
  }, [pet.streakDays]);

  const currentImageUrl = useMemo(() => {
    return getPetAssetUrl(pet.stage, pet.isSleeping);
  }, [pet.stage, pet.isSleeping]);

  const claimToday = useCallback(() => {
    const today = new Date();
    const currentTodayStr = formatDateStr(today);

    // Nếu hôm nay đã điểm danh rồi thì giữ nguyên
    if (isSameDay(pet.lastStudyDate, today)) {
      return { success: false, newStreak: pet.streakDays, stageChanged: false };
    }

    let nextStreak = 1;
    if (isYesterday(pet.lastStudyDate, today)) {
      nextStreak = pet.streakDays + 1;
    }

    const nextStage = calculatePetStage(nextStreak);
    const stageChanged = nextStage !== pet.stage;

    const unlockedSet = new Set(pet.unlockedStages);
    for (let s = 1; s <= nextStage; s++) {
      unlockedSet.add(s as typeof pet.stage);
    }

    const updated: PetState = {
      ...pet,
      streakDays: nextStreak,
      lastStudyDate: currentTodayStr,
      isSleeping: false,
      stage: nextStage,
      unlockedStages: Array.from(unlockedSet).sort() as typeof pet.unlockedStages,
    };

    setPet(updated);
    savePetState(updated);

    return { success: true, newStreak: nextStreak, stageChanged };
  }, [pet]);

  const renamePet = useCallback((newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated: PetState = {
      ...pet,
      name: trimmed.slice(0, 24),
    };
    setPet(updated);
    savePetState(updated);
  }, [pet]);

  const addStudySeconds = useCallback((seconds: number) => {
    const today = new Date();
    const updatedSeconds = pet.todayStudySeconds + Math.max(0, seconds);
    let autoClaimed = false;

    // Tự động điểm danh khi học đủ 180s (3 phút) trên bàn học nếu chưa điểm danh hôm nay
    if (updatedSeconds >= 180 && !isSameDay(pet.lastStudyDate, today)) {
      let nextStreak = 1;
      if (isYesterday(pet.lastStudyDate, today)) {
        nextStreak = pet.streakDays + 1;
      }
      const nextStage = calculatePetStage(nextStreak);
      const unlockedSet = new Set(pet.unlockedStages);
      for (let s = 1; s <= nextStage; s++) {
        unlockedSet.add(s as typeof pet.stage);
      }

      const updated: PetState = {
        ...pet,
        streakDays: nextStreak,
        lastStudyDate: formatDateStr(today),
        isSleeping: false,
        stage: nextStage,
        unlockedStages: Array.from(unlockedSet).sort() as typeof pet.unlockedStages,
        todayStudySeconds: updatedSeconds,
      };
      setPet(updated);
      savePetState(updated);
      autoClaimed = true;
    } else {
      const updated: PetState = {
        ...pet,
        todayStudySeconds: updatedSeconds,
      };
      setPet(updated);
      savePetState(updated);
    }

    return { autoClaimed };
  }, [pet]);

  return {
    pet,
    info,
    isClaimedToday,
    nextStageProgress,
    claimToday,
    renamePet,
    addStudySeconds,
    currentImageUrl,
  };
}
