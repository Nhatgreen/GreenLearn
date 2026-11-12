'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  windowWidth: number;
  windowHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  pointerType: 'coarse' | 'fine' | 'none';
  hasTouch: boolean;
}

const DEFAULT_STATE: ResponsiveLayoutState = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: 'desktop',
  windowWidth: 1920,
  windowHeight: 1080,
  screenWidth: 1920,
  screenHeight: 1080,
  devicePixelRatio: 1,
  orientation: 'landscape',
  pointerType: 'fine',
  hasTouch: false,
};

function computeLayout(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const screenW = window.screen?.width || w;
  const screenH = window.screen?.height || h;
  const dpr = window.devicePixelRatio || 1;

  // Media queries
  const isCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  const isFine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
  const isPortraitQuery = window.matchMedia ? window.matchMedia('(orientation: portrait)').matches : false;
  const isPortrait = isPortraitQuery || h >= w;
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // 1. MOBILE:
  // - Viewport < 640px luôn là mobile
  // - Hoặc màn hình cảm ứng (pointer: coarse) ở chiều dọc (portrait) với width < 768px hoặc screen.width < 600px
  //   (Chống nhầm lẫn tablet layout trên các smartphone màn hình độ phân giải cao hoặc zoom hiển thị)
  // - Hoặc thiết bị có touch ở chiều dọc và screen.width <= 500px
  const isMobile = 
    w < 640 || 
    (isCoarse && isPortrait && (w < 768 || screenW < 600)) ||
    (hasTouch && isPortrait && screenW <= 500);

  // 2. TABLET:
  // - Không phải mobile, và viewport < 1024px (hoặc iPad/Tablet cảm ứng có width <= 1180px)
  const isTablet = !isMobile && (w < 1024 || (isCoarse && w <= 1180));

  // 3. DESKTOP:
  const isDesktop = !isMobile && !isTablet;

  const breakpoint: 'mobile' | 'tablet' | 'desktop' = isMobile 
    ? 'mobile' 
    : (isTablet ? 'tablet' : 'desktop');

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    windowWidth: w,
    windowHeight: h,
    screenWidth: screenW,
    screenHeight: screenH,
    devicePixelRatio: Number(dpr.toFixed(2)),
    orientation: isPortrait ? 'portrait' : 'landscape',
    pointerType: isCoarse ? 'coarse' : (isFine ? 'fine' : 'none'),
    hasTouch,
  };
}

export function useResponsiveLayout(): ResponsiveLayoutState {
  const [layout, setLayout] = useState<ResponsiveLayoutState>(computeLayout);

  const update = useCallback(() => {
    setLayout(computeLayout());
  }, []);

  useEffect(() => {
    // Initial sync
    update();

    let rafId: number | null = null;
    const debouncedUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        update();
      });
    };

    window.addEventListener('resize', debouncedUpdate, { passive: true });
    window.addEventListener('orientationchange', debouncedUpdate, { passive: true });

    // Visual viewport listener for mobile virtual keyboard and pinch-zoom
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdate, { passive: true });
    }

    // Media query listeners
    const mqlPortrait = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
    const mqlPointer = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;

    if (mqlPortrait) {
      mqlPortrait.addEventListener('change', debouncedUpdate);
    }
    if (mqlPointer) {
      mqlPointer.addEventListener('change', debouncedUpdate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdate);
      }
      if (mqlPortrait) {
        mqlPortrait.removeEventListener('change', debouncedUpdate);
      }
      if (mqlPointer) {
        mqlPointer.removeEventListener('change', debouncedUpdate);
      }
    };
  }, [update]);

  return layout;
}
