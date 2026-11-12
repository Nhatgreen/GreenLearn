import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DebugOverlay } from './DebugOverlay';

describe('DebugOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as unknown as { location?: unknown }).location;
    window.location = new URL('http://localhost:3000') as unknown as Location;
    window.history.replaceState = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not render when debug query param or localStorage is not set', () => {
    render(<DebugOverlay />);
    expect(screen.queryByText(/DEBUG RESPONSIVE/i)).toBeNull();
  });

  it('renders overlay when ?debug=1 is in URL query parameters', async () => {
    window.location = new URL('http://localhost:3000/?debug=1') as unknown as Location;

    render(<DebugOverlay />);

    expect(await screen.findByText(/DEBUG RESPONSIVE/i)).toBeDefined();
    expect(screen.getByText(/Breakpoint:/i)).toBeDefined();
    expect(screen.getByText(/innerWidth:/i)).toBeDefined();
    expect(localStorage.getItem('greenlearn_debug')).toBe('1');
  });

  it('renders overlay when localStorage flag greenlearn_debug is 1', async () => {
    localStorage.setItem('greenlearn_debug', '1');

    render(<DebugOverlay />);

    expect(await screen.findByText(/DEBUG RESPONSIVE/i)).toBeDefined();
  });

  it('hides overlay and clears storage when close button is clicked', async () => {
    localStorage.setItem('greenlearn_debug', '1');

    render(<DebugOverlay />);

    const closeBtn = await screen.findByTitle(/Tắt Debug Overlay/i);
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText(/DEBUG RESPONSIVE/i)).toBeNull();
    expect(localStorage.getItem('greenlearn_debug')).toBeNull();
  });
});
