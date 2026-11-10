import { PetStage, PetState, PET_STAGES } from '@/types/pet';
import { getAssetPath } from '@/lib/assets';

export const PET_STORAGE_KEY = 'greenlearn_pet';
export const LEGACY_STREAK_KEY = 'greenlearn_streak';
export const VITUDY_STREAK_KEY = 'vitudy_streak';

export const DEFAULT_PET_NAME = 'Mầm Xanh';

export function calculatePetStage(streakDays: number): PetStage {
  if (streakDays >= 30) return 5;
  if (streakDays >= 14) return 4;
  if (streakDays >= 7) return 3;
  if (streakDays >= 3) return 2;
  return 1;
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(dateStr: string | null | undefined, compareDate: Date): boolean {
  if (!dateStr) return false;
  return dateStr === formatDateStr(compareDate);
}

export function isYesterday(dateStr: string | null | undefined, compareDate: Date): boolean {
  if (!dateStr) return false;
  const yesterday = new Date(compareDate);
  yesterday.setDate(compareDate.getDate() - 1);
  return dateStr === formatDateStr(yesterday);
}

export interface NextStageProgress {
  currentStage: PetStage;
  nextStage: PetStage | null;
  currentDays: number;
  daysNeeded: number;
  progressPercent: number;
}

export function calculateNextStageProgress(streakDays: number): NextStageProgress {
  const currentStage = calculatePetStage(streakDays);
  if (currentStage >= 5) {
    return {
      currentStage: 5,
      nextStage: null,
      currentDays: streakDays,
      daysNeeded: 0,
      progressPercent: 100,
    };
  }

  const nextStage = (currentStage + 1) as PetStage;
  const targetDays = PET_STAGES[nextStage].minDays;
  const prevMaxDays = PET_STAGES[currentStage].minDays;
  const span = targetDays - prevMaxDays;
  const earnedInSpan = Math.max(0, streakDays - prevMaxDays);
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInSpan / span) * 100)));

  return {
    currentStage,
    nextStage,
    currentDays: streakDays,
    daysNeeded: Math.max(0, targetDays - streakDays),
    progressPercent,
  };
}

export function resolvePetState(
  raw: Partial<PetState> | null | undefined,
  today: Date = new Date()
): PetState {
  const todayStr = formatDateStr(today);
  const name = (raw?.name && raw.name.trim().length > 0) ? raw.name.trim() : DEFAULT_PET_NAME;

  let streakDays = typeof raw?.streakDays === 'number' ? Math.max(0, raw.streakDays) : 0;
  const lastStudyDate = raw?.lastStudyDate || null;
  const todayStudySeconds = typeof raw?.todayStudySeconds === 'number' ? Math.max(0, raw.todayStudySeconds) : 0;

  // Kiểm tra tính liên tục của chuỗi
  let isClaimedToday = false;
  let isSleeping = true;

  if (lastStudyDate) {
    if (isSameDay(lastStudyDate, today)) {
      isClaimedToday = true;
      isSleeping = false;
    } else if (isYesterday(lastStudyDate, today)) {
      // Giữ nguyên chuỗi ngày nhưng hôm nay chưa học -> Thú cưng ngủ chờ đánh thức
      isClaimedToday = false;
      isSleeping = true;
    } else {
      // Đã gián đoạn hơn 1 ngày -> Chuỗi về 0, thú cưng ngủ
      streakDays = 0;
      isClaimedToday = false;
      isSleeping = true;
    }
  } else {
    // Chưa có ngày học nào -> streak = 0
    streakDays = 0;
    isClaimedToday = false;
    isSleeping = true;
  }

  const currentStage = calculatePetStage(streakDays);

  // Danh sách các cấp đã mở khóa
  const existingUnlocked = Array.isArray(raw?.unlockedStages) ? raw.unlockedStages : [];
  const unlockedSet = new Set<PetStage>(existingUnlocked);
  for (let s = 1; s <= currentStage; s++) {
    unlockedSet.add(s as PetStage);
  }
  const unlockedStages = Array.from(unlockedSet).sort() as PetStage[];

  return {
    name,
    stage: currentStage,
    isSleeping,
    streakDays,
    lastStudyDate: isClaimedToday ? todayStr : (lastStudyDate && isYesterday(lastStudyDate, today) ? lastStudyDate : null),
    unlockedStages,
    todayStudySeconds,
  };
}

export function getPetAssetUrl(stage: PetStage, isSleeping: boolean): string {
  const filename = isSleeping ? `sleeping-stage${stage}.png` : `stage${stage}.png`;
  return getAssetPath(`/pet/${filename}`);
}
