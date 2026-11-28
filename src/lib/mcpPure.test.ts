import { describe, it, expect } from 'vitest';
import {
  isValidUuid,
  clampInt,
  validateItemTypes,
  truncateText,
  negotiateProtocolVersion,
  mapRowToMcpDeskItem,
  enforceDeskPayloadBudget,
  DeskDocumentRowLike,
} from '../../supabase/functions/mcp/pure';

describe('MCP pure helpers', () => {
  it('validates UUIDs strictly', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid(123)).toBe(false);
  });

  it('clamps and validates integer parameters', () => {
    expect(clampInt(undefined, 1500, 100, 20000, 'max_chars')).toEqual({
      ok: true,
      value: 1500,
    });
    expect(clampInt(500, 1500, 100, 20000, 'max_chars')).toEqual({
      ok: true,
      value: 500,
    });
    expect(clampInt(50, 1500, 100, 20000, 'max_chars').ok).toBe(false);
    expect(clampInt(1.5, 1500, 100, 20000, 'max_chars').ok).toBe(false);
  });

  it('validates item_types array', () => {
    expect(validateItemTypes(['book', 'sticky_note', 'book'])).toEqual({
      ok: true,
      types: ['book', 'sticky_note'],
    });
    expect(validateItemTypes(['invalid_type']).ok).toBe(false);
    expect(validateItemTypes('book').ok).toBe(false);
  });

  it('negotiates supported MCP protocol versions', () => {
    expect(negotiateProtocolVersion('2025-06-18')).toBe('2025-06-18');
    expect(negotiateProtocolVersion('2024-11-05')).toBe('2024-11-05');
    expect(negotiateProtocolVersion('1999-01-01')).toBe('2025-03-26');
  });

  it('truncates long text cleanly', () => {
    const res = truncateText('a'.repeat(100), 30);
    expect(res.truncated).toBe(true);
    expect(res.text.length).toBeLessThanOrEqual(30);
    expect(truncateText('short', 30)).toEqual({ text: 'short', truncated: false });
  });

  it('maps desk_documents columns matching StudySpaceService.rowToDeskItem', () => {
    const baseRow: Omit<DeskDocumentRowLike, 'item_type'> = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      space_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Test Item',
      x: 100,
      y: 200,
      rotation: 5,
      scale: 1,
      z_index: 12,
      page_count: 1,
      current_page_index: 0,
    };

    const codeMapped = mapRowToMcpDeskItem({
      ...baseRow,
      item_type: 'code_block',
      color_theme: 'python',
      sticky_text: 'print("hello")',
    });
    expect(codeMapped.codeLanguage).toBe('python');
    expect(codeMapped.codeSnippet).toBe('print("hello")');

    const mindMapMapped = mapRowToMcpDeskItem({
      ...baseRow,
      item_type: 'mind_map',
      sticky_color: '#16A34A',
      source_documents: { parentId: 'parent-1' },
    });
    expect(mindMapMapped.mindMapColor).toBe('#16A34A');
    expect(mindMapMapped.mindMapParentId).toBe('parent-1');

    const voiceMapped = mapRowToMcpDeskItem({
      ...baseRow,
      item_type: 'voice_note',
      exam_data: {
        duration: 12,
        waveform: [10, 20],
        audioBlob: 'data:audio/webm;base64,AAAA',
        transcript: 'Ghi âm bài giảng',
      },
    });
    expect((voiceMapped.voiceNoteData as any).audioBlob).toBeUndefined();
    expect((voiceMapped.voiceNoteData as any).hasAudioBlob).toBe(true);
    expect((voiceMapped.voiceNoteData as any).transcript).toBe('Ghi âm bài giảng');

    const bookMapped = mapRowToMcpDeskItem(
      { ...baseRow, item_type: 'book', cover_color: '#1e293b' },
      [{ page_number: 1, title: 'Ch1', content: 'Nội dung trang 1 dài hơn giới hạn' }],
      { includeText: true, maxCharsPerItem: 25 }
    );
    expect(bookMapped.coverColor).toBe('#1e293b');
    expect(bookMapped.truncated).toBe(true);
    expect((bookMapped.pages as any[])[0].content.length).toBeLessThanOrEqual(25);
  });

  it('enforces 300-item and 150KB payload budget', () => {
    const items = Array.from({ length: 305 }, (_, i) => ({ id: i, text: 'x'.repeat(100) }));
    const capped = enforceDeskPayloadBudget(items, 300, 150 * 1024);
    expect(capped.items.length).toBe(300);
    expect(capped.truncated).toBe(true);

    const hugeItems = Array.from({ length: 10 }, (_, i) => ({ id: i, text: 'y'.repeat(30000) }));
    const byteCapped = enforceDeskPayloadBudget(hugeItems, 300, 150 * 1024);
    expect(byteCapped.items.length).toBeLessThan(10);
    expect(byteCapped.truncated).toBe(true);
  });
});
