-- ==============================================================================
-- Migration 0003: Rate Limiting & AI Model Costs
-- Spec: Plan 02a Task A.4 / Decision D4
-- ==============================================================================

BEGIN;

-- 1. AI Model Pricing Table
CREATE TABLE IF NOT EXISTS public.ai_model_costs (
    model TEXT PRIMARY KEY,
    vitoken_cost INT NOT NULL CHECK (vitoken_cost >= 0),
    enabled BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_model_costs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon to read model pricing and availability
CREATE POLICY "Anyone can view enabled AI models"
    ON public.ai_model_costs FOR SELECT
    USING (enabled = true);

-- Seed initial models per Decision D4
INSERT INTO public.ai_model_costs (model, vitoken_cost, enabled, description)
VALUES 
    ('gpt-4o-mini', 1, true, 'Mô hình tiêu chuẩn hệ thống ViTudy'),
    ('gemini-1.5-flash', 1, true, 'Google Gemini 1.5 Flash tốc độ cao'),
    ('gpt-4o', 4, true, 'OpenAI GPT-4o cao cấp')
ON CONFLICT (model) DO UPDATE
SET vitoken_cost = EXCLUDED.vitoken_cost,
    enabled = EXCLUDED.enabled,
    description = EXCLUDED.description;

-- 2. Rate Limits Tracking Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, action)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client access to rate_limits table
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

-- 3. Atomic Rate Limiter Stored Procedure
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
    p_user UUID,
    p_action TEXT,
    p_limit INT,
    p_window INTERVAL
)
RETURNS TABLE (allowed BOOLEAN, remaining INT, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_reset_at TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_record
    FROM public.rate_limits
    WHERE user_id = p_user AND action = p_action
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (user_id, action, count, window_start)
        VALUES (p_user, p_action, 1, v_now);
        RETURN QUERY SELECT true, p_limit - 1, v_now + p_window;
        RETURN;
    END IF;

    -- If window expired, reset counter
    IF v_record.window_start + p_window <= v_now THEN
        UPDATE public.rate_limits
        SET count = 1,
            window_start = v_now
        WHERE user_id = p_user AND action = p_action;
        RETURN QUERY SELECT true, p_limit - 1, v_now + p_window;
        RETURN;
    END IF;

    v_reset_at := v_record.window_start + p_window;

    -- Check if limit exceeded
    IF v_record.count >= p_limit THEN
        RETURN QUERY SELECT false, 0, v_reset_at;
        RETURN;
    END IF;

    -- Increment count
    UPDATE public.rate_limits
    SET count = v_record.count + 1
    WHERE user_id = p_user AND action = p_action;

    RETURN QUERY SELECT true, p_limit - (v_record.count + 1), v_reset_at;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(UUID, TEXT, INT, INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INT, INTERVAL) TO service_role;

COMMIT;
