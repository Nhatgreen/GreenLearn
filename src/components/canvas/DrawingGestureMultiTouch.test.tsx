import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { DeskDrawingInteractionLayer } from './DeskDrawingInteractionLayer';

const mockStartStroke = vi.fn();
const mockAppendPoint = vi.fn();
const mockFinishStroke = vi.fn();
const mockCancelStroke = vi.fn();
const mockSetTransform = vi.fn();
const mockPanBy = vi.fn();
const mockSetActiveTool = vi.fn();
const mockRemoveStrokesInBox = vi.fn();

let mockActiveTool = 'pen';
let mockIsFingerDrawingEnabled = true;

vi.mock('@/context/StudySpaceContext', () => ({
  useStudySpace: () => ({
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    setTransform: mockSetTransform,
    panBy: mockPanBy,
    activeTool: mockActiveTool,
    setActiveTool: mockSetActiveTool,
    penColor: '#2563eb',
    penWidthLevel: 'medium',
    stickyCreationColor: null,
    setStickyCreationColor: vi.fn(),
    stickyCreationTemplate: null,
    setStickyCreationTemplate: vi.fn(),
    addStickyNote: vi.fn(),
    addBook: vi.fn(),
    addCodeBlock: vi.fn(),
    addMindMapNode: vi.fn(),
    addSticker: vi.fn(),
    startStroke: mockStartStroke,
    appendPoint: mockAppendPoint,
    finishStroke: mockFinishStroke,
    cancelStroke: mockCancelStroke,
    isFingerDrawingEnabled: mockIsFingerDrawingEnabled,
    removeStrokesInBox: mockRemoveStrokesInBox,
  }),
}));

describe('Drawing Multi-Touch Gestures & Pointer Events', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockActiveTool = 'pen';
    mockIsFingerDrawingEnabled = true;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders with touch-action: none on the capture plane', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0');
    expect(plane).toBeDefined();
    expect(plane).toHaveStyle({ touchAction: 'none' });
  });

  it('delays single-touch stroke start by ~40ms to detect potential second finger', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    // First finger touches down
    fireEvent.pointerDown(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
      isPrimary: true,
      button: 0,
    });

    // Stroke should not have started immediately at t = 0
    expect(mockStartStroke).not.toHaveBeenCalled();

    // Advance 20ms (still within buffer)
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(mockStartStroke).not.toHaveBeenCalled();

    // Advance past 40ms buffer
    act(() => {
      vi.advanceTimersByTime(25);
    });
    expect(mockStartStroke).toHaveBeenCalledTimes(1);
    expect(mockStartStroke).toHaveBeenCalledWith(
      { x: 100, y: 100 },
      '#2563eb',
      3.5,
      false
    );
  });

  it('immediately cancels drawing and starts pinch-zoom when two fingers touch down', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    // Finger 1 touches down
    fireEvent.pointerDown(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
      isPrimary: true,
      button: 0,
    });

    // Finger 2 touches down 15ms later (before 40ms timer fires)
    act(() => {
      vi.advanceTimersByTime(15);
    });

    fireEvent.pointerDown(plane, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 200,
      clientY: 200,
      isPrimary: false,
      button: 0,
    });

    // Advance past initial timer: stroke MUST NEVER start
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(mockStartStroke).not.toHaveBeenCalled();

    // Moving fingers should trigger setTransform (pinch zoom & pan), NOT appendPoint
    fireEvent.pointerMove(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 80,
      clientY: 80,
    });
    fireEvent.pointerMove(plane, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 220,
      clientY: 220,
    });

    expect(mockAppendPoint).not.toHaveBeenCalled();
    expect(mockSetTransform).toHaveBeenCalled();
  });

  it('cancels an in-progress stroke if a second finger lands after stroke has started', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    // Finger 1 touches down
    fireEvent.pointerDown(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
      isPrimary: true,
      button: 0,
    });

    // Timer expires, stroke begins
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(mockStartStroke).toHaveBeenCalledTimes(1);

    // Finger 1 draws a bit
    fireEvent.pointerMove(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 120,
      clientY: 120,
    });
    expect(mockAppendPoint).toHaveBeenCalledWith({ x: 120, y: 120 });

    // Finger 2 touches down!
    fireEvent.pointerDown(plane, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 300,
      clientY: 300,
      isPrimary: false,
      button: 0,
    });

    // In-progress stroke must be canceled immediately without saving to history
    expect(mockCancelStroke).toHaveBeenCalledTimes(1);
    expect(mockFinishStroke).not.toHaveBeenCalled();

    // Subsequent finger movements must NOT draw a line connecting finger 1 and finger 2
    fireEvent.pointerMove(plane, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 310,
      clientY: 310,
    });
    // No points connecting (120, 120) to (310, 310)
    expect(mockAppendPoint).toHaveBeenCalledTimes(1); // Only the previous one before finger 2
    expect(mockSetTransform).toHaveBeenCalled();
  });

  it('stylus (pointerType: pen) starts stroke immediately without 40ms delay', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    fireEvent.pointerDown(plane, {
      pointerId: 10,
      pointerType: 'pen',
      clientX: 150,
      clientY: 150,
      isPrimary: true,
      button: 0,
    });

    // Stylus should start immediately for zero latency
    expect(mockStartStroke).toHaveBeenCalledTimes(1);
    expect(mockStartStroke).toHaveBeenCalledWith(
      { x: 150, y: 150 },
      '#2563eb',
      3.5,
      false
    );
  });

  it('when isFingerDrawingEnabled is false, touch only pans canvas while pen draws', () => {
    mockIsFingerDrawingEnabled = false;
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    // Touch down with finger
    fireEvent.pointerDown(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
      isPrimary: true,
      button: 0,
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should NOT draw
    expect(mockStartStroke).not.toHaveBeenCalled();

    // Moving finger should pan canvas
    fireEvent.pointerMove(plane, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 130,
      clientY: 140,
    });
    expect(mockPanBy).toHaveBeenCalledWith(30, 40);
  });

  it('pointercancel cleans up active pointers and cancels any active stroke', () => {
    const { container } = render(<DeskDrawingInteractionLayer />);
    const plane = container.querySelector('div.fixed.inset-0')!;

    // Start drawing with pen
    fireEvent.pointerDown(plane, {
      pointerId: 5,
      pointerType: 'pen',
      clientX: 50,
      clientY: 50,
      isPrimary: true,
      button: 0,
    });
    expect(mockStartStroke).toHaveBeenCalled();

    // Browser fires pointercancel (e.g. system gesture)
    fireEvent.pointerCancel(plane, {
      pointerId: 5,
      pointerType: 'pen',
    });

    expect(mockCancelStroke).toHaveBeenCalledTimes(1);
    expect(mockFinishStroke).not.toHaveBeenCalled();
  });
});
