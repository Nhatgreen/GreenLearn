import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceNoteItem } from './VoiceNoteItem';
import { DeskItem } from '@/types/studyspace';

const mockSelectItem = vi.fn();
const mockRemoveDeskItem = vi.fn();
const mockAddStickyNote = vi.fn();
const mockUpdateVoiceNoteTranscript = vi.fn();

vi.mock('@/context/StudySpaceContext', () => ({
  useStudySpace: () => ({
    selectItem: mockSelectItem,
    removeDeskItem: mockRemoveDeskItem,
    addStickyNote: mockAddStickyNote,
    updateVoiceNoteTranscript: mockUpdateVoiceNoteTranscript,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    updateItemPosition: vi.fn(),
    setItemRotation: vi.fn(),
    bringToFront: vi.fn(),
  }),
}));

describe('VoiceNoteItem Component', () => {
  const dummyItem: DeskItem = {
    id: 'voice-1',
    type: 'voice_note',
    title: 'Note ghi âm',
    x: 100,
    y: 150,
    rotation: 0,
    scale: 1,
    zIndex: 10,
    pageCount: 1,
    currentPageIndex: 0,
    pages: [],
    width: 340,
    height: 76,
    voiceNoteData: {
      duration: 12,
      waveform: [20, 40, 60, 80, 50, 30, 70, 90],
      transcript: 'Xin chào, đây là đoạn ghi âm bài giảng môn Giải tích.',
      authorName: 'Nhật',
      authorColor: '#16A34A',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders avatar and audio bubble with correct creator initial and timer', () => {
    render(<VoiceNoteItem item={dummyItem} isSelected={false} />);

    // Creator Avatar initial
    expect(screen.getByText('N')).toBeInTheDocument();

    // Timer formatted MM:SS for 12 seconds: 00:12
    expect(screen.getByText('00:12')).toBeInTheDocument();
  });

  it('toggles transcript card when speech-to-text button is clicked', () => {
    render(<VoiceNoteItem item={dummyItem} isSelected={false} />);

    // Speech-to-text button title
    const transcriptBtn = screen.getByTitle('Chuyển đổi giọng nói thành văn bản (Speech-to-Text)');
    expect(transcriptBtn).toBeInTheDocument();

    // Initially transcript card is closed
    expect(screen.queryByText('Văn bản giọng nói')).not.toBeInTheDocument();

    // Click transcript button
    fireEvent.click(transcriptBtn);

    // Now transcript card appears with text
    expect(screen.getByText('Văn bản giọng nói')).toBeInTheDocument();
    expect(screen.getByText('Xin chào, đây là đoạn ghi âm bài giảng môn Giải tích.')).toBeInTheDocument();
  });

  it('allows converting transcript to a sticky note on the desk', () => {
    render(<VoiceNoteItem item={dummyItem} isSelected={false} />);

    // Open transcript
    const transcriptBtn = screen.getByTitle('Chuyển đổi giọng nói thành văn bản (Speech-to-Text)');
    fireEvent.click(transcriptBtn);

    // Click "Tạo Note" button
    const createNoteBtn = screen.getByTitle('Tạo Note dán giấy trên bàn học từ văn bản này');
    fireEvent.click(createNoteBtn);

    expect(mockAddStickyNote).toHaveBeenCalledTimes(1);
    expect(mockAddStickyNote).toHaveBeenCalledWith(
      expect.stringContaining('Xin chào, đây là đoạn ghi âm bài giảng môn Giải tích.'),
      dummyItem.x + 360,
      dummyItem.y,
      '#fef08a',
      240,
      180
    );
  });

  it('handles 2-step confirmation when deleting voice note', () => {
    render(<VoiceNoteItem item={dummyItem} isSelected={true} />);

    // First click: prompts "Xác nhận?"
    const deleteBtn = screen.getByTitle('Xóa ghi chú âm thanh');
    fireEvent.click(deleteBtn);
    expect(screen.getByText('Xác nhận?')).toBeInTheDocument();
    expect(mockRemoveDeskItem).not.toHaveBeenCalled();

    // Second click: removes desk item
    const confirmBtn = screen.getByTitle('Bấm lần nữa để xác nhận xóa vĩnh viễn');
    fireEvent.click(confirmBtn);
    expect(mockRemoveDeskItem).toHaveBeenCalledWith('voice-1');
  });

  it('toggles play state when play/pause button is clicked', () => {
    render(<VoiceNoteItem item={dummyItem} isSelected={false} />);

    const playBtn = screen.getByTitle('Phát ghi âm');
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    // Audio plays or simulates playback
  });

  it('correctly resolves and plays audio from remote peer synced audioBlob base64', () => {
    // Mock URL.createObjectURL and revokeObjectURL
    const originalCreate = window.URL.createObjectURL;
    const originalRevoke = window.URL.revokeObjectURL;
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-peer-blob-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Dummy base64 WAV data (small valid data URI)
    const remotePeerItem: DeskItem = {
      ...dummyItem,
      id: 'voice-remote-peer',
      voiceNoteData: {
        duration: 8,
        waveform: [30, 50, 70, 40],
        transcript: 'Đoạn ghi âm từ bạn cùng phòng.',
        authorName: 'Linh',
        authorColor: '#0068FF',
        // Peer has an unresolvable creator blob URL AND a valid audioBlob base64
        audioUrl: 'blob:http://localhost:3000/remote-unreachable-blob',
        audioBlob: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      },
    };

    const { unmount } = render(<VoiceNoteItem item={remotePeerItem} isSelected={false} />);

    // Should create a local blob URL from the peer's audioBlob base64
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // Clean up
    unmount();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-peer-blob-url');

    window.URL.createObjectURL = originalCreate;
    window.URL.revokeObjectURL = originalRevoke;
  });
});
