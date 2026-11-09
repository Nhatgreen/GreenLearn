-- ==============================================================================
-- Migration 0011: Synchronize ViToken Packages with Frontend IDs
-- ==============================================================================

BEGIN;

INSERT INTO public.vitoken_packages (id, label, token_amount, price_vnd, sort, enabled)
VALUES
    ('starter', 'Khởi đầu', 2000, 2000, 1, true),
    ('midterm', 'Ôn giữa kỳ', 10000, 10000, 2, true),
    ('semester', 'Học kỳ', 30000, 27000, 3, true),
    ('project', 'Đồ án', 100000, 85000, 4, true),
    ('team', 'Nhóm học', 300000, 255000, 5, true)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    token_amount = EXCLUDED.token_amount,
    price_vnd = EXCLUDED.price_vnd,
    sort = EXCLUDED.sort,
    enabled = EXCLUDED.enabled;

COMMIT;
