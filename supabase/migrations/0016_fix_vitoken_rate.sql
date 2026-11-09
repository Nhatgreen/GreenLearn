-- ==============================================================================
-- Migration 0016: Correct ViToken Conversion Rate (1.000 VND = 1 ViToken)
-- ==============================================================================

BEGIN;

UPDATE public.vitoken_packages SET token_amount = 2 WHERE id = 'starter';
UPDATE public.vitoken_packages SET token_amount = 10 WHERE id = 'midterm';
UPDATE public.vitoken_packages SET token_amount = 30 WHERE id = 'semester';
UPDATE public.vitoken_packages SET token_amount = 100 WHERE id = 'project';
UPDATE public.vitoken_packages SET token_amount = 300 WHERE id = 'team';

COMMIT;
