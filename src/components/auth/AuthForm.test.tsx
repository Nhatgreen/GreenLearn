import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  it('calls onSignIn with email and password when in login mode', () => {
    const mockSignIn = vi.fn().mockResolvedValue({ success: true });
    render(<AuthForm mode="login" onSignIn={mockSignIn} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@vitudy.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(mockSignIn).toHaveBeenCalledWith('user@vitudy.com', '123456');
  });

  it('renders display name field and calls onSignUp when in signup mode', () => {
    const mockSignUp = vi.fn().mockResolvedValue({ success: true });
    render(<AuthForm mode="signup" onSignUp={mockSignUp} />);

    expect(screen.getByLabelText('Họ và tên')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@vitudy.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(mockSignUp).toHaveBeenCalledWith('user@vitudy.com', '123456', 'Nguyễn Văn A');
  });
});
