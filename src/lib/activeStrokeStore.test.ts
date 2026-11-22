import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { activeStrokeStore, useActiveStroke } from './activeStrokeStore';

describe('activeStrokeStore & useActiveStroke', () => {
  it('manages stroke state without throwing', () => {
    expect(activeStrokeStore.getStroke()).toBeNull();

    const dummyStroke: import('@/types/studyspace').DrawingStroke = {
      id: 'test-stroke-1',
      points: [{ x: 10, y: 20 }],
      color: '#16A34A',
      width: 3,
      isHighlighter: false,
    };

    activeStrokeStore.setStroke(dummyStroke);
    expect(activeStrokeStore.getStroke()).toEqual(dummyStroke);

    activeStrokeStore.appendPoint({ x: 15, y: 25 });
    const updated = activeStrokeStore.getStroke();
    expect(updated?.points.length).toBe(2);
    expect(updated?.points[1]).toEqual({ x: 15, y: 25 });

    activeStrokeStore.setStroke(null);
    expect(activeStrokeStore.getStroke()).toBeNull();
  });

  it('notifies subscribers via useActiveStroke', () => {
    const { result } = renderHook(() => useActiveStroke());
    expect(result.current).toBeNull();

    act(() => {
      activeStrokeStore.setStroke({
        id: 'stroke-sub-1',
        points: [{ x: 100, y: 200 }],
        color: '#ff0000',
        width: 2,
        isHighlighter: false,
      });
    });

    expect(result.current?.id).toBe('stroke-sub-1');
    expect(result.current?.points).toEqual([{ x: 100, y: 200 }]);

    act(() => {
      activeStrokeStore.appendPoint({ x: 105, y: 205 });
    });

    expect(result.current?.points.length).toBe(2);

    act(() => {
      activeStrokeStore.setStroke(null);
    });

    expect(result.current).toBeNull();
  });
});
