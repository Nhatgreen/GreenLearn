import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HomePage } from './HomePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockDeleteSpaces = vi.fn().mockResolvedValue(true);
const mockSwitchSpace = vi.fn();
const mockCreateSpaceFromTemplate = vi.fn();

const sampleSpaces = [
  {
    id: 'space-1',
    name: 'Bàn học Giải tích 1',
    description: 'Ôn tập chương 1 và 2',
    items: [],
    createdAt: Date.now(),
  },
  {
    id: 'space-2',
    name: 'Bàn học Vật lý đại cương',
    description: 'Thực hành thí nghiệm',
    items: [],
    createdAt: Date.now(),
  },
];

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com' },
    profile: { display_name: 'Nhật' },
    status: 'authenticated',
  }),
}));

vi.mock('@/context/StudySpaceContext', () => ({
  useStudySpace: () => ({
    spaces: sampleSpaces,
    activeSpaceId: 'space-1',
    switchSpace: mockSwitchSpace,
    createSpaceFromTemplate: mockCreateSpaceFromTemplate,
    deleteSpaces: mockDeleteSpaces,
  }),
}));

vi.mock('@/hooks/usePetMascot', () => ({
  usePetMascot: () => ({
    pet: { name: 'Mầm Xanh', streak: 3 },
    info: {},
    currentImageUrl: '/pet.png',
    isClaimedToday: true,
    claimToday: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSocialPresence', () => ({
  useSocialPresence: () => ({
    currentUser: { id: 'u1', name: 'Nhật' },
    buddies: [],
    onlineCount: 0,
    inDeskCount: 0,
    addFriend: vi.fn(),
    removeFriend: vi.fn(),
    sendDeskInvite: vi.fn(),
    requestJoinRoom: vi.fn(),
  }),
}));

vi.mock('@/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

vi.mock('@/components/pet/PetMascotModal', () => ({
  PetMascotModal: () => null,
}));

describe('HomePage Bulk Space Selection & Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows entering selection mode and selecting multiple spaces', async () => {
    render(<HomePage onEnterDesk={vi.fn()} />);

    // Chuyển sang tab Bàn học của tôi
    const deskNavButtons = screen.getAllByRole('button', { name: /Bàn học/i });
    fireEvent.click(deskNavButtons[0]);

    // Tìm nút "Chọn nhiều"
    const selectModeBtn = screen.getByRole('button', { name: /Chọn nhiều/i });
    expect(selectModeBtn).toBeDefined();

    // Bật chế độ chọn nhiều
    fireEvent.click(selectModeBtn);

    // Xuất hiện thanh Bulk Action Toolbar
    expect(screen.getAllByText(/Đã chọn/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Chọn tất cả/i)).toBeDefined();

    // Click chọn tất cả
    const selectAllBtn = screen.getAllByRole('button', { name: /Chọn tất cả/i })[0];
    fireEvent.click(selectAllBtn);

    // Đã chọn 2 bàn học
    expect(screen.getByText(/Xóa đã chọn \(2\)/i)).toBeDefined();

    // Bấm nút Xóa đã chọn (2) để mở modal xác nhận
    const deleteBtn = screen.getByRole('button', { name: /Xóa đã chọn \(2\)/i });
    fireEvent.click(deleteBtn);

    // Xuất hiện modal xác nhận xóa
    expect(screen.getByText(/Xác nhận xóa 2 bàn học\?/i)).toBeDefined();

    // Bấm "Xác nhận xóa vĩnh viễn"
    const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa vĩnh viễn/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(mockDeleteSpaces).toHaveBeenCalledWith(['space-1', 'space-2']);
    });
  });

  it('allows single space deletion via trash button', async () => {
    render(<HomePage onEnterDesk={vi.fn()} />);

    // Chuyển sang tab Bàn học của tôi
    const deskNavButtons = screen.getAllByRole('button', { name: /Bàn học/i });
    fireEvent.click(deskNavButtons[0]);

    // Tìm các nút icon xóa đơn lẻ
    const trashButtons = screen.getAllByTitle(/Xóa bàn học/i);
    expect(trashButtons.length).toBeGreaterThan(0);

    // Click nút xóa của bàn học đầu tiên
    fireEvent.click(trashButtons[0]);

    // Xuất hiện modal xác nhận xóa 1 bàn
    expect(screen.getByText(/Xác nhận xóa 1 bàn học\?/i)).toBeDefined();

    // Bấm hủy bỏ
    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    fireEvent.click(cancelBtn);

    // Modal đóng
    expect(screen.queryByText(/Xác nhận xóa 1 bàn học\?/i)).toBeNull();
    expect(mockDeleteSpaces).not.toHaveBeenCalled();
  });

  it('renders real space summary and relative time without hardcoded mock strings', () => {
    render(<HomePage onEnterDesk={vi.fn()} />);

    // Không còn bất kỳ chuỗi mock nào như "14:20 hôm nay"
    expect(screen.queryByText('14:20 hôm nay')).toBeNull();
    expect(screen.queryByText('Hôm qua 21:15')).toBeNull();

    // Đối với bàn học rỗng, hiển thị "Bàn học trống · Chưa có tài liệu"
    const emptySummaries = screen.getAllByText(/Bàn học trống · Chưa có tài liệu/i);
    expect(emptySummaries.length).toBeGreaterThan(0);
  });
});
