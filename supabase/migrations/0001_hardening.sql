-- ==============================================================================
-- Migration 0001: Security Hardening, Token Safety & RLS Alignment
-- Spec: Plan 02a Task A.2 / REVIEW-2026-11-08
-- ==============================================================================

BEGIN;

-- 1. Helper Functions for Workspace Permission Checks
CREATE OR REPLACE FUNCTION public.can_view_space(p_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.study_spaces s
        WHERE s.id = p_space_id
          AND (
              s.owner_id = auth.uid()
              OR s.is_public = true
              OR EXISTS (
                  SELECT 1 FROM public.space_members m
                  WHERE m.space_id = p_space_id AND m.user_id = auth.uid()
              )
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_space(p_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.study_spaces s
        WHERE s.id = p_space_id
          AND (
              s.owner_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM public.space_members m
                  WHERE m.space_id = p_space_id 
                    AND m.user_id = auth.uid() 
                    AND m.role IN ('owner', 'editor')
              )
          )
    );
$$;

-- 2. Alter Transactions & Listings Constraints
-- Add reference column for idempotency and expand transaction types
ALTER TABLE public.vitoken_transactions 
    ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;

ALTER TABLE public.vitoken_transactions 
    DROP CONSTRAINT IF EXISTS vitoken_transactions_transaction_type_check;

ALTER TABLE public.vitoken_transactions 
    ADD CONSTRAINT vitoken_transactions_transaction_type_check 
    CHECK (transaction_type IN (
        'signup_grant', 'daily_streak', 'ai_usage', 
        'know_inherit_buy', 'know_inherit_earning', 
        'transfer', 'purchase', 'referral', 'refund'
    ));

-- Align know_inherit_listings status values across the whole project
ALTER TABLE public.know_inherit_listings 
    DROP CONSTRAINT IF EXISTS know_inherit_listings_status_check;

ALTER TABLE public.know_inherit_listings 
    ADD CONSTRAINT know_inherit_listings_status_check 
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'removed'));

-- 3. Secure Token Operations (SECURITY DEFINER, Service Role Only)
CREATE OR REPLACE FUNCTION public.credit_vitoken(
    p_user UUID,
    p_amount INT,
    p_type TEXT,
    p_description TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance_after INT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'amount_must_be_positive';
    END IF;

    -- Check idempotency if reference is provided
    IF p_reference IS NOT NULL THEN
        SELECT balance_after INTO v_balance_after 
        FROM public.vitoken_transactions 
        WHERE reference = p_reference;

        IF FOUND THEN
            RETURN v_balance_after;
        END IF;
    END IF;

    -- Lock row and update
    UPDATE public.profiles
    SET vitoken_balance = vitoken_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_user
    RETURNING vitoken_balance INTO v_balance_after;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user_not_found';
    END IF;

    -- Record transaction
    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description, reference
    ) VALUES (
        p_user, p_amount, v_balance_after, p_type, p_description, p_reference
    );

    RETURN v_balance_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.debit_vitoken(
    p_user UUID,
    p_amount INT,
    p_type TEXT,
    p_description TEXT,
    p_reference TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_balance INT;
    v_balance_after INT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'amount_must_be_positive';
    END IF;

    -- Check idempotency if reference is provided
    IF p_reference IS NOT NULL THEN
        SELECT balance_after INTO v_balance_after 
        FROM public.vitoken_transactions 
        WHERE reference = p_reference;

        IF FOUND THEN
            RETURN v_balance_after;
        END IF;
    END IF;

    -- Lock row for update
    SELECT vitoken_balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user_not_found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'insufficient_balance';
    END IF;

    v_balance_after := v_current_balance - p_amount;

    UPDATE public.profiles
    SET vitoken_balance = v_balance_after,
        updated_at = NOW()
    WHERE id = p_user;

    -- Record transaction (negative amount)
    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description, reference
    ) VALUES (
        p_user, -p_amount, v_balance_after, p_type, p_description, p_reference
    );

    RETURN v_balance_after;
END;
$$;

-- Restrict execution to service_role only (cannot be called by regular users)
REVOKE ALL ON FUNCTION public.credit_vitoken(UUID, INT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_vitoken(UUID, INT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.debit_vitoken(UUID, INT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debit_vitoken(UUID, INT, TEXT, TEXT, TEXT) TO service_role;

-- 4. User Claim Daily Streak Function (Uses auth.uid())
CREATE OR REPLACE FUNCTION public.claim_daily_streak()
RETURNS TABLE (earned INT, streak INT, balance_after INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_last_claim DATE;
    v_streak INT;
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
    v_is_sunday BOOLEAN := EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')) = 0;
    v_earned INT := 5;
    v_new_balance INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    IF v_is_sunday THEN
        v_earned := 10;
    END IF;

    SELECT last_claim_date, daily_streak_days, vitoken_balance
    INTO v_last_claim, v_streak, v_new_balance
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user_not_found';
    END IF;

    -- Already claimed today
    IF v_last_claim = v_today THEN
        RETURN QUERY SELECT 0, v_streak, v_new_balance;
        RETURN;
    END IF;

    -- Calculate streak continuity
    IF v_last_claim = v_today - 1 THEN
        v_streak := v_streak + 1;
    ELSE
        v_streak := 1;
    END IF;

    v_new_balance := v_new_balance + v_earned;

    UPDATE public.profiles
    SET vitoken_balance = v_new_balance,
        daily_streak_days = v_streak,
        last_claim_date = v_today,
        updated_at = NOW()
    WHERE id = v_user_id;

    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description
    ) VALUES (
        v_user_id, v_earned, v_new_balance, 'daily_streak', 
        'Điểm danh hàng ngày (Chuỗi ' || v_streak || ' ngày)'
    );

    RETURN QUERY SELECT v_earned, v_streak, v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_streak() TO authenticated;

-- 5. Rewrite KnowInherit Purchase Function (Safe & Atomic)
CREATE OR REPLACE FUNCTION public.process_know_inherit_purchase (
    p_listing_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_buyer_id UUID := auth.uid();
    v_price INT;
    v_seller_id UUID;
    v_status TEXT;
    v_buyer_balance INT;
    v_seller_balance INT;
    v_author_cut INT;
    v_platform_cut INT;
BEGIN
    IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'unauthenticated';
    END IF;

    -- Fetch and validate listing
    SELECT price, author_id, status 
    INTO v_price, v_seller_id, v_status 
    FROM public.know_inherit_listings 
    WHERE id = p_listing_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'listing_not_found';
    END IF;

    IF v_status <> 'published' THEN
        RAISE EXCEPTION 'listing_not_available';
    END IF;

    IF v_seller_id = v_buyer_id THEN
        RAISE EXCEPTION 'cannot_buy_own_listing';
    END IF;

    -- Check if already purchased
    IF EXISTS (
        SELECT 1 FROM public.know_inherit_purchases 
        WHERE listing_id = p_listing_id AND buyer_id = v_buyer_id
    ) THEN
        RAISE EXCEPTION 'already_purchased';
    END IF;

    -- Lock buyer row
    SELECT vitoken_balance INTO v_buyer_balance 
    FROM public.profiles 
    WHERE id = v_buyer_id
    FOR UPDATE;

    IF v_buyer_balance < v_price THEN
        RAISE EXCEPTION 'insufficient_balance';
    END IF;

    -- Lock seller row
    SELECT vitoken_balance INTO v_seller_balance 
    FROM public.profiles 
    WHERE id = v_seller_id
    FOR UPDATE;

    -- Calculate 85/15 revenue split
    v_author_cut := FLOOR(v_price * 0.85);
    v_platform_cut := v_price - v_author_cut;

    -- Debit buyer
    UPDATE public.profiles 
    SET vitoken_balance = vitoken_balance - v_price,
        updated_at = NOW()
    WHERE id = v_buyer_id;

    -- Credit seller
    UPDATE public.profiles 
    SET vitoken_balance = vitoken_balance + v_author_cut,
        updated_at = NOW()
    WHERE id = v_seller_id;

    -- Record purchase
    INSERT INTO public.know_inherit_purchases (
        listing_id, buyer_id, total_price, author_payout, platform_fee
    ) VALUES (
        p_listing_id, v_buyer_id, v_price, v_author_cut, v_platform_cut
    );

    -- Record transactions for BOTH parties
    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description
    ) VALUES (
        v_buyer_id, -v_price, v_buyer_balance - v_price, 'know_inherit_buy', 'Mua tài liệu KnowInherit'
    );

    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description
    ) VALUES (
        v_seller_id, v_author_cut, v_seller_balance + v_author_cut, 'know_inherit_earning', 'Doanh thu bán tài liệu KnowInherit'
    );

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_know_inherit_purchase(UUID) TO authenticated;

-- 6. Trigger for New User Signup (Creates Profile & Welcome Grant)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, display_name, avatar_url, vitoken_balance
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        50
    );

    INSERT INTO public.vitoken_transactions (
        user_id, amount, balance_after, transaction_type, description
    ) VALUES (
        NEW.id, 50, 50, 'signup_grant', 'Quà tặng khởi đầu chào đón thành viên mới'
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Fix RLS Policies & Column Grants

-- 7.1 Profiles
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 7.2 Study Spaces (Only owner can insert, update, delete)
DROP POLICY IF EXISTS "Users can access their own spaces or public spaces" ON public.study_spaces;

CREATE POLICY "Users can view accessible spaces"
    ON public.study_spaces FOR SELECT
    USING (auth.uid() = owner_id OR is_public = true OR public.can_view_space(id));

CREATE POLICY "Users can create own spaces"
    ON public.study_spaces FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own spaces"
    ON public.study_spaces FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own spaces"
    ON public.study_spaces FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- 7.3 Space Members
DROP POLICY IF EXISTS "Users can view members of accessible spaces" ON public.space_members;
DROP POLICY IF EXISTS "Space owners can manage space members" ON public.space_members;

CREATE POLICY "Users can view members of accessible spaces"
    ON public.space_members FOR SELECT
    USING (public.can_view_space(space_id));

CREATE POLICY "Space owners can insert space members"
    ON public.space_members FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.study_spaces s
        WHERE s.id = space_id AND s.owner_id = auth.uid()
    ));

CREATE POLICY "Space owners can update space members"
    ON public.space_members FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.study_spaces s
        WHERE s.id = space_id AND s.owner_id = auth.uid()
    ));

CREATE POLICY "Space owners can delete space members or members can leave"
    ON public.space_members FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.study_spaces s
            WHERE s.id = space_id AND s.owner_id = auth.uid()
        )
    );

-- 7.4 Desk Documents
DROP POLICY IF EXISTS "Users can manage items in accessible spaces" ON public.desk_documents;

CREATE POLICY "Users can view desk documents in accessible spaces"
    ON public.desk_documents FOR SELECT
    USING (public.can_view_space(space_id));

CREATE POLICY "Users can insert desk documents in editable spaces"
    ON public.desk_documents FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can update desk documents in editable spaces"
    ON public.desk_documents FOR UPDATE
    TO authenticated
    USING (public.can_edit_space(space_id))
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can delete desk documents in editable spaces"
    ON public.desk_documents FOR DELETE
    TO authenticated
    USING (public.can_edit_space(space_id));

-- 7.5 Document Pages
DROP POLICY IF EXISTS "Users can view document pages" ON public.document_pages;
DROP POLICY IF EXISTS "Users can manage document pages" ON public.document_pages;

CREATE POLICY "Users can view document pages in accessible spaces"
    ON public.document_pages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.desk_documents d
        WHERE d.id = document_id AND public.can_view_space(d.space_id)
    ));

CREATE POLICY "Users can insert document pages in editable spaces"
    ON public.document_pages FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.desk_documents d
        WHERE d.id = document_id AND public.can_edit_space(d.space_id)
    ));

CREATE POLICY "Users can update document pages in editable spaces"
    ON public.document_pages FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.desk_documents d
        WHERE d.id = document_id AND public.can_edit_space(d.space_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.desk_documents d
        WHERE d.id = document_id AND public.can_edit_space(d.space_id)
    ));

CREATE POLICY "Users can delete document pages in editable spaces"
    ON public.document_pages FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.desk_documents d
        WHERE d.id = document_id AND public.can_edit_space(d.space_id)
    ));

-- 7.6 Sticky Notes
DROP POLICY IF EXISTS "Users can manage sticky notes in accessible spaces" ON public.desk_sticky_notes;

CREATE POLICY "Users can view sticky notes in accessible spaces"
    ON public.desk_sticky_notes FOR SELECT
    USING (public.can_view_space(space_id));

CREATE POLICY "Users can insert sticky notes in editable spaces"
    ON public.desk_sticky_notes FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can update sticky notes in editable spaces"
    ON public.desk_sticky_notes FOR UPDATE
    TO authenticated
    USING (public.can_edit_space(space_id))
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can delete sticky notes in editable spaces"
    ON public.desk_sticky_notes FOR DELETE
    TO authenticated
    USING (public.can_edit_space(space_id));

-- 7.7 Desk Drawings
DROP POLICY IF EXISTS "Users can manage drawings in accessible spaces" ON public.desk_drawings;

CREATE POLICY "Users can view drawings in accessible spaces"
    ON public.desk_drawings FOR SELECT
    USING (public.can_view_space(space_id));

CREATE POLICY "Users can insert drawings in editable spaces"
    ON public.desk_drawings FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can update drawings in editable spaces"
    ON public.desk_drawings FOR UPDATE
    TO authenticated
    USING (public.can_edit_space(space_id))
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can delete drawings in editable spaces"
    ON public.desk_drawings FOR DELETE
    TO authenticated
    USING (public.can_edit_space(space_id));

-- 7.8 Inteline Threads
DROP POLICY IF EXISTS "Users can view threads in accessible spaces" ON public.inteline_threads;
DROP POLICY IF EXISTS "Users can manage threads in editable spaces" ON public.inteline_threads;

CREATE POLICY "Users can view threads in accessible spaces"
    ON public.inteline_threads FOR SELECT
    USING (public.can_view_space(space_id));

CREATE POLICY "Users can insert threads in editable spaces"
    ON public.inteline_threads FOR INSERT
    TO authenticated
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can update threads in editable spaces"
    ON public.inteline_threads FOR UPDATE
    TO authenticated
    USING (public.can_edit_space(space_id))
    WITH CHECK (public.can_edit_space(space_id));

CREATE POLICY "Users can delete threads in editable spaces"
    ON public.inteline_threads FOR DELETE
    TO authenticated
    USING (public.can_edit_space(space_id));

-- 7.9 ViToken Transactions (Client can only SELECT own transactions)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.vitoken_transactions;
CREATE POLICY "Users can view own transactions"
    ON public.vitoken_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 7.10 KnowInherit Listings & Purchases
DROP POLICY IF EXISTS "Anyone can view published listings or authors own" ON public.know_inherit_listings;
CREATE POLICY "Anyone can view published listings or authors own"
    ON public.know_inherit_listings FOR SELECT
    USING (status = 'published' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can insert own listings" ON public.know_inherit_listings;
CREATE POLICY "Authors can insert own listings"
    ON public.know_inherit_listings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own listings" ON public.know_inherit_listings;
CREATE POLICY "Authors can update own listings"
    ON public.know_inherit_listings FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can view relevant purchases" ON public.know_inherit_purchases;
CREATE POLICY "Users can view relevant purchases"
    ON public.know_inherit_purchases FOR SELECT
    TO authenticated
    USING (
        buyer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.know_inherit_listings l
            WHERE l.id = listing_id AND l.author_id = auth.uid()
        )
    );

COMMIT;
