-- ==============================================================================
-- Migration 0012: Clean legacy packages and keep 5 official ViToken tiers
-- ==============================================================================

BEGIN;

-- Xóa các gói thử nghiệm cũ
DELETE FROM public.vitoken_packages 
WHERE id IN ('demo', 'basic', 'standard', 'premium', 'vip');

-- Đảm bảo 5 gói chính thức có thứ tự chuẩn xác
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
