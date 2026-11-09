-- ==============================================================================
-- Migration 0002: Desk Items Alignment & Schema Consolidation
-- Spec: Plan 02a Task A.3 / REVIEW-2026-11-08
-- ==============================================================================

BEGIN;

-- 1. Expand item_type in desk_documents
ALTER TABLE public.desk_documents
    DROP CONSTRAINT IF EXISTS desk_documents_item_type_check;

ALTER TABLE public.desk_documents
    ADD CONSTRAINT desk_documents_item_type_check
    CHECK (item_type IN ('paper', 'book', 'exam_sheet', 'sticky_note', 'roadmap'));

-- 2. Add Missing DeskItem Properties to desk_documents
ALTER TABLE public.desk_documents
    ADD COLUMN IF NOT EXISTS color_theme TEXT,
    ADD COLUMN IF NOT EXISTS cover_color TEXT,
    ADD COLUMN IF NOT EXISTS sticky_text TEXT,
    ADD COLUMN IF NOT EXISTS sticky_color TEXT,
    ADD COLUMN IF NOT EXISTS text_align TEXT CHECK (text_align IN ('left', 'center', 'right')),
    ADD COLUMN IF NOT EXISTS is_bold BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_exam_sheet BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS exam_data JSONB,
    ADD COLUMN IF NOT EXISTS source_documents JSONB,
    ADD COLUMN IF NOT EXISTS width DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Create Trigger for updated_at on desk_documents
CREATE OR REPLACE FUNCTION public.handle_desk_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_desk_documents_updated ON public.desk_documents;
CREATE TRIGGER on_desk_documents_updated
    BEFORE UPDATE ON public.desk_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_desk_documents_updated_at();

-- 4. Align desk_drawings (Attached Ink to Document)
ALTER TABLE public.desk_drawings
    ADD COLUMN IF NOT EXISTS attached_to_item_id UUID 
    REFERENCES public.desk_documents(id) ON DELETE CASCADE;

-- 5. Align inteline_threads (Target is a DeskItem, Add Offset)
ALTER TABLE public.inteline_threads
    ADD COLUMN IF NOT EXISTS source_offset JSONB;

-- Drop old foreign key to desk_sticky_notes if exists, redirect to desk_documents
ALTER TABLE public.inteline_threads
    DROP CONSTRAINT IF EXISTS inteline_threads_target_sticky_id_fkey;

ALTER TABLE public.inteline_threads
    ADD CONSTRAINT inteline_threads_target_sticky_id_fkey
    FOREIGN KEY (target_sticky_id) REFERENCES public.desk_documents(id) ON DELETE CASCADE;

-- 6. Deprecate desk_sticky_notes table gracefully
COMMENT ON TABLE public.desk_sticky_notes IS 'DEPRECATED: All desk entities including sticky notes are now consolidated into public.desk_documents';

COMMIT;
