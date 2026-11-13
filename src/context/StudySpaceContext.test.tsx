import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
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
});
