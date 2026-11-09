'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroPhase = 'work' | 'break';

export interface UsePomodoroOptions {
  workMinutes?: number;
  breakMinutes?: number;
  onPhaseComplete?: (phase: PomodoroPhase) => void;
}

export interface UsePomodoroResult {
  phase: PomodoroPhase;
  secondsLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formattedTime: string;
}

export function usePomodoro({
  workMinutes = 25,
  breakMinutes = 5,
  onPhaseComplete,
}: UsePomodoroOptions = {}): UsePomodoroResult {
  const [phase, setPhase] = useState<PomodoroPhase>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(workMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const onPhaseCompleteRef = useRef(onPhaseComplete);
  onPhaseCompleteRef.current = onPhaseComplete;

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('work');
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Switch phase
          const nextPhase = phaseRef.current === 'work' ? 'break' : 'work';
          const nextSeconds = (nextPhase === 'work' ? workMinutes : breakMinutes) * 60;
          setPhase(nextPhase);

          if (onPhaseCompleteRef.current) {
            onPhaseCompleteRef.current(phaseRef.current);
          }
          return nextSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, workMinutes, breakMinutes]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return {
    phase,
    secondsLeft,
    isRunning,
    start,
    pause,
    reset,
    formattedTime,
  };
}
