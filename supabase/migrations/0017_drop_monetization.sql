-- ==============================================================================
-- Migration 0017: Drop Monetization, Tokens, Payments & Marketplace
-- Platform: GreenLearn (100% Free Educational Architecture)
-- ==============================================================================

BEGIN;

-- 1. Xóa chính sách Storage của Chợ tài liệu và dọn dẹp bucket
DROP POLICY IF EXISTS "Buyers can read purchased listing content" ON storage.objects;
DROP POLICY IF EXISTS "Authors can manage listing content" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'listing-content';

-- 2. Xóa các hàm RPC & Sequence liên quan đến Ví token, SePay & Chợ
DROP FUNCTION IF EXISTS public.process_know_inherit_purchase(UUID);
DROP FUNCTION IF EXISTS public.credit_vitoken(UUID, INT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.debit_vitoken(UUID, INT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.apply_payment(BIGINT, TEXT, INT, JSONB);
DROP FUNCTION IF EXISTS public.create_payment_request(TEXT);
DROP FUNCTION IF EXISTS public.admin_simulate_payment(UUID);
DROP SEQUENCE IF EXISTS public.demo_payment_seq;

-- 3. Xóa các bảng thanh toán, nạp tiền, gói token và chợ tài liệu
DROP TABLE IF EXISTS public.unmatched_payments CASCADE;
DROP TABLE IF EXISTS public.payment_requests CASCADE;
DROP TABLE IF EXISTS public.vitoken_packages CASCADE;
DROP TABLE IF EXISTS public.know_inherit_purchases CASCADE;
DROP TABLE IF EXISTS public.know_inherit_listings CASCADE;
DROP TABLE IF EXISTS public.vitoken_transactions CASCADE;
DROP TABLE IF EXISTS public.ai_model_costs CASCADE;

-- 4. Dọn sạch các cột tiền tệ và khóa server-side cũ trong bảng profiles
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS vitoken_balance,
    DROP COLUMN IF EXISTS custom_openai_key_encrypted,
    DROP COLUMN IF EXISTS custom_gemini_key_encrypted,
    DROP COLUMN IF EXISTS oauth_chatgpt_token;

-- 5. Cập nhật lại Trigger đăng ký người dùng mới handle_new_user() (không còn thưởng 50 ViToken)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, display_name, avatar_url, daily_streak_days, last_claim_date
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        1,
        CURRENT_DATE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

COMMIT;
