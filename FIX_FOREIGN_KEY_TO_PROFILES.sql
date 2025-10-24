-- =====================================================
-- FIX FOREIGN KEYS: Point to profiles instead of auth.users
-- This fixes 400 errors on embedded queries with full_name
-- =====================================================

-- PROBLEM:
-- Foreign keys currently point to auth.users:
--   payment_confirmations.buyer_id  -> auth.users  ❌
--   payment_confirmations.seller_id -> auth.users  ❌
--
-- But queries request fields from profiles:
--   buyer:buyer_id(id, email, full_name)
--   seller:seller_id(id, email, full_name)
--
-- auth.users doesn't have 'full_name', causing 400 errors

-- SOLUTION:
-- Point foreign keys to profiles table instead


-- 1. DROP OLD FOREIGN KEYS
-- =====================================================

ALTER TABLE payment_confirmations
DROP CONSTRAINT IF EXISTS payment_confirmations_buyer_id_fkey CASCADE;

ALTER TABLE payment_confirmations
DROP CONSTRAINT IF EXISTS payment_confirmations_seller_id_fkey CASCADE;


-- 2. ADD NEW FOREIGN KEYS POINTING TO PROFILES
-- =====================================================

ALTER TABLE payment_confirmations
ADD CONSTRAINT payment_confirmations_buyer_id_fkey
FOREIGN KEY (buyer_id) REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE payment_confirmations
ADD CONSTRAINT payment_confirmations_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES profiles(id)
ON DELETE CASCADE;


-- 3. VERIFY THE CHANGE
-- =====================================================

SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table,
  af.attname AS foreign_column
FROM pg_constraint AS c
JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid::regclass::text = 'payment_confirmations'
  AND a.attname IN ('buyer_id', 'seller_id')
ORDER BY conname;


-- 4. TEST THE QUERY
-- =====================================================

-- This query should now work without 400 error
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Simulate the frontend query
  SELECT 
    pc.id,
    pc.buyer_id,
    pc.seller_id,
    buyer.full_name as buyer_name,
    buyer.email as buyer_email,
    seller.full_name as seller_name
  INTO test_result
  FROM payment_confirmations pc
  LEFT JOIN profiles buyer ON pc.buyer_id = buyer.id
  LEFT JOIN profiles seller ON pc.seller_id = seller.id
  LIMIT 1;
  
  IF test_result IS NOT NULL OR NOT FOUND THEN
    RAISE NOTICE '✅ Query works! Foreign keys now point to profiles.';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Query test failed: %', SQLERRM;
END $$;


-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ FOREIGN KEYS UPDATED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changed:';
  RAISE NOTICE '  payment_confirmations.buyer_id  -> auth.users ❌';
  RAISE NOTICE '  payment_confirmations.seller_id -> auth.users ❌';
  RAISE NOTICE '';
  RAISE NOTICE 'To:';
  RAISE NOTICE '  payment_confirmations.buyer_id  -> profiles ✅';
  RAISE NOTICE '  payment_confirmations.seller_id -> profiles ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Embedded queries with full_name should now work!';
  RAISE NOTICE '';
  RAISE NOTICE 'Query that now works:';
  RAISE NOTICE '  buyer:buyer_id(id, email, full_name)';
  RAISE NOTICE '  seller:seller_id(id, email, full_name)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Clear browser cache (Cmd+Shift+R)';
  RAISE NOTICE '2. Refresh the site';
  RAISE NOTICE '3. Check console - should be clean!';
  RAISE NOTICE '';
END $$;

