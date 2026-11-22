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

  it('handles mobile pointer drag and updates item position via pointer events', () => {
    const onDropCheck = vi.fn();
    const { result } = renderHook(() =>
      useDeskItemInteraction({
        itemId: 'item-1',
        itemX: 100,
        itemY: 100,
        rotation: 0,
        width: 200,
        height: 200,
        onDropCheck,
      })
    );

    const mockPointerEvent = {
      pointerId: 1,
      button: 0,
      clientX: 150,
      clientY: 150,
      stopPropagation: vi.fn(),
      target: document.createElement('div'),
      currentTarget: {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      },
    } as unknown as React.PointerEvent;

    act(() => {
      result.current.handlePointerDown(mockPointerEvent);
    });

    expect(mockBringToFront).toHaveBeenCalledWith('item-1');
    expect(mockSelectItem).toHaveBeenCalledWith('item-1');
    expect(result.current.isDragging).toBe(true);

    // Simulate moving 50px right and 30px down
    const moveEvent = new MouseEvent('pointermove', {
      clientX: 200,
      clientY: 180,
    });
    act(() => {
      window.dispatchEvent(moveEvent);
    });

    // Simulate pointer up / touch end
    const upEvent = new MouseEvent('pointerup');
    act(() => {
      window.dispatchEvent(upEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(mockUpdateItemPosition).toHaveBeenCalledWith('item-1', 150, 130);
    expect(onDropCheck).toHaveBeenCalledWith(150, 130);
  });

  it('handles mobile touchmove and updates item position', () => {
    const { result } = renderHook(() =>
      useDeskItemInteraction({
        itemId: 'item-2',
        itemX: 50,
        itemY: 60,
        rotation: 0,
        width: 100,
        height: 100,
      })
    );

    const mockPointerEvent = {
      pointerId: 2,
      button: 0,
      clientX: 50,
      clientY: 60,
      stopPropagation: vi.fn(),
      target: document.createElement('div'),
      currentTarget: {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      },
    } as unknown as React.PointerEvent;

    act(() => {
      result.current.handlePointerDown(mockPointerEvent);
    });

    // Simulate touchmove
    const touchMoveEvent = new Event('touchmove') as any;
    touchMoveEvent.touches = [{ clientX: 70, clientY: 90 }];
    act(() => {
      window.dispatchEvent(touchMoveEvent);
    });

    const touchEndEvent = new Event('touchend');
    act(() => {
      window.dispatchEvent(touchEndEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(mockUpdateItemPosition).toHaveBeenCalledWith('item-2', 70, 90);
  });
});
