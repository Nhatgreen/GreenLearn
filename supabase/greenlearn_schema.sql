-- ==============================================================================
-- GREENLEARN DATABASE SCHEMA (Clean 100% Free - Zero Monetization)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jzwmgflmhtaceasqzfop/sql/new
-- ==============================================================================

BEGIN;

-- 1. PROFILES TABLE & AUTH TRIGGER
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  daily_streak_days INTEGER DEFAULT 0,
  last_claim_date DATE,
  custom_openai_key_encrypted TEXT,
  custom_gemini_key_encrypted TEXT,
  oauth_chatgpt_token JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. STUDY SPACES TABLE
CREATE TABLE IF NOT EXISTS public.study_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Bàn học của tôi',
  subject TEXT NOT NULL DEFAULT 'Học tập',
  is_public BOOLEAN DEFAULT false,
  camera_transform JSONB DEFAULT '{"x": 0, "y": 0, "scale": 1, "rotation": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own spaces" ON public.study_spaces;
CREATE POLICY "Users can manage own spaces" ON public.study_spaces
  FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public spaces viewable by everyone" ON public.study_spaces;
CREATE POLICY "Public spaces viewable by everyone" ON public.study_spaces
  FOR SELECT USING (is_public = true);


-- 3. DESK DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.desk_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.study_spaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL,
  x DOUBLE PRECISION DEFAULT 0,
  y DOUBLE PRECISION DEFAULT 0,
  rotation DOUBLE PRECISION DEFAULT 0,
  scale DOUBLE PRECISION DEFAULT 1,
  z_index INTEGER DEFAULT 1,
  page_count INTEGER DEFAULT 1,
  current_page_index INTEGER DEFAULT 0,
  is_binder BOOLEAN DEFAULT false,
  storage_file_path TEXT,
  color_theme TEXT,
  cover_color TEXT,
  sticky_text TEXT,
  sticky_color TEXT,
  text_align TEXT DEFAULT 'left',
  is_bold BOOLEAN DEFAULT false,
  is_exam_sheet BOOLEAN DEFAULT false,
  exam_data JSONB,
  source_documents JSONB,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.desk_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage documents in own spaces" ON public.desk_documents;
CREATE POLICY "Users manage documents in own spaces" ON public.desk_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.study_spaces
      WHERE public.study_spaces.id = desk_documents.space_id
      AND public.study_spaces.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public space documents viewable" ON public.desk_documents;
CREATE POLICY "Public space documents viewable" ON public.desk_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_spaces
      WHERE public.study_spaces.id = desk_documents.space_id
      AND public.study_spaces.is_public = true
    )
  );


-- 4. DOCUMENT PAGES TABLE
CREATE TABLE IF NOT EXISTS public.document_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.desk_documents(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  embedding TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(document_id, page_number)
);

ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage pages in own spaces" ON public.document_pages;
CREATE POLICY "Users manage pages in own spaces" ON public.document_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.desk_documents
      JOIN public.study_spaces ON public.study_spaces.id = desk_documents.space_id
      WHERE public.desk_documents.id = document_pages.document_id
      AND public.study_spaces.owner_id = auth.uid()
    )
  );


-- 5. DESK DRAWINGS TABLE
CREATE TABLE IF NOT EXISTS public.desk_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.study_spaces(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  color TEXT NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  is_highlighter BOOLEAN DEFAULT false,
  points JSONB NOT NULL,
  attached_to_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.desk_drawings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage drawings in own spaces" ON public.desk_drawings;
CREATE POLICY "Users manage drawings in own spaces" ON public.desk_drawings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.study_spaces
      WHERE public.study_spaces.id = desk_drawings.space_id
      AND public.study_spaces.owner_id = auth.uid()
    )
  );


-- 6. INTELINE THREADS TABLE
CREATE TABLE IF NOT EXISTS public.inteline_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.study_spaces(id) ON DELETE CASCADE NOT NULL,
  source_item_id TEXT NOT NULL,
  source_page_number INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  source_offset JSONB,
  target_sticky_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inteline_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage inteline threads in own spaces" ON public.inteline_threads;
CREATE POLICY "Users manage inteline threads in own spaces" ON public.inteline_threads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.study_spaces
      WHERE public.study_spaces.id = inteline_threads.space_id
      AND public.study_spaces.owner_id = auth.uid()
    )
  );


-- 7. SPACE MEMBERS TABLE (Collaborative study)
CREATE TABLE IF NOT EXISTS public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.study_spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(space_id, user_id)
);

ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Space members viewable" ON public.space_members;
CREATE POLICY "Space members viewable" ON public.space_members
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.study_spaces WHERE public.study_spaces.id = space_members.space_id AND public.study_spaces.owner_id = auth.uid()
  ));


-- 8. FLASHCARD REVIEWS TABLE (SM-2 Spaced Repetition)
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.desk_documents(id) ON DELETE CASCADE,
  card_hash TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  easiness_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 1,
  repetitions INT NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, card_hash)
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reviews" ON public.flashcard_reviews;
CREATE POLICY "Users manage own reviews" ON public.flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);


-- 9. STUDY SESSIONS TABLE & HEARTBEAT RPC
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  seconds INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, day)
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own study sessions" ON public.study_sessions;
CREATE POLICY "Users view own study sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.record_heartbeat(p_seconds INT DEFAULT 20)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_clamped_seconds INT;
  v_today DATE := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_new_total INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  v_clamped_seconds := LEAST(GREATEST(p_seconds, 1), 30);

  INSERT INTO public.study_sessions (user_id, day, seconds)
  VALUES (v_user_id, v_today, v_clamped_seconds)
  ON CONFLICT (user_id, day)
  DO UPDATE SET seconds = public.study_sessions.seconds + v_clamped_seconds
  RETURNING seconds INTO v_new_total;

  RETURN v_new_total;
END;
$$;


-- 10. EXAM ATTEMPTS TABLE & RPC
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.desk_documents(id) ON DELETE SET NULL,
  score NUMERIC NOT NULL,
  total INT NOT NULL,
  correct INT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own exam attempts" ON public.exam_attempts;
CREATE POLICY "Users view own exam attempts" ON public.exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own exam attempts" ON public.exam_attempts;
CREATE POLICY "Users insert own exam attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
  p_document_id UUID,
  p_score NUMERIC,
  p_total INT,
  p_correct INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  INSERT INTO public.exam_attempts (user_id, document_id, score, total, correct)
  VALUES (v_user_id, p_document_id, p_score, p_total, p_correct)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- 11. STORAGE BUCKETS (avatars, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
CREATE POLICY "Users can manage own avatar"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can access own documents" ON storage.objects;
CREATE POLICY "Users can access own documents"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

COMMIT;
