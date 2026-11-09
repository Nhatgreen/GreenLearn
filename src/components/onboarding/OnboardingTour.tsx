'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TourStep, TourStepConfig } from './TourStep';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

const TOUR_STEPS: TourStepConfig[] = [
  {
    title: 'Làm quen với bàn học',
    description: 'Đây là mặt bàn làm việc của bạn. Bạn có thể mở sách, dán giấy ghi chú và vẽ trực tiếp lên trang sách.',
    position: 'center',
  },
  {
    targetSelector: '[data-tour="upload-btn"]',
    title: 'Mở tài liệu',
    description: 'Bấm nút Tải lên hoặc kéo thả tệp PDF vào mặt bàn để đọc.',
    position: 'top',
  },
  {
    targetSelector: '[data-tour="tool-pen"]',
    title: 'Bút vẽ và dạ quang',
    description: 'Dùng bút dạ quang để gạch chân câu quan trọng. Khi bạn kéo sách đi chỗ khác, nét vẽ vẫn ở nguyên trên trang.',
    position: 'right',
  },
  {
    targetSelector: '[data-tour="wasd-hint"]',
    title: 'Di chuyển góc nhìn',
    description: 'Lăn chuột để phóng to thu nhỏ. Bấm các phím W, A, S, D hoặc giữ chuột trái kéo mặt bàn để xem xung quanh.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="minimap-toggle"]',
    title: 'Bản đồ thu nhỏ',
    description: 'Xem vị trí các cuốn sách trên bàn và bấm vào để nhảy nhanh tới tài liệu cần đọc.',
    position: 'top',
  },
  {
    targetSelector: '[data-tour="wallet-market"]',
    title: 'Ví ViToken và Chợ',
    description: 'Điểm danh nhận ViToken mỗi ngày để đổi tài liệu và câu hỏi ôn tập trên Chợ.',
    position: 'left',
  },
  {
    targetSelector: '[data-tour="inteline-btn"]',
    title: 'Hỏi bài khi đọc sách',
    description: 'Bôi đen đoạn chữ chưa hiểu để xem giải thích thêm hoặc tạo câu hỏi trắc nghiệm tự kiểm tra.',
    position: 'top',
  },
];

const ONBOARDING_KEY = 'vitudy_onboarding_done';

export function OnboardingTour() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if onboarding was already completed
    const localDone = localStorage.getItem(ONBOARDING_KEY);
    if (!localDone) {
      // Small delay to allow initial desk rendering
      const timer = setTimeout(() => {
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const finishTour = useCallback(async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setCurrentStep(null);
    if (user) {
      const supabase = getSupabase();
      await supabase?.rpc('complete_onboarding');
    }
  }, [user]);

  // Update target rect when step changes
  useEffect(() => {
    if (currentStep === null) {
      setTargetRect(null);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  if (currentStep === null) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => (prev !== null ? prev + 1 : null));
    } else {
      finishTour();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
      {/* Dimmed background overlay */}
      <div 
        onClick={finishTour}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-auto"
      />

      {/* Spotlight cutout if target element exists */}
      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-[#E0562D] shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Floating Tour Step Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <TourStep
          step={step}
          stepIndex={currentStep}
          totalSteps={TOUR_STEPS.length}
          onNext={handleNext}
          onSkip={finishTour}
        />
      </div>
    </div>,
    document.body
  );
}
