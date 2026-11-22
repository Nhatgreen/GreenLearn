import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StudySpaceProvider, useStudySpace } from './StudySpaceContext';
import { AuthProvider } from './AuthContext';

describe('StudySpaceContext - Viewer Role Guard', () => {
  it('provides isViewerSession and defaults to false for local solo sessions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <StudySpaceProvider>{children}</StudySpaceProvider>
      </AuthProvider>
    );

    const { result } = renderHook(() => useStudySpace(), { wrapper });

    expect(typeof result.current.isViewerSession).toBe('function');
    expect(result.current.isViewer).toBe(false);
    expect(result.current.isViewerSession()).toBe(false);
  });

  it('provides deleteSpaces function for batch deletion', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <StudySpaceProvider>{children}</StudySpaceProvider>
      </AuthProvider>
    );

    const { result } = renderHook(() => useStudySpace(), { wrapper });

    expect(typeof result.current.deleteSpaces).toBe('function');
  });

  it('sets lastOpenedAt timestamp when creating and switching spaces', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <StudySpaceProvider>{children}</StudySpaceProvider>
      </AuthProvider>
    );

    const { result } = renderHook(() => useStudySpace(), { wrapper });

    // Tạo space mới
    act(() => {
      result.current.createSpace('Bàn học Hóa Học', 'Hóa');
    });

    const created = result.current.spaces.find(s => s.name === 'Bàn học Hóa Học');
    expect(created).toBeDefined();
    expect(created?.lastOpenedAt).toBeDefined();
    expect(typeof created?.lastOpenedAt).toBe('string');

    // Chuyển sang bàn học ban đầu và kiểm tra cập nhật lastOpenedAt
    const firstSpaceId = result.current.spaces[0].id;
    const prevOpenedAt = result.current.spaces[0].lastOpenedAt;

    act(() => {
      result.current.switchSpace(firstSpaceId);
    });

    const switched = result.current.spaces.find(s => s.id === firstSpaceId);
    expect(switched?.lastOpenedAt).toBeDefined();
    expect(result.current.activeSpaceId).toBe(firstSpaceId);
  });
});
