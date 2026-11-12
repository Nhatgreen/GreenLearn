import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveLayout } from './useResponsiveLayout';

describe('useResponsiveLayout', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    window.matchMedia = originalMatchMedia;
  });

  it('detects desktop layout when width is large with fine pointer', () => {
    window.innerWidth = 1440;
    window.innerHeight = 900;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('fine') || query.includes('landscape'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.breakpoint).toBe('desktop');
  });

  it('detects mobile layout when viewport width is below 640px', () => {
    window.innerWidth = 390;
    window.innerHeight = 844;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('coarse') || query.includes('portrait'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('detects mobile layout even when innerWidth >= 640px if phone has coarse pointer in portrait with screen.width < 600px', () => {
    // Smartphone with high-density / small-display zoom: innerWidth reaches 660px, but screen.width is 412px
    window.innerWidth = 660;
    window.innerHeight = 915;
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: { width: 412, height: 915 },
    });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('(pointer: coarse)') || query.includes('(orientation: portrait)'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.breakpoint).toBe('mobile');
  });

  it('detects tablet when width is between 768px and 1024px', () => {
    window.innerWidth = 820;
    window.innerHeight = 1180;
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: { width: 820, height: 1180 },
    });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('(pointer: coarse)'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.breakpoint).toBe('tablet');
  });

  it('recalculates on window resize', async () => {
    window.innerWidth = 1200;
    window.innerHeight = 800;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isDesktop).toBe(true);

    act(() => {
      window.innerWidth = 360;
      window.innerHeight = 740;
      window.dispatchEvent(new Event('resize'));
    });

    // Allow requestAnimationFrame / microtask queue to process debouncedUpdate
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.breakpoint).toBe('mobile');
  });
});
