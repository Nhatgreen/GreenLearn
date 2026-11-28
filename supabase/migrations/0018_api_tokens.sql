-- ==============================================================================
-- Migration 0018: Personal API Tokens for Read-Only Antigravity MCP Server
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Bảng lưu token cá nhân (chỉ lưu token_hash SHA-256 hex, không lưu bản rõ)
CREATE TABLE IF NOT EXISTS public.api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Antigravity' CHECK (char_length(name) BETWEEN 1 AND 60),
    token_hash TEXT NOT NULL UNIQUE,
    last4 TEXT NOT NULL CHECK (char_length(last4) = 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON public.api_tokens(user_id);

-- 2. Bật RLS & khóa quyền cột nghiêm ngặt (không lộ token_hash, không cho client tự INSERT/UPDATE/DELETE)
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.api_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, user_id, name, last4, created_at, expires_at, last_used_at, revoked_at)
    ON public.api_tokens TO authenticated;

DROP POLICY IF EXISTS "Users can view own api tokens" ON public.api_tokens;
CREATE POLICY "Users can view own api tokens"
    ON public.api_tokens FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. RPC tạo API token mới (trả về bản rõ 1 lần duy nhất)
CREATE OR REPLACE FUNCTION public.create_api_token(p_name TEXT DEFAULT 'Antigravity')
RETURNS TABLE (id UUID, token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_name TEXT;
    v_active_count INT;
    v_rate_allowed BOOLEAN;
    v_reset_at TIMESTAMPTZ;
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_last4 TEXT;
    v_new_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated: Vui lòng đăng nhập để tạo token.' USING ERRCODE = '28000';
    END IF;

    v_name := COALESCE(NULLIF(btrim(p_name), ''), 'Antigravity');
    IF char_length(v_name) < 1 OR char_length(v_name) > 60 THEN
        RAISE EXCEPTION 'invalid_name: Tên token phải từ 1 đến 60 ký tự.' USING ERRCODE = '22023';
    END IF;

    -- Tận dụng bảng rate_limits (0003) để chống spam tạo token (tối đa 10 lần/giờ)
    SELECT rl.allowed, rl.reset_at
    INTO v_rate_allowed, v_reset_at
    FROM public.consume_rate_limit(v_user_id, 'create_api_token', 10, INTERVAL '1 hour') AS rl;

    IF NOT COALESCE(v_rate_allowed, true) THEN
        RAISE EXCEPTION 'rate_limited: Bạn tạo token quá nhanh. Vui lòng thử lại sau %.', v_reset_at USING ERRCODE = 'P0001';
    END IF;

    -- Giới hạn tối đa 5 token còn hiệu lực (chưa thu hồi và chưa hết hạn)
    SELECT COUNT(*)
    INTO v_active_count
    FROM public.api_tokens t
    WHERE t.user_id = v_user_id
      AND t.revoked_at IS NULL
      AND t.expires_at > NOW();

    IF v_active_count >= 5 THEN
        RAISE EXCEPTION 'token_limit_reached: Mỗi tài khoản chỉ được có tối đa 5 token đang hoạt động. Vui lòng thu hồi token cũ trước.' USING ERRCODE = 'P0001';
    END IF;

    -- Sinh token: 'gl_' + 64 ký tự hex ngẫu nhiên (32 bytes)
    v_raw_token := 'gl_' || encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');
    v_last4 := right(v_raw_token, 4);
    v_expires_at := NOW() + INTERVAL '90 days';

    INSERT INTO public.api_tokens (user_id, name, token_hash, last4, expires_at)
    VALUES (v_user_id, v_name, v_token_hash, v_last4, v_expires_at)
    RETURNING api_tokens.id INTO v_new_id;

    RETURN QUERY SELECT v_new_id, v_raw_token, v_expires_at;
END;
$$;

-- 4. RPC thu hồi API token của chính người dùng
CREATE OR REPLACE FUNCTION public.revoke_api_token(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_updated INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated: Vui lòng đăng nhập.' USING ERRCODE = '28000';
    END IF;

    IF p_id IS NULL THEN
        RAISE EXCEPTION 'invalid_id: Thiếu ID token.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.api_tokens
    SET revoked_at = NOW()
    WHERE id = p_id
      AND user_id = v_user_id
      AND revoked_at IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.create_api_token(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_api_token(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_api_token(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_api_token(UUID) TO authenticated;

COMMIT;
