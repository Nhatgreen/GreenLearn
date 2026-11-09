-- ==============================================================================
-- ViTudy — Không Gian Học Thức Tích Hợp AI
-- Database Schema & Infrastructure Migration (PostgreSQL + pgvector + Realtime)
-- Spec: SRS ViTudy Section 8
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for semantic search & RAG

-- 2. Users & ViToken Ledger Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    vitoken_balance INT NOT NULL DEFAULT 50 CHECK (vitoken_balance >= 0),
    daily_streak_days INT NOT NULL DEFAULT 1,
    last_claim_date DATE DEFAULT CURRENT_DATE,
    custom_openai_key_encrypted TEXT,
    custom_gemini_key_encrypted TEXT,
    oauth_chatgpt_token JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Study Spaces (Bàn Học 2.5D)
CREATE TABLE IF NOT EXISTS public.study_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Bàn Học Cá Nhân',
    subject TEXT NOT NULL DEFAULT 'Học tập',
    is_public BOOLEAN NOT NULL DEFAULT false,
    camera_transform JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "scale": 1}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Desk Items (Sách, Tờ Giấy trên Bàn Học)
CREATE TABLE IF NOT EXISTS public.desk_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('paper', 'book', 'exam_sheet')),
    x DOUBLE PRECISION NOT NULL DEFAULT 500,
    y DOUBLE PRECISION NOT NULL DEFAULT 300,
    rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
    scale DOUBLE PRECISION NOT NULL DEFAULT 1,
    z_index INT NOT NULL DEFAULT 10,
    page_count INT NOT NULL DEFAULT 1,
    current_page_index INT NOT NULL DEFAULT 0,
    is_binder BOOLEAN NOT NULL DEFAULT false,
    storage_file_path TEXT, -- Supabase Storage DRM Path
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Document Pages with pgvector Embeddings (Inteline Hybrid RAG & Deduplication)
CREATE TABLE IF NOT EXISTS public.document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.desk_documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    embedding vector(1536), -- text-embedding-3-small or Gemini text-embedding-004
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_doc_pages_embedding 
ON public.document_pages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 6. Sticky Notes (Tờ Giấy Ghi Chú)
CREATE TABLE IF NOT EXISTS public.desk_sticky_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#fef08a',
    x DOUBLE PRECISION NOT NULL DEFAULT 500,
    y DOUBLE PRECISION NOT NULL DEFAULT 300,
    rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
    z_index INT NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Freehand Drawing & Highlighter Strokes (Nét Vẽ Bút Dạ Quang)
CREATE TABLE IF NOT EXISTS public.desk_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    color TEXT NOT NULL DEFAULT '#2563eb',
    width INT NOT NULL DEFAULT 3,
    is_highlighter BOOLEAN NOT NULL DEFAULT false,
    points JSONB NOT NULL, -- Array of {x, y}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Inteline Visual Link Threads (Dây Nối Trực Quan)
CREATE TABLE IF NOT EXISTS public.inteline_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
    source_item_id UUID NOT NULL REFERENCES public.desk_documents(id) ON DELETE CASCADE,
    source_page_number INT NOT NULL,
    selected_text TEXT NOT NULL,
    target_sticky_id UUID NOT NULL REFERENCES public.desk_sticky_notes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. KnowInherit Marketplace (Chợ Kế Thừa Tri Thức 85/15)
CREATE TABLE IF NOT EXISTS public.know_inherit_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('C', 'B', 'A', 'S')),
    ai_quality_score INT NOT NULL CHECK (ai_quality_score >= 0 AND ai_quality_score <= 100),
    max_similarity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    price INT NOT NULL CHECK (price IN (5, 15, 30, 50)),
    preview_content TEXT,
    full_content_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchases log with 85/15 revenue split
CREATE TABLE IF NOT EXISTS public.know_inherit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.know_inherit_listings(id),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    total_price INT NOT NULL,
    author_payout INT NOT NULL, -- 85%
    platform_fee INT NOT NULL,   -- 15%
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);

-- 10. ViToken Transaction Ledger
CREATE TABLE IF NOT EXISTS public.vitoken_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- Dương: Nhận / Âm: Chi tiêu
    balance_after INT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('signup_grant', 'daily_streak', 'ai_usage', 'know_inherit_buy', 'know_inherit_earning', 'transfer')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Study Space Members & Role Hierarchy (SRS 6.3 & SRS 8.1)
CREATE TABLE IF NOT EXISTS public.space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(space_id, user_id)
);

-- ==============================================================================
-- 12. Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desk_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desk_sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desk_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inteline_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.know_inherit_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.know_inherit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitoken_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile and edit their own name
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Spaces: Owners can manage spaces; public spaces can be viewed
CREATE POLICY "Users can access their own spaces or public spaces" 
ON public.study_spaces FOR ALL 
USING (auth.uid() = owner_id OR is_public = true);

-- Space Members: View members of accessible spaces, owners can manage members
CREATE POLICY "Users can view members of accessible spaces" 
ON public.space_members FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.study_spaces s WHERE s.id = space_id AND (s.owner_id = auth.uid() OR s.is_public = true)));

CREATE POLICY "Space owners can manage space members" 
ON public.space_members FOR ALL 
USING (EXISTS (SELECT 1 FROM public.study_spaces s WHERE s.id = space_id AND s.owner_id = auth.uid()));

-- Realtime Multiplayer & Collaborative sync policies
CREATE POLICY "Users can manage items in accessible spaces" 
ON public.desk_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM public.study_spaces s WHERE s.id = space_id AND (s.owner_id = auth.uid() OR s.is_public = true)));

CREATE POLICY "Users can manage sticky notes in accessible spaces" 
ON public.desk_sticky_notes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.study_spaces s WHERE s.id = space_id AND (s.owner_id = auth.uid() OR s.is_public = true)));

CREATE POLICY "Users can manage drawings in accessible spaces" 
ON public.desk_drawings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.study_spaces s WHERE s.id = space_id AND (s.owner_id = auth.uid() OR s.is_public = true)));

-- ==============================================================================
-- 12. Stored Procedures & Vector Match Functions
-- ==============================================================================

-- Semantic Similarity Hybrid Search for Inteline Cross-Document RAG
CREATE OR REPLACE FUNCTION match_document_pages (
    query_embedding vector(1536),
    match_threshold DOUBLE PRECISION,
    match_count INT,
    target_space_id UUID
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    page_number INT,
    title TEXT,
    content TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.document_id,
        p.page_number,
        p.title,
        p.content,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM public.document_pages p
    JOIN public.desk_documents d ON d.id = p.document_id
    WHERE d.space_id = target_space_id
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ViToken Atomic Safe Transfer Function
CREATE OR REPLACE FUNCTION process_know_inherit_purchase (
    p_buyer_id UUID,
    p_listing_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_price INT;
    v_seller_id UUID;
    v_buyer_balance INT;
    v_author_cut INT;
    v_platform_cut INT;
BEGIN
    -- Lấy thông tin listing
    SELECT price, author_id INTO v_price, v_seller_id 
    FROM public.know_inherit_listings 
    WHERE id = p_listing_id;

    -- Kiểm tra số dư người mua
    SELECT vitoken_balance INTO v_buyer_balance 
    FROM public.profiles 
    WHERE id = p_buyer_id;

    IF v_buyer_balance < v_price THEN
        RAISE EXCEPTION 'Số dư ViToken không đủ để mở khoá tài liệu!';
    END IF;

    -- Tính toán phân bổ 85/15
    v_author_cut := FLOOR(v_price * 0.85);
    v_platform_cut := v_price - v_author_cut;

    -- Trừ tiền người mua
    UPDATE public.profiles 
    SET vitoken_balance = vitoken_balance - v_price 
    WHERE id = p_buyer_id;

    -- Cộng tiền tác giả (85%)
    UPDATE public.profiles 
    SET vitoken_balance = vitoken_balance + v_author_cut 
    WHERE id = v_seller_id;

    -- Ghi nhận giao dịch
    INSERT INTO public.know_inherit_purchases (listing_id, buyer_id, total_price, author_payout, platform_fee)
    VALUES (p_listing_id, p_buyer_id, v_price, v_author_cut, v_platform_cut);

    INSERT INTO public.vitoken_transactions (user_id, amount, balance_after, transaction_type, description)
    VALUES (p_buyer_id, -v_price, v_buyer_balance - v_price, 'know_inherit_buy', 'Mua tài liệu KnowInherit');

    RETURN TRUE;
END;
$$;

-- 13. Enable Realtime Publications for Multiplayer Desk
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.desk_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.desk_sticky_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.desk_drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inteline_threads;
