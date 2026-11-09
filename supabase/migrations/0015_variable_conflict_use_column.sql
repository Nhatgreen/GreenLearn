-- ==============================================================================
-- Migration 0015: Add variable_conflict use_column to create_payment_request
-- ==============================================================================

BEGIN;

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
#variable_conflict use_column
DECLARE
    v_user_id UUID := auth.uid();
    v_pkg RECORD;
    v_code TEXT;
    v_pending_count INT;
    v_hour_count INT;
    v_req_id UUID;
    v_expires TIMESTAMPTZ;
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_rand TEXT;
    v_attempts INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    -- Đảm bảo profile người dùng luôn tồn tại trong public.profiles
    INSERT INTO public.profiles (id, email, display_name, vitoken_balance)
    SELECT 
        v_user_id, 
        COALESCE(u.email, 'user_' || substr(v_user_id::text, 1, 8) || '@vitudy.com'),
        COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Sinh viên ViTudy'),
        50
    FROM auth.users u
    WHERE u.id = v_user_id
    ON CONFLICT (id) DO NOTHING;

    -- Lấy thông tin gói nạp
    SELECT vitoken_packages.id, vitoken_packages.price_vnd, vitoken_packages.token_amount INTO v_pkg 
    FROM public.vitoken_packages
    WHERE vitoken_packages.id = p_package_id AND vitoken_packages.enabled = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'package_not_found';
    END IF;

    -- Giới hạn tối đa 5 yêu cầu pending đồng thời
    SELECT COUNT(*) INTO v_pending_count 
    FROM public.payment_requests
    WHERE payment_requests.user_id = v_user_id 
      AND payment_requests.status = 'pending' 
      AND payment_requests.expires_at > NOW();

    IF v_pending_count >= 5 THEN
        RAISE EXCEPTION 'too_many_pending_requests';
    END IF;

    -- Giới hạn 10 yêu cầu/giờ/user
    SELECT COUNT(*) INTO v_hour_count 
    FROM public.payment_requests
    WHERE payment_requests.user_id = v_user_id 
      AND payment_requests.created_at > (NOW() - INTERVAL '1 hour');

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

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.payment_requests 
            WHERE payment_requests.code = v_code
        );

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

COMMIT;
