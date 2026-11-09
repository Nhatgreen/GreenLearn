-- ==============================================================================
-- Migration 0005: VietQR & Sepay Webhook Payment Infrastructure
-- Spec: Plan 03 / Decisions D4, D6
-- ==============================================================================

BEGIN;

-- 1. App Settings (Demo Mode Flag)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public settings"
    ON public.app_settings FOR SELECT
    USING (true);

INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('demo_mode', 'true'::jsonb, 'Chế độ demo học thuật, cho phép admin giả lập thanh toán')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- 2. ViToken Packages
CREATE TABLE IF NOT EXISTS public.vitoken_packages (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    token_amount INT NOT NULL CHECK (token_amount > 0),
    price_vnd INT NOT NULL CHECK (price_vnd > 0),
    sort INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vitoken_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled packages"
    ON public.vitoken_packages FOR SELECT
    USING (enabled = true);

-- Seed Packages per Decision D4 (1 ViToken = 200đ, có chiết khấu gói lớn)
INSERT INTO public.vitoken_packages (id, label, token_amount, price_vnd, sort, enabled)
VALUES
    ('demo', 'Gói Trải Nghiệm (10V)', 10, 2000, 1, true),
    ('basic', 'Gói Cơ Bản (50V)', 50, 10000, 2, true),
    ('standard', 'Gói Tiêu Chuẩn (150V)', 150, 27000, 3, true),
    ('premium', 'Gói Nâng Cao (500V)', 500, 85000, 4, true),
    ('vip', 'Gói Chuyên Nghiệp (1.500V)', 1500, 255000, 5, true)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    token_amount = EXCLUDED.token_amount,
    price_vnd = EXCLUDED.price_vnd,
    sort = EXCLUDED.sort,
    enabled = EXCLUDED.enabled;

-- 3. Payment Requests
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL REFERENCES public.vitoken_packages(id),
    code TEXT UNIQUE NOT NULL,
    amount_vnd INT NOT NULL CHECK (amount_vnd > 0),
    token_amount INT NOT NULL CHECK (token_amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'completed_late', 'expired', 'failed')),
    sepay_transaction_id BIGINT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests"
    ON public.payment_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Enable Realtime for payment_requests so clients get instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;

-- 4. Unmatched Payments (Audit Table for Late or Mismatched Transfers)
CREATE TABLE IF NOT EXISTS public.unmatched_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sepay_transaction_id BIGINT UNIQUE,
    code TEXT,
    amount_vnd INT,
    reason TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.unmatched_payments ENABLE ROW LEVEL SECURITY;
-- Unmatched payments table only readable/writable by service_role

-- 5. Sequence for Demo Payment Transactions
CREATE SEQUENCE IF NOT EXISTS public.demo_payment_seq START 1;

-- 6. RPC: create_payment_request
CREATE OR REPLACE FUNCTION public.create_payment_request(p_package_id TEXT)
RETURNS TABLE (
    id UUID,
    code TEXT,
    amount_vnd INT,
    token_amount INT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_pkg RECORD;
    v_code TEXT;
    v_pending_count INT;
    v_hour_count INT;
    v_req_id UUID;
    v_expires TIMESTAMPTZ;
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Bỏ 0, 1, I, O để tránh nhầm lẫn
    v_rand TEXT;
    v_attempts INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    -- Lấy thông tin gói nạp
    SELECT * INTO v_pkg 
    FROM public.vitoken_packages 
    WHERE id = p_package_id AND enabled = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'package_not_found';
    END IF;

    -- Giới hạn tối đa 5 yêu cầu pending đồng thời
    SELECT COUNT(*) INTO v_pending_count 
    FROM public.payment_requests 
    WHERE user_id = v_user_id AND status = 'pending' AND expires_at > NOW();

    IF v_pending_count >= 5 THEN
        RAISE EXCEPTION 'too_many_pending_requests';
    END IF;

    -- Giới hạn 10 yêu cầu/giờ/user
    SELECT COUNT(*) INTO v_hour_count 
    FROM public.payment_requests 
    WHERE user_id = v_user_id AND created_at > (NOW() - INTERVAL '1 hour');

    IF v_hour_count >= 10 THEN
        RAISE EXCEPTION 'too_many_requests';
    END IF;

    -- Sinh mã nội dung VT + 8 ký tự không trùng lặp
    LOOP
        v_rand := '';
        FOR i IN 1..8 LOOP
            v_rand := v_rand || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        END LOOP;
        v_code := 'VT' || v_rand;

        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.payment_requests WHERE code = v_code);

        v_attempts := v_attempts + 1;
        IF v_attempts > 10 THEN
            RAISE EXCEPTION 'cannot_generate_unique_code';
        END IF;
    END LOOP;

    v_req_id := gen_random_uuid();
    v_expires := NOW() + INTERVAL '15 minutes';

    INSERT INTO public.payment_requests (
        id, user_id, package_id, code, amount_vnd, token_amount, expires_at
    ) VALUES (
        v_req_id, v_user_id, p_package_id, v_code, v_pkg.price_vnd, v_pkg.token_amount, v_expires
    );

    RETURN QUERY SELECT v_req_id, v_code, v_pkg.price_vnd, v_pkg.token_amount, v_expires;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_payment_request(TEXT) TO authenticated;

-- 7. RPC: apply_payment (Atomic & Idempotent, Service Role Only)
CREATE OR REPLACE FUNCTION public.apply_payment(
    p_sepay_id BIGINT,
    p_code TEXT,
    p_amount INT,
    p_account TEXT,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_req RECORD;
    v_balance_after INT;
    v_clean_code TEXT := UPPER(TRIM(p_code));
    v_status TEXT;
BEGIN
    -- 1. Kiểm tra idempotency theo sepay_transaction_id
    IF EXISTS (
        SELECT 1 FROM public.payment_requests 
        WHERE sepay_transaction_id = p_sepay_id
    ) THEN
        RETURN jsonb_build_object('result', 'duplicate', 'message', 'Transaction already processed');
    END IF;

    -- 2. Tìm payment request theo code
    SELECT * INTO v_req 
    FROM public.payment_requests 
    WHERE code = v_clean_code 
      AND status IN ('pending', 'expired')
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Ghi vào unmatched_payments để admin đối soát thủ công
        INSERT INTO public.unmatched_payments (
            sepay_transaction_id, code, amount_vnd, reason, payload
        ) VALUES (
            p_sepay_id, v_clean_code, p_amount, 'code_not_found_or_already_completed', p_payload
        ) ON CONFLICT (sepay_transaction_id) DO NOTHING;

        RETURN jsonb_build_object('result', 'unmatched', 'reason', 'code_not_found');
    END IF;

    -- 3. Kiểm tra số tiền chuyển vào
    IF p_amount < v_req.amount_vnd THEN
        -- Chuyển thiếu tiền: ghi vào unmatched_payments
        INSERT INTO public.unmatched_payments (
            sepay_transaction_id, code, amount_vnd, reason, payload
        ) VALUES (
            p_sepay_id, v_clean_code, p_amount, 'insufficient_amount', p_payload
        ) ON CONFLICT (sepay_transaction_id) DO NOTHING;

        RETURN jsonb_build_object('result', 'unmatched', 'reason', 'insufficient_amount');
    END IF;

    -- 4. Xác định trạng thái hoàn thành (kể cả muộn trong vòng 48h)
    IF NOW() > (v_req.created_at + INTERVAL '48 hours') THEN
        INSERT INTO public.unmatched_payments (
            sepay_transaction_id, code, amount_vnd, reason, payload
        ) VALUES (
            p_sepay_id, v_clean_code, p_amount, 'expired_over_48h', p_payload
        ) ON CONFLICT (sepay_transaction_id) DO NOTHING;

        RETURN jsonb_build_object('result', 'unmatched', 'reason', 'expired_over_48h');
    ELSIF NOW() > v_req.expires_at THEN
        v_status := 'completed_late';
    ELSE
        v_status := 'completed';
    END IF;

    -- 5. Cộng ViToken cho người dùng bằng hàm credit_vitoken an toàn
    v_balance_after := public.credit_vitoken(
        v_req.user_id,
        v_req.token_amount,
        'purchase',
        'Nạp ViToken qua VietQR (Mã ' || v_clean_code || ')',
        'sepay:' || p_sepay_id::text
    );

    -- 6. Cập nhật trạng thái payment_request
    UPDATE public.payment_requests
    SET status = v_status,
        sepay_transaction_id = p_sepay_id,
        completed_at = NOW()
    WHERE id = v_req.id;

    -- Nếu chuyển dư tiền, ghi phần dư vào unmatched_payments để đối soát
    IF p_amount > v_req.amount_vnd THEN
        INSERT INTO public.unmatched_payments (
            sepay_transaction_id, code, amount_vnd, reason, payload
        ) VALUES (
            p_sepay_id, v_clean_code, p_amount - v_req.amount_vnd, 'overpaid_excess', p_payload
        ) ON CONFLICT (sepay_transaction_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'result', 'credited',
        'user_id', v_req.user_id,
        'token_amount', v_req.token_amount,
        'balance_after', v_balance_after
    );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_payment(BIGINT, TEXT, INT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_payment(BIGINT, TEXT, INT, TEXT, JSONB) TO service_role;

-- 8. RPC: admin_simulate_payment (For Demo Presentation Mode)
CREATE OR REPLACE FUNCTION public.admin_simulate_payment(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_demo_mode JSONB;
    v_req RECORD;
    v_fake_sepay_id BIGINT;
    v_res JSONB;
BEGIN
    -- Kiểm tra cờ demo_mode
    SELECT value INTO v_demo_mode 
    FROM public.app_settings 
    WHERE key = 'demo_mode';

    IF v_demo_mode IS NULL OR v_demo_mode::text <> 'true' THEN
        RAISE EXCEPTION 'demo_mode_disabled';
    END IF;

    SELECT * INTO v_req 
    FROM public.payment_requests 
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'request_not_found';
    END IF;

    IF v_req.status = 'completed' THEN
        RETURN jsonb_build_object('result', 'duplicate', 'message', 'Yêu cầu này đã được thanh toán');
    END IF;

    -- Tạo id số âm giả lập Sepay duy nhất
    v_fake_sepay_id := -1 * nextval('public.demo_payment_seq');

    -- Gọi đúng logic apply_payment
    v_res := public.apply_payment(
        v_fake_sepay_id,
        v_req.code,
        v_req.amount_vnd,
        'DEMO_ACCOUNT',
        jsonb_build_object('simulated', true, 'timestamp', NOW())
    );

    RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_simulate_payment(UUID) TO authenticated;

COMMIT;
