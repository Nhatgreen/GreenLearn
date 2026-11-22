'use client';

import { useSyncExternalStore } from 'react';
import type { DrawingStroke } from '@/types/studyspace';

type Listener = () => void;
let activeStroke: DrawingStroke | null = null;
const listeners = new Set<Listener>();

export const activeStrokeStore = {
  getStroke: (): DrawingStroke | null => activeStroke,
  setStroke: (stroke: DrawingStroke | null): void => {
    activeStroke = stroke;
    listeners.forEach((l) => l());
  },
  appendPoint: (pt: { x: number; y: number }): void => {
    if (!activeStroke) return;
    activeStroke = {
      ...activeStroke,
      points: [...activeStroke.points, pt],
    };
    listeners.forEach((l) => l());
  },
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Hook to subscribe ONLY to high-frequency in-progress stroke updates (60-120fps)
 * without causing any re-renders to StudySpaceContext or other desk objects.
 */
export function useActiveStroke(): DrawingStroke | null {
  return useSyncExternalStore(
    activeStrokeStore.subscribe,
    activeStrokeStore.getStroke,
    () => null
  );
}
