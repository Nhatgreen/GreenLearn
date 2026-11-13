import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudySpaceService, deskItemToRow, rowToDeskItem } from './StudySpaceService';
import { DeskItem, StudySpace } from '@/types/studyspace';

describe('StudySpaceService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loadSpaces returns empty array when Supabase is not configured', async () => {
    const result = await StudySpaceService.loadSpaces('user-1');
    expect(result).toEqual([]);
  });

  it('mapper round-trip: converts DeskItem to DB row and back without data loss', () => {
    const sampleItem: DeskItem = {
      id: 'a0000000-0000-0000-0000-000000000001',
      type: 'book',
      title: 'Giáo Trình Trí Tuệ Nhân Tạo',
      x: 350,
      y: 200,
      rotation: 0,
      scale: 1,
      zIndex: 10,
      pageCount: 12,
      currentPageIndex: 2,
      pages: [
        { id: 'p-1', pageNumber: 1, title: 'Chương 1', text: 'Nội dung chương 1' },
      ],
      colorTheme: 'classic',
      coverColor: '#5c3920',
      isBinder: false,
      stickyText: undefined,
      stickyColor: undefined,
      textAlign: 'left',
      isBold: true,
      isExamSheet: false,
      width: 980,
      height: 640,
    };

    const row = deskItemToRow(sampleItem, 'space-123');
    const restored = rowToDeskItem(row as any, sampleItem.pages);

    expect(restored.id).toBe(sampleItem.id);
    expect(restored.type).toBe(sampleItem.type);
    expect(restored.title).toBe(sampleItem.title);
    expect(restored.coverColor).toBe(sampleItem.coverColor);
    expect(restored.width).toBe(sampleItem.width);
    expect(restored.height).toBe(sampleItem.height);
    expect(restored.pages).toEqual(sampleItem.pages);
  });

  it('purgeEmptySpaces removes unnamed empty spaces while preserving active space and filled spaces', () => {
    const spaces: StudySpace[] = [
      {
        id: 'space-active',
        name: 'Bàn học mới',
        subject: '',
        description: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        items: [],
        threads: [],
      },
      {
        id: 'space-filled',
        name: 'Giải tích 1',
        subject: '',
        description: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        items: [
          {
            id: 'item-1',
            type: 'sticky_note',
            title: 'Ghi chú',
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            zIndex: 1,
            pageCount: 1,
            currentPageIndex: 0,
            pages: [],
          },
        ],
        threads: [],
      },
      {
        id: 'space-empty-garbage',
        name: 'Bàn học mới',
        subject: '',
        description: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        items: [],
        threads: [],
      },
      {
        id: 'space-empty-unnamed',
        name: 'Bàn học chưa đặt tên',
        subject: '',
        description: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        items: [],
        threads: [],
      },
      {
        id: 'space-intentional-empty',
        name: 'Đề án Tốt Nghiệp 2026',
        subject: '',
        description: '',
        createdAt: '2026-11-13T00:00:00.000Z',
        updatedAt: '2026-11-13T00:00:00.000Z',
        items: [],
        threads: [],
      },
    ];

    const cleaned = StudySpaceService.purgeEmptySpaces(spaces, 'space-active');
    const cleanedIds = cleaned.map(s => s.id);

    expect(cleanedIds).toContain('space-active'); // active preserved
    expect(cleanedIds).toContain('space-filled'); // has items preserved
    expect(cleanedIds).toContain('space-intentional-empty'); // custom title preserved
    expect(cleanedIds).not.toContain('space-empty-garbage'); // purged!
    expect(cleanedIds).not.toContain('space-empty-unnamed'); // purged!
  });
});
