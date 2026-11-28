export const VALID_ITEM_TYPES = [
  'paper',
  'book',
  'exam_sheet',
  'sticky_note',
  'roadmap',
  'code_block',
  'mind_map',
  'sticker',
  'spreadsheet',
  'presentation',
  'voice_note',
] as const;

export type McpItemType = (typeof VALID_ITEM_TYPES)[number];

export const SUPPORTED_PROTOCOL_VERSIONS = [
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

export function negotiateProtocolVersion(requested: unknown): string {
  if (
    typeof requested === 'string' &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return '2025-03-26';
}

export function clampInt(
  raw: unknown,
  defaultVal: number,
  min: number,
  max: number,
  fieldName = 'value'
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: defaultVal };
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw) || !Number.isInteger(raw)) {
    return { ok: false, error: `Tham số ${fieldName} phải là số nguyên hợp lệ.` };
  }
  if (raw < min || raw > max) {
    return {
      ok: false,
      error: `Tham số ${fieldName} phải nằm trong khoảng ${min}–${max}.`,
    };
  }
  return { ok: true, value: raw };
}

export function validateItemTypes(
  raw: unknown
): { ok: true; types?: McpItemType[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, types: undefined };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Tham số item_types phải là mảng chuỗi.' };
  }
  const result: McpItemType[] = [];
  for (const entry of raw) {
    if (
      typeof entry !== 'string' ||
      !(VALID_ITEM_TYPES as readonly string[]).includes(entry)
    ) {
      return {
        ok: false,
        error: `Loại vật thể không hợp lệ: ${String(entry)}.`,
      };
    }
    if (!result.includes(entry as McpItemType)) {
      result.push(entry as McpItemType);
    }
  }
  return { ok: true, types: result.length > 0 ? result : undefined };
}

export function truncateText(
  text: string,
  maxChars: number
): { text: string; truncated: boolean } {
  if (maxChars <= 0) {
    return { text: '', truncated: text.length > 0 };
  }
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }
  const suffix = '... [đã cắt bớt]';
  const sliceLen = Math.max(0, maxChars - suffix.length);
  return {
    text: text.slice(0, sliceLen) + (maxChars >= suffix.length ? suffix : ''),
    truncated: true,
  };
}

export interface DeskDocumentRowLike {
  id: string;
  space_id: string;
  title: string;
  item_type: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  z_index: number;
  page_count: number;
  current_page_index: number;
  is_binder?: boolean | null;
  color_theme?: string | null;
  cover_color?: string | null;
  sticky_text?: string | null;
  sticky_color?: string | null;
  text_align?: string | null;
  is_bold?: boolean | null;
  is_exam_sheet?: boolean | null;
  exam_data?: unknown;
  source_documents?: unknown;
  width?: number | null;
  height?: number | null;
}

export interface DocumentPageRowLike {
  id?: string;
  document_id?: string;
  page_number: number;
  title?: string | null;
  content: string;
}

/**
 * Ánh xạ một hàng trong `desk_documents` (+ `document_pages`) sang đối tượng JSON trả về cho MCP.
 * Đồng bộ ánh xạ cột với `rowToDeskItem` trong `src/services/StudySpaceService.ts` (L55-L89).
 */
export function mapRowToMcpDeskItem(
  row: DeskDocumentRowLike,
  pages: DocumentPageRowLike[] = [],
  options: { includeText?: boolean; maxCharsPerItem?: number } = {}
): Record<string, unknown> {
  const includeText = options.includeText ?? true;
  const maxChars = options.maxCharsPerItem ?? 1500;
  let itemTruncated = false;

  const base: Record<string, unknown> = {
    id: row.id,
    type: row.item_type,
    title: row.title,
    x: row.x,
    y: row.y,
    rotation: row.rotation,
    scale: row.scale,
    zIndex: row.z_index,
    width: row.width ?? null,
    height: row.height ?? null,
    pageCount: row.page_count,
    currentPageIndex: row.current_page_index,
  };

  if (row.item_type === 'sticky_note') {
    if (row.sticky_text) {
      const cut = truncateText(row.sticky_text, maxChars);
      base.stickyText = cut.text;
      if (cut.truncated) itemTruncated = true;
    }
    if (row.sticky_color) base.stickyColor = row.sticky_color;
    if (row.text_align) base.textAlign = row.text_align;
    if (row.is_bold !== undefined && row.is_bold !== null) base.isBold = row.is_bold;
  } else if (row.item_type === 'code_block') {
    base.codeLanguage = row.color_theme || 'javascript';
    if (row.sticky_text) {
      const cut = truncateText(row.sticky_text, maxChars);
      base.codeSnippet = cut.text;
      if (cut.truncated) itemTruncated = true;
    }
  } else if (row.item_type === 'mind_map') {
    if (row.sticky_color) base.mindMapColor = row.sticky_color;
    const src = row.source_documents as Record<string, unknown> | null | undefined;
    if (src && typeof src === 'object' && typeof src.parentId === 'string') {
      base.mindMapParentId = src.parentId;
    }
  } else if (row.item_type === 'sticker' && row.exam_data) {
    base.stickerData = row.exam_data;
  } else if (row.item_type === 'spreadsheet' && row.exam_data) {
    base.spreadsheetData = row.exam_data;
  } else if (row.item_type === 'presentation' && row.exam_data) {
    base.presentationData = row.exam_data;
  } else if (row.item_type === 'voice_note' && row.exam_data) {
    const vn = row.exam_data as Record<string, unknown>;
    const sanitizedVoice: Record<string, unknown> = { ...vn };
    // Không trả audioBlob base64 quá lớn qua MCP văn bản
    if (typeof sanitizedVoice.audioBlob === 'string') {
      delete sanitizedVoice.audioBlob;
      sanitizedVoice.hasAudioBlob = true;
    }
    if (typeof sanitizedVoice.transcript === 'string') {
      const cut = truncateText(sanitizedVoice.transcript, maxChars);
      sanitizedVoice.transcript = cut.text;
      if (cut.truncated) itemTruncated = true;
    }
    base.voiceNoteData = sanitizedVoice;
  } else if (row.item_type === 'exam_sheet') {
    base.isExamSheet = row.is_exam_sheet ?? true;
    if (row.exam_data) {
      base.examData = row.exam_data;
    }
  } else {
    // book, paper, roadmap
    if (row.cover_color) base.coverColor = row.cover_color;
    if (row.color_theme) base.colorTheme = row.color_theme;
    if (row.is_binder) base.isBinder = row.is_binder;
    if (row.source_documents) base.sourceDocuments = row.source_documents;
  }

  if (includeText && pages.length > 0) {
    let remainingChars = maxChars;
    const mappedPages: Array<Record<string, unknown>> = [];

    for (const p of pages) {
      if (remainingChars <= 0) {
        itemTruncated = true;
        break;
      }
      const cut = truncateText(p.content || '', remainingChars);
      remainingChars -= cut.text.length;
      if (cut.truncated) itemTruncated = true;

      mappedPages.push({
        pageNumber: p.page_number,
        title: p.title ?? undefined,
        content: cut.text,
      });
    }
    base.pages = mappedPages;
  }

  if (itemTruncated) {
    base.truncated = true;
  }

  return base;
}

export function enforceDeskPayloadBudget<T>(
  items: T[],
  maxItems = 300,
  maxBytes = 150 * 1024
): { items: T[]; truncated: boolean } {
  const encoder = new TextEncoder();
  const result: T[] = [];
  let truncated = false;
  let totalBytes = 2; // '[]'

  for (let i = 0; i < items.length; i++) {
    if (result.length >= maxItems) {
      truncated = true;
      break;
    }
    const serialized = JSON.stringify(items[i]);
    const itemBytes = encoder.encode(serialized).length + (result.length > 0 ? 1 : 0);
    if (totalBytes + itemBytes > maxBytes) {
      truncated = true;
      break;
    }
    result.push(items[i]);
    totalBytes += itemBytes;
  }

  return { items: result, truncated };
}
