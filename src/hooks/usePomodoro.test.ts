import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoro } from './usePomodoro';

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with work phase and formatted 25:00', () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsLeft).toBe(1500);
    expect(result.current.formattedTime).toBe('25:00');
    expect(result.current.isRunning).toBe(false);
  });

  it('counts down when started', () => {
    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000); // 3s
    });

    expect(result.current.secondsLeft).toBe(1497);
    expect(result.current.formattedTime).toBe('24:57');
  });

  it('pauses and resumes countdown', () => {
    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.secondsLeft).toBe(1495);

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.secondsLeft).toBe(1495); // unchanged while paused
  });

  it('switches to break phase when work timer expires', () => {
    const { result } = renderHook(() => usePomodoro({ workMinutes: 1, breakMinutes: 1 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    expect(result.current.phase).toBe('break');
    expect(result.current.secondsLeft).toBe(60);
  });
});
