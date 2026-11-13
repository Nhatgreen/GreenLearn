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
  isMobileUA: boolean;
  isLockedMobile: boolean;
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
  isMobileUA: false,
  isLockedMobile: false,
};

function checkIsMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isUA = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(ua);
  const isUAData = Boolean((navigator as any).userAgentData?.mobile);
  return isUA || isUAData;
}

function checkStoredMobileLock(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('vitudy_is_mobile') === '1' ||
      sessionStorage.getItem('vitudy_is_mobile') === '1' ||
      localStorage.getItem('greenlearn_is_mobile') === '1' ||
      sessionStorage.getItem('greenlearn_is_mobile') === '1' ||
      document.documentElement.getAttribute('data-device') === 'mobile'
    );
  } catch {
    return false;
  }
}

function computeLayout(): ResponsiveLayoutState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  const isMobileUA = checkIsMobileUA();
  const isLockedMobile = checkStoredMobileLock();

  const w = window.innerWidth;
  const h = window.innerHeight;
  const rawScreenW = window.screen?.width || w;
  const screenH = window.screen?.height || h;
  const dpr = window.devicePixelRatio || 1;

  // Converts physical hardware pixels (e.g. 1080/1440 on Android) to CSS pixels
  const effectiveScreenW = Math.min(rawScreenW, dpr > 1 ? rawScreenW / dpr : rawScreenW);
  const shortestSide = Math.min(w, h);

  // Media queries
  const isCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  const isFine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
  const isPortraitQuery = window.matchMedia ? window.matchMedia('(orientation: portrait)').matches : false;
  const isPortrait = isPortraitQuery || h >= w;
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Explicit desktop PC: large screen >= 1024px, shortest side >= 600px, not on mobile UA, and not coarse-only pointer
  const isExplicitDesktop = !isMobileUA && !isCoarse && w >= 1024 && shortestSide >= 600;

  // Valid locked mobile: keeps phone locked across reloads without misclassifying desktops.
  // If isLockedMobile is true (stored in localStorage/sessionStorage or data-device="mobile" set by <head> script),
  // it remains strictly locked to mobile UNLESS the device is explicitly a large desktop PC.
  const validLockedMobile = isLockedMobile && !isExplicitDesktop;

  // 1. MOBILE HARD-LOCK:
  // - Smartphone User-Agent (iPhone, Android Mobile)
  // - Valid mobile lock in sessionStorage/localStorage/data-device
  // - Physically a phone: shortest side < 600px with touch/coarse pointer
  // - Viewport < 640px
  // - Coarse pointer + portrait with w < 768px or effective screen < 600px
  // - Touch + portrait with effective screen <= 520px
  const isMobile = 
    isMobileUA ||
    validLockedMobile ||
    ((hasTouch || isCoarse) && shortestSide < 600) ||
    w < 640 || 
    (isCoarse && isPortrait && (w < 768 || effectiveScreenW < 600 || rawScreenW < 600)) ||
    (hasTouch && isPortrait && (effectiveScreenW <= 520 || rawScreenW <= 520));

  // 2. TABLET:
  // Not mobile, and (viewport < 1024px or iPad/Tablet with coarse pointer and width <= 1180px)
  const isTablet = !isMobile && (w < 1024 || (isCoarse && w <= 1180));

  // 3. DESKTOP:
  const isDesktop = !isMobile && !isTablet;

  const breakpoint: 'mobile' | 'tablet' | 'desktop' = isMobile 
    ? 'mobile' 
    : (isTablet ? 'tablet' : 'desktop');

  // Persist lock or clean up on explicit desktop PC
  try {
    if (isMobile) {
      localStorage.setItem('greenlearn_is_mobile', '1');
      sessionStorage.setItem('greenlearn_is_mobile', '1');
      localStorage.setItem('vitudy_is_mobile', '1');
      sessionStorage.setItem('vitudy_is_mobile', '1');
      document.documentElement.setAttribute('data-device', 'mobile');
    } else if (isDesktop && isExplicitDesktop) {
      localStorage.removeItem('greenlearn_is_mobile');
      sessionStorage.removeItem('greenlearn_is_mobile');
      localStorage.removeItem('vitudy_is_mobile');
      sessionStorage.removeItem('vitudy_is_mobile');
      document.documentElement.removeAttribute('data-device');
    }
  } catch {
    // Ignore storage errors in sandboxed environments
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    windowWidth: w,
    windowHeight: h,
    screenWidth: rawScreenW,
    screenHeight: screenH,
    devicePixelRatio: Number(dpr.toFixed(2)),
    orientation: isPortrait ? 'portrait' : 'landscape',
    pointerType: isCoarse ? 'coarse' : (isFine ? 'fine' : 'none'),
    hasTouch,
    isMobileUA,
    isLockedMobile,
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

    // Multi-tick settle checks for mobile browsers when reloading
    // Mobile browsers (Safari/Chrome) often report 980px or unsettled dimensions during early document load
    const settleTimers = [
      setTimeout(update, 50),
      setTimeout(update, 150),
      setTimeout(update, 300),
      setTimeout(update, 600),
      setTimeout(update, 1000),
    ];

    let rafId: number | null = null;
    const debouncedUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        update();
      });
    };

    window.addEventListener('resize', debouncedUpdate, { passive: true });
    window.addEventListener('orientationchange', debouncedUpdate, { passive: true });
    window.addEventListener('pageshow', debouncedUpdate, { passive: true });

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
      settleTimers.forEach(clearTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      window.removeEventListener('pageshow', debouncedUpdate);
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
