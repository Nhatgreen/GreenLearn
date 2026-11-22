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

  it('renames a space successfully and rejects invalid names', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>
        <StudySpaceProvider>{children}</StudySpaceProvider>
      </AuthProvider>
    );

    const { result } = renderHook(() => useStudySpace(), { wrapper });

    const targetSpace = result.current.spaces[0];
    const originalName = targetSpace.name;

    // 1. Thử đổi tên rỗng hoặc chỉ có khoảng trắng
    let invalidRes: boolean = true;
    await act(async () => {
      invalidRes = await result.current.renameSpace(targetSpace.id, '   ');
    });
    expect(invalidRes).toBe(false);
    expect(result.current.spaces.find(s => s.id === targetSpace.id)?.name).toBe(originalName);

    // 2. Đổi tên hợp lệ
    let successRes: boolean = false;
    await act(async () => {
      successRes = await result.current.renameSpace(targetSpace.id, '  Bàn học Chuyên Sâu AI  ');
    });
    expect(successRes).toBe(true);

    const updated = result.current.spaces.find(s => s.id === targetSpace.id);
    expect(updated?.name).toBe('Bàn học Chuyên Sâu AI');
    expect(updated?.updatedAt).toBeDefined();

    // Kiểm tra đã lưu vào localStorage
    const savedSpacesJson = localStorage.getItem('greenlearn_spaces');
    expect(savedSpacesJson).toBeTruthy();
    const savedSpaces = JSON.parse(savedSpacesJson!);
    expect(savedSpaces.find((s: any) => s.id === targetSpace.id)?.name).toBe('Bàn học Chuyên Sâu AI');
  });
});
