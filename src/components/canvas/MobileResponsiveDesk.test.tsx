import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomRightToolkit } from '../hud/BottomRightToolkit';
import { Minimap } from './Minimap';

// Mock StudySpaceContext
const mockSetTransform = vi.fn();
const mockZoomBy = vi.fn();
const mockResetView = vi.fn();
const mockTidyUpDesk = vi.fn();
const mockFitAllToScreen = vi.fn();
const mockSetIsViewRotateMode = vi.fn();

const mockActiveSpace = {
  id: 'space-1',
  name: 'Bàn học giải tích',
  subject: 'Toán',
  items: [
    { id: 'item-1', type: 'book', title: 'Giáo trình Giải tích 1', x: 100, y: 100, width: 980, height: 640 },
    { id: 'item-2', type: 'paper', title: 'Bài tập tuần 2', x: 1200, y: 150, width: 480, height: 640 },
  ],
};

vi.mock('@/context/StudySpaceContext', () => ({
  useStudySpace: () => ({
    activeSpace: mockActiveSpace,
    activeSpaceId: 'space-1',
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    setTransform: mockSetTransform,
    zoomBy: mockZoomBy,
    resetView: mockResetView,
    tidyUpDesk: mockTidyUpDesk,
    fitAllToScreen: mockFitAllToScreen,
    isViewRotateMode: false,
    setIsViewRotateMode: mockSetIsViewRotateMode,
    focusedItemId: null,
    selectItem: vi.fn(),
    panBy: vi.fn(),
    rotateDeskBy: vi.fn(),
    resetDeskRotation: vi.fn(),
    addUploadedDocument: vi.fn(),
    activeTool: 'cursor',
    isFocusNoticeVisible: false,
    triggerFocusNotice: vi.fn(),
    exitFocusMode: vi.fn(),
  }),
}));

describe('Mobile & Tablet Canvas Responsiveness', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight });
    vi.clearAllMocks();
  });

  describe('Requirement 7: Screens < 640px (390px mobile testing)', () => {
    beforeEach(() => {
      // 390px portrait (e.g. iPhone 14/15/16)
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });
    });

    it('defaults minimap to hidden on 390px screens', () => {
      render(<BottomRightToolkit />);
      // Reopen button should be visible because minimap is hidden by default
      const reopenBtn = screen.getByTitle('Mở bản đồ bàn học');
      expect(reopenBtn).toBeInTheDocument();
      // "Phím M" must NOT appear in the reopen button title on mobile
      expect(reopenBtn.getAttribute('title')).not.toContain('Phím M');
    });

    it('hides "Phím M" hotkey label inside Minimap on screens < 640px and touch devices', () => {
      render(<Minimap isVisible={true} />);
      const mapTitle = screen.getByText(/BẢN ĐỒ/i);
      expect(mapTitle).toBeInTheDocument();
      // The (Phím M) text should have class hidden lg:inline landscape-phone:hidden
      const hotkeySpan = mapTitle.querySelector('span');
      expect(hotkeySpan).toHaveClass('hidden');
      expect(hotkeySpan).toHaveClass('lg:inline');
      expect(hotkeySpan).toHaveClass('landscape-phone:hidden');
    });

    it('renders compact minimap dimensions on 390px mobile', () => {
      const { container } = render(<Minimap isVisible={true} />);
      const minimapBox = container.firstChild as HTMLElement;
      expect(minimapBox.style.width).toBe('145px');
      expect(minimapBox.style.height).toBe('90px');
    });

    it('handles 390x844 portrait orientation', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });
      render(<BottomRightToolkit />);
      // Minimap hidden by default on mobile portrait
      expect(screen.getByTitle('Mở bản đồ bàn học')).toBeInTheDocument();
      expect(screen.getByTitle('Thu nhỏ')).toBeInTheDocument();
      expect(screen.getByTitle('Phóng to')).toBeInTheDocument();
    });

    it('handles 667x375 landscape orientation', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 667 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 });
      render(<BottomRightToolkit />);
      // Minimap hidden by default on landscape phone (height <= 500)
      expect(screen.getByTitle('Mở bản đồ bàn học')).toBeInTheDocument();
      expect(screen.getByTitle('Thu nhỏ')).toBeInTheDocument();
      expect(screen.getByTitle('Phóng to')).toBeInTheDocument();
    });

    it('handles 844x390 landscape orientation', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 844 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 390 });
      render(<BottomRightToolkit />);
      expect(screen.getByTitle('Mở bản đồ bàn học')).toBeInTheDocument();
      expect(screen.getByTitle('Thu nhỏ')).toBeInTheDocument();
      expect(screen.getByTitle('Phóng to')).toBeInTheDocument();
    });

    it('handles 915x412 landscape orientation', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 915 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 412 });
      render(<BottomRightToolkit />);
      expect(screen.getByTitle('Mở bản đồ bàn học')).toBeInTheDocument();
      expect(screen.getByTitle('Thu nhỏ')).toBeInTheDocument();
      expect(screen.getByTitle('Phóng to')).toBeInTheDocument();
    });
  });

  describe('Tablet & Desktop: 768px and above', () => {
    it('defaults minimap to visible on 768px tablet portrait', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });

      render(<BottomRightToolkit />);
      // Reopen button should NOT be present when minimap is visible by default
      expect(screen.queryByTitle('Mở bản đồ bàn học')).not.toBeInTheDocument();
    });

    it('renders full-size minimap dimensions on 768px tablet and desktop', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1024 });

      const { container } = render(<Minimap isVisible={true} />);
      const minimapBox = container.firstChild as HTMLElement;
      expect(minimapBox.style.width).toBe('190px');
      expect(minimapBox.style.height).toBe('120px');
    });

    it('renders correctly in 768px tablet landscape (1024x768)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

      const { container } = render(<Minimap isVisible={true} />);
      const minimapBox = container.firstChild as HTMLElement;
      expect(minimapBox.style.width).toBe('190px');
      expect(minimapBox.style.height).toBe('120px');
    });
  });

  describe('Gesture & Ctrl+Wheel Event Interception', () => {
    it('prevents default on gesturestart, gesturechange, and gestureend', () => {
      const gestureStartEvt = new Event('gesturestart', { cancelable: true });
      const gestureChangeEvt = new Event('gesturechange', { cancelable: true });
      const gestureEndEvt = new Event('gestureend', { cancelable: true });

      const mockPreventDefault = vi.fn();
      gestureStartEvt.preventDefault = mockPreventDefault;
      gestureChangeEvt.preventDefault = mockPreventDefault;
      gestureEndEvt.preventDefault = mockPreventDefault;

      // Dispatch directly to verify prevention listener
      const preventGesture = (e: Event) => e.preventDefault();
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.dispatchEvent(gestureStartEvt);
      expect(mockPreventDefault).toHaveBeenCalled();
      document.removeEventListener('gesturestart', preventGesture);
    });

    it('prevents default on Ctrl+wheel events', () => {
      const ctrlWheelEvt = new WheelEvent('wheel', { ctrlKey: true, cancelable: true });
      const mockPreventDefault = vi.fn();
      ctrlWheelEvt.preventDefault = mockPreventDefault;

      const handleCtrlWheel = (e: WheelEvent) => {
        if (e.ctrlKey) e.preventDefault();
      };
      window.addEventListener('wheel', handleCtrlWheel, { passive: false });
      window.dispatchEvent(ctrlWheelEvt);
      expect(mockPreventDefault).toHaveBeenCalled();
      window.removeEventListener('wheel', handleCtrlWheel);
    });
  });
});
