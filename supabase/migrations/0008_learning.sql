-- Migration 0008: Flashcard Reviews (SM-2), Study Sessions Heartbeat & Exam Attempts

-- 1. Bảng lưu trữ lịch ôn tập Spaced Repetition SM-2
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES desk_documents(id) ON DELETE CASCADE,
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

CREATE POLICY "Users manage own reviews" ON public.flashcard_reviews
  FOR ALL USING (auth.uid() = user_id);

-- 2. Bảng theo dõi thời lượng học tập mỗi ngày
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  seconds INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, day)
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own study sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Bảng lưu lịch sử làm bài thi trắc nghiệm & tự luận
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES desk_documents(id) ON DELETE SET NULL,
  score NUMERIC NOT NULL,
  total INT NOT NULL,
  correct INT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own exam attempts" ON public.exam_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own exam attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. RPC ghi nhận nhịp tim học tập an toàn
CREATE OR REPLACE FUNCTION record_heartbeat(p_seconds INT DEFAULT 20)
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

  -- Kẹp từ 1 đến tối đa 30 giây để chống hack thời gian
  v_clamped_seconds := LEAST(GREATEST(p_seconds, 1), 30);

  INSERT INTO study_sessions (user_id, day, seconds)
  VALUES (v_user_id, v_today, v_clamped_seconds)
  ON CONFLICT (user_id, day)
  DO UPDATE SET seconds = study_sessions.seconds + v_clamped_seconds
  RETURNING seconds INTO v_new_total;

  RETURN v_new_total;
END;
$$;

-- 5. RPC lưu kết quả bài kiểm tra
CREATE OR REPLACE FUNCTION submit_exam_attempt(
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

  INSERT INTO exam_attempts (user_id, document_id, score, total, correct)
  VALUES (v_user_id, p_document_id, p_score, p_total, p_correct)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
