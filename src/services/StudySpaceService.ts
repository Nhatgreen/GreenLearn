import { getSupabase } from '@/lib/supabase';
import { StudySpace, DeskItem, DrawingStroke, IntelineThread, PageContent } from '@/types/studyspace';
import { Database, Json } from '@/types/database.types';

type DeskDocumentRow = Database['public']['Tables']['desk_documents']['Row'];
type DeskDocumentInsert = Database['public']['Tables']['desk_documents']['Insert'];

export function deskItemToRow(item: DeskItem, spaceId: string): DeskDocumentInsert {
  let sourceDocsJson: Json | null = (item.sourceDocuments as unknown as Json) || null;
  if (item.type === 'mind_map' && item.mindMapParentId) {
    sourceDocsJson = { parentId: item.mindMapParentId } as unknown as Json;
  }

  let extraDataJson: Json | null = (item.examData as unknown as Json) || null;
  if (item.type === 'sticker' && item.stickerData) {
    extraDataJson = item.stickerData as unknown as Json;
  }

  return {
    id: item.id,
    space_id: spaceId,
    title: item.title,
    item_type: item.type,
    x: item.x,
    y: item.y,
    rotation: item.rotation,
    scale: item.scale,
    z_index: item.zIndex,
    page_count: item.pageCount,
    current_page_index: item.currentPageIndex,
    is_binder: item.isBinder ?? false,
    color_theme: item.codeLanguage || item.colorTheme || null,
    cover_color: item.coverColor || null,
    sticky_text: item.codeSnippet || item.stickyText || null,
    sticky_color: item.mindMapColor || item.stickyColor || null,
    text_align: item.textAlign || null,
    is_bold: item.isBold ?? false,
    is_exam_sheet: item.isExamSheet ?? false,
    exam_data: extraDataJson,
    source_documents: sourceDocsJson,
    width: item.width || null,
    height: item.height || null,
  };
}

export function rowToDeskItem(row: DeskDocumentRow, pages: PageContent[] = []): DeskItem {
  return {
    id: row.id,
    type: row.item_type,
    title: row.title,
    x: row.x,
    y: row.y,
    rotation: row.rotation,
    scale: row.scale,
    zIndex: row.z_index,
    pageCount: row.page_count,
    currentPageIndex: row.current_page_index,
    pages,
    colorTheme: row.color_theme || undefined,
    coverColor: row.cover_color || undefined,
    isBinder: row.is_binder,
    stickyText: row.sticky_text || undefined,
    stickyColor: row.sticky_color || undefined,
    textAlign: row.text_align || undefined,
    isBold: row.is_bold,
    isExamSheet: row.is_exam_sheet,
    examData: row.item_type === 'exam_sheet' && row.exam_data ? (row.exam_data as any) : undefined,
    sourceDocuments: row.item_type !== 'mind_map' && row.source_documents ? (row.source_documents as any) : undefined,
    width: row.width || undefined,
    height: row.height || undefined,
    codeSnippet: row.item_type === 'code_block' ? (row.sticky_text || undefined) : undefined,
    codeLanguage: row.item_type === 'code_block' ? (row.color_theme || 'javascript') : undefined,
    mindMapColor: row.item_type === 'mind_map' ? (row.sticky_color || undefined) : undefined,
    mindMapParentId: row.item_type === 'mind_map' && row.source_documents ? (row.source_documents as any)?.parentId : undefined,
    stickerData: row.item_type === 'sticker' && row.exam_data ? (row.exam_data as any) : undefined,
  };
}

export class StudySpaceService {
  static async loadSpaces(userId: string): Promise<StudySpace[]> {
    const supabase = getSupabase();
    if (!supabase || !userId) return [];

    try {
      // 1. Load all study spaces for user
      const { data: spacesData, error: spacesError } = await supabase
        .from('study_spaces')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (spacesError || !spacesData) return [];

      const result: StudySpace[] = [];

      for (const spaceRow of spacesData) {
        // 2. Load documents for this space
        const { data: docsData } = await supabase
          .from('desk_documents')
          .select('*')
          .eq('space_id', spaceRow.id)
          .order('z_index', { ascending: true });

        // 3. Load pages for these documents
        const docIds = (docsData || []).map(d => d.id);
        const pagesByDocId: Record<string, PageContent[]> = {};

        if (docIds.length > 0) {
          const { data: pagesData } = await supabase
            .from('document_pages')
            .select('*')
            .in('document_id', docIds)
            .order('page_number', { ascending: true });

          if (pagesData) {
            for (const p of pagesData) {
              if (!pagesByDocId[p.document_id]) {
                pagesByDocId[p.document_id] = [];
              }
              pagesByDocId[p.document_id].push({
                id: p.id,
                pageNumber: p.page_number,
                title: p.title || undefined,
                text: p.content,
              });
            }
          }
        }

        // Map items
        const items: DeskItem[] = (docsData || []).map(row => 
          rowToDeskItem(row as DeskDocumentRow, pagesByDocId[row.id] || [])
        );

        // 4. Load threads for this space
        const { data: threadsData } = await supabase
          .from('inteline_threads')
          .select('*')
          .eq('space_id', spaceRow.id);

        const threads: IntelineThread[] = (threadsData || []).map(t => ({
          id: t.id,
          sourceItemId: t.source_item_id,
          sourcePageNumber: t.source_page_number,
          selectedText: t.selected_text,
          sourceOffset: t.source_offset ? (t.source_offset as any) : undefined,
          targetStickyId: t.target_sticky_id,
          question: t.question,
          answer: t.answer,
          createdAt: t.created_at,
        }));

        result.push({
          id: spaceRow.id,
          name: spaceRow.name,
          subject: spaceRow.subject,
          description: '',
          createdAt: spaceRow.created_at,
          updatedAt: spaceRow.updated_at,
          items,
          threads,
        });
      }

      return this.purgeEmptySpaces(result);
    } catch (err) {
      console.warn('Lỗi loadSpaces từ Supabase Cloud:', err);
      return [];
    }
  }

  /**
   * Bộ lọc tự động dọn dẹp các không gian học tập rỗng vô danh (purgeEmptySpaces)
   * Loại bỏ các bàn học rác sinh ra trong quá trình khởi tạo/test không có vật thể,
   * không có chủ đề trao đổi, và mang tên mặc định.
   */
  static purgeEmptySpaces(spaces: StudySpace[], activeSpaceId?: string): StudySpace[] {
    if (!spaces || spaces.length <= 1) return spaces || [];

    return spaces.filter(space => {
      // 1. Luôn giữ bàn học đang kích hoạt
      if (activeSpaceId && space.id === activeSpaceId) return true;

      // 2. Nếu bàn học có vật thể hoặc có inteline threads, giữ lại
      const hasItems = space.items && space.items.length > 0;
      const hasThreads = space.threads && space.threads.length > 0;
      if (hasItems || hasThreads) return true;

      // 3. Nếu người dùng đã đặt tên riêng có chủ đích (không phải tên mặc định rác), giữ lại
      const trimmedName = (space.name || '').trim().toLowerCase();
      const isDefaultUnnamed = !trimmedName || 
        trimmedName === 'bàn học chưa đặt tên' || 
        trimmedName === 'bàn học mới' || 
        trimmedName === 'không gian học tập mới' ||
        /^bàn học mới(\s*\(\d+\)|\s*\d+)?$/i.test(trimmedName);

      // Nếu là bàn rỗng vô danh không có nội dung, loại bỏ (purge)
      return !isDefaultUnnamed;
    });
  }

  static async saveSpace(space: StudySpace, userId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !userId) return;

    try {
      await supabase.from('study_spaces').upsert({
        id: space.id,
        owner_id: userId,
        name: space.name,
        subject: space.subject,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Lỗi saveSpace:', err);
    }
  }

  static async deleteSpace(spaceId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !spaceId) return;

    try {
      await supabase.from('study_spaces').delete().eq('id', spaceId);
    } catch (err) {
      console.warn('Lỗi deleteSpace:', err);
    }
  }

  static async upsertItems(spaceId: string, items: DeskItem[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !spaceId || items.length === 0) return;

    try {
      const rows = items.map(item => deskItemToRow(item, spaceId));
      await supabase.from('desk_documents').upsert(rows);

      // Upsert document pages if provided
      for (const item of items) {
        if (item.pages && item.pages.length > 0) {
          const pageRows = item.pages.map(p => ({
            id: p.id.includes('-') && p.id.length === 36 ? p.id : undefined,
            document_id: item.id,
            page_number: p.pageNumber,
            title: p.title || null,
            content: p.text || '',
          }));
          await supabase.from('document_pages').upsert(pageRows, { onConflict: 'document_id,page_number' });
        }
      }
    } catch (err) {
      console.warn('Lỗi upsertItems:', err);
    }
  }

  static async deleteItem(itemId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !itemId) return;

    try {
      await supabase.from('desk_documents').delete().eq('id', itemId);
    } catch (err) {
      console.warn('Lỗi deleteItem:', err);
    }
  }

  static async saveStrokes(spaceId: string, strokes: DrawingStroke[], authorId?: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !spaceId) return;

    try {
      const rows = strokes.map(s => ({
        id: s.id.includes('-') && s.id.length === 36 ? s.id : undefined,
        space_id: spaceId,
        author_id: authorId || null,
        color: s.color,
        width: s.width,
        is_highlighter: s.isHighlighter ?? false,
        points: s.points as unknown as Json,
        attached_to_item_id: s.attachedToItemId || null,
      }));
      await supabase.from('desk_drawings').upsert(rows);
    } catch (err) {
      console.warn('Lỗi saveStrokes:', err);
    }
  }

  static async saveThreads(spaceId: string, threads: IntelineThread[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !spaceId) return;

    try {
      const rows = threads.map(t => ({
        id: t.id.includes('-') && t.id.length === 36 ? t.id : undefined,
        space_id: spaceId,
        source_item_id: t.sourceItemId,
        source_page_number: t.sourcePageNumber,
        selected_text: t.selectedText,
        source_offset: (t.sourceOffset as unknown as Json) || null,
        target_sticky_id: t.targetStickyId,
        question: t.question,
        answer: t.answer,
      }));
      await supabase.from('inteline_threads').upsert(rows);
    } catch (err) {
      console.warn('Lỗi saveThreads:', err);
    }
  }

  static async joinSpace(spaceId: string, userId: string, role: 'viewer' | 'editor' = 'viewer'): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !spaceId || !userId) return;

    try {
      await supabase.from('space_members').upsert({
        space_id: spaceId,
        user_id: userId,
        role: role,
      }, { onConflict: 'space_id,user_id' });
    } catch (err) {
      console.warn('Lỗi joinSpace:', err);
    }
  }
}
