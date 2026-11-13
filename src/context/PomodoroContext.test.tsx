import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PomodoroProvider, usePomodoroContext } from './PomodoroContext';

describe('PomodoroContext', () => {
  it('provides formatted countdown time and toggle functions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PomodoroProvider>{children}</PomodoroProvider>
    );

    const { result } = renderHook(() => usePomodoroContext(), { wrapper });

    expect(result.current.formattedTime).toBe('25:00');
    expect(result.current.phase).toBe('work');
    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.reset();
    });
    expect(result.current.formattedTime).toBe('25:00');
  });
});
