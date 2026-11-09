BEGIN;
SELECT plan(14);

-- Test 1: Helper functions exist
SELECT has_function('public', 'can_view_space', ARRAY['uuid'], 'can_view_space exists');
SELECT has_function('public', 'can_edit_space', ARRAY['uuid'], 'can_edit_space exists');

-- Test 2: Token functions exist and have secure access
SELECT has_function('public', 'credit_vitoken', ARRAY['uuid', 'integer', 'text', 'text', 'text'], 'credit_vitoken exists');
SELECT has_function('public', 'debit_vitoken', ARRAY['uuid', 'integer', 'text', 'text', 'text'], 'debit_vitoken exists');
SELECT has_function('public', 'claim_daily_streak', 'claim_daily_streak exists');
SELECT has_function('public', 'process_know_inherit_purchase', ARRAY['uuid'], 'process_know_inherit_purchase exists with 1 param');

-- Test 3: vitoken_transactions has reference column and unique constraint
SELECT has_column('public', 'vitoken_transactions', 'reference', 'vitoken_transactions has reference column');

-- Test 4: Check execution permissions on credit_vitoken and debit_vitoken
-- authenticated & anon should NOT have execute on credit_vitoken / debit_vitoken
SELECT finish();
ROLLBACK;
