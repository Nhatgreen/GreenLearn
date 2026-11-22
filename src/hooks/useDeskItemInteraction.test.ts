import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeskItemInteraction } from './useDeskItemInteraction';

const mockUpdateItemPosition = vi.fn();
const mockSetItemRotation = vi.fn();
const mockSelectItem = vi.fn();
const mockBringToFront = vi.fn();

vi.mock('@/context/StudySpaceContext', () => ({
  useStudySpace: () => ({
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    updateItemPosition: mockUpdateItemPosition,
    setItemRotation: mockSetItemRotation,
    selectItem: mockSelectItem,
    bringToFront: mockBringToFront,
  }),
}));

describe('useDeskItemInteraction - Mobile Touch & Pointer Rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides both mouse and pointer handlers for backward compatibility', () => {
    const { result } = renderHook(() =>
      useDeskItemInteraction({
        itemId: 'item-1',
        itemX: 100,
        itemY: 100,
        rotation: 0,
        width: 200,
        height: 200,
      })
    );

    expect(typeof result.current.handlePointerDown).toBe('function');
    expect(typeof result.current.handleMouseDown).toBe('function');
    expect(typeof result.current.handleRotatePointerDown).toBe('function');
    expect(typeof result.current.handleRotateMouseDown).toBe('function');
    expect(typeof result.current.handleRotateDoubleClick).toBe('function');
  });

  it('resets rotation to 0 on double tap within 320ms', () => {
    const { result } = renderHook(() =>
      useDeskItemInteraction({
        itemId: 'item-1',
        itemX: 100,
        itemY: 100,
        rotation: 45,
        width: 200,
        height: 200,
      })
    );

    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      clientX: 200,
      clientY: 300,
      currentTarget: {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      },
    } as unknown as React.PointerEvent;

    // First tap
    act(() => {
      result.current.handleRotatePointerDown(mockEvent);
    });

    // Second tap immediately after (double tap)
    act(() => {
      result.current.handleRotatePointerDown(mockEvent);
    });

    expect(mockSetItemRotation).toHaveBeenCalledWith('item-1', 0);
  });

  it('handles double click to reset rotation to 0', () => {
    const { result } = renderHook(() =>
      useDeskItemInteraction({
        itemId: 'item-1',
        itemX: 100,
        itemY: 100,
        rotation: 90,
        width: 200,
        height: 200,
      })
    );

    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    } as unknown as React.MouseEvent;

    act(() => {
      result.current.handleRotateDoubleClick(mockEvent);
    });

    expect(mockSetItemRotation).toHaveBeenCalledWith('item-1', 0);
  });
});
