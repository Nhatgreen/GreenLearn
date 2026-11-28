ALTER TABLE public.desk_documents
  DROP CONSTRAINT IF EXISTS desk_documents_item_type_check;
ALTER TABLE public.desk_documents
  ADD CONSTRAINT desk_documents_item_type_check
  CHECK (item_type IN (
    'paper','book','exam_sheet','sticky_note','roadmap',
    'code_block','mind_map','sticker','spreadsheet','presentation','voice_note'
  ));
