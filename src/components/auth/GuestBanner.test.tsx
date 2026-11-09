import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestBanner } from './GuestBanner';
import { User } from '@supabase/supabase-js';

describe('GuestBanner', () => {
  it('renders banner when user is null', () => {
    render(<GuestBanner user={null} />);
    expect(screen.getByText(/Đăng nhập để lưu/)).toBeInTheDocument();
  });

  it('does not render banner when user is authenticated', () => {
    const mockUser = { id: 'u-123', email: 'test@greenlearn.com' } as User;
    render(<GuestBanner user={mockUser} />);
    expect(screen.queryByText(/Đăng nhập để lưu/)).toBeNull();
  });
});
