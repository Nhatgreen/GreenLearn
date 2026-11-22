import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingPet } from './FloatingPet';

const mockClaimToday = vi.fn().mockReturnValue({ success: true, newStreak: 2, stageChanged: false });
let mockIsClaimedToday = false;
let mockPet = {
  name: 'Mầm Xanh',
  stage: 1 as const,
  isSleeping: true,
  streakDays: 1,
  lastStudyDate: null,
  unlockedStages: [1 as const],
  todayStudySeconds: 0,
};

vi.mock('@/hooks/usePetMascot', () => ({
  usePetMascot: () => ({
    pet: mockPet,
    info: {
      stage: 1,
      name: 'Hạt Giống Xanh',
      title: 'Mầm Mới Nhú',
      minDays: 1,
      maxDays: 2,
      description: 'Mầm non bé bỏng',
      activeQuote: 'Chào bạn',
      sleepingQuote: 'Khò khò',
    },
    isClaimedToday: mockIsClaimedToday,
    claimToday: mockClaimToday,
    renamePet: vi.fn(),
    addStudySeconds: vi.fn(),
    currentImageUrl: '/pet/sleeping-stage1.png',
    nextStageProgress: {
      currentStage: 1,
      nextStage: 2,
      currentDays: 1,
      daysNeeded: 2,
      progressPercent: 50,
    },
  }),
}));

describe('FloatingPet Widget Component for GreenLearn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsClaimedToday = false;
    mockPet = {
      name: 'Mầm Xanh',
      stage: 1 as const,
      isSleeping: true,
      streakDays: 1,
      lastStudyDate: null,
      unlockedStages: [1 as const],
      todayStudySeconds: 0,
    };
  });

  it('renders pet sleeping image when not claimed today', () => {
    render(<FloatingPet />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('sleeping-stage1.png');
  });

  it('triggers claimToday and wake up when tapped while asleep (movement under 6px)', () => {
    render(<FloatingPet />);
    const petContainer = screen.getByTitle('Bấm để đánh thức Mầm Xanh và điểm danh chuỗi học hôm nay');

    fireEvent.pointerDown(petContainer, { clientX: 200, clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(petContainer, { clientX: 200, clientY: 300, pointerId: 1 });

    expect(mockClaimToday).toHaveBeenCalledTimes(1);
  });

  it('renders awake pet title when already claimed today', () => {
    mockIsClaimedToday = true;
    mockPet.isSleeping = false;
    render(<FloatingPet />);

    const petContainer = screen.getByTitle('Bấm để xem chi tiết Mầm Xanh');
    expect(petContainer).toBeDefined();
  });
});
