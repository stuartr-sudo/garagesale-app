-- =====================================================
-- FIX RLS POLICIES FOR 400 ERRORS
-- Run this to fix access issues on existing tables
-- =====================================================

-- Since tables exist with correct columns, the 400 errors
-- are likely due to RLS policies blocking access

-- 1. PAYMENT CONFIRMATIONS RLS POLICIES
-- =====================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Sellers can view their payment confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Buyers can view their payment confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Users can view their own payment confirmations" ON payment_confirmations;
DROP POLICY IF EXISTS "Allow sellers to read payment confirmations" ON payment_confirmations;

-- Create comprehensive read policy
CREATE POLICY "Users can view their payment confirmations"
  ON payment_confirmations
  FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid() OR buyer_id = auth.uid()
  );

-- Create policy for sellers to update (confirm payment received)
DROP POLICY IF EXISTS "Sellers can update their payment confirmations" ON payment_confirmations;
CREATE POLICY "Sellers can update their payment confirmations"
  ON payment_confirmations
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());


-- 2. ADVERTISEMENTS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read advertisements" ON advertisements;
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON advertisements;
DROP POLICY IF EXISTS "Public can view active ads" ON advertisements;

-- Create policy for all users (including anonymous) to view active ads
CREATE POLICY "Anyone can view active advertisements"
  ON advertisements
  FOR SELECT
  TO public
  USING (status = 'active');

-- Allow authenticated users to view all advertisements
CREATE POLICY "Authenticated users can view all advertisements"
  ON advertisements
  FOR SELECT
  TO authenticated
  USING (true);


-- 3. ITEMS TABLE RLS POLICIES
-- =====================================================

-- Ensure authenticated users can read all active items
DROP POLICY IF EXISTS "Allow authenticated users to read items" ON items;
DROP POLICY IF EXISTS "Anyone can view active items" ON items;

-- Create policy for viewing active items
CREATE POLICY "Anyone can view active items"
  ON items
  FOR SELECT
  TO public
  USING (status = 'active');

-- Allow users to view their own items (any status)
DROP POLICY IF EXISTS "Users can view their own items" ON items;
CREATE POLICY "Users can view their own items"
  ON items
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());


-- 4. CREATE increment_item_view_count FUNCTION (if missing)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_item_view_count(item_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE items
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = item_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO anon;


-- 5. ENSURE views_count COLUMN EXISTS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE items ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
END $$;


-- 6. VERIFY RLS IS ENABLED
-- =====================================================

-- Check RLS status
DO $$ 
DECLARE
  tbl_name TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOR tbl_name IN 
    SELECT unnest(ARRAY['items', 'payment_confirmations', 'advertisements'])
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = tbl_name;
    
    IF rls_enabled IS NULL THEN
      RAISE NOTICE 'Table % does not exist', tbl_name;
    ELSIF rls_enabled THEN
      RAISE NOTICE '✅ RLS is enabled on %', tbl_name;
    ELSE
      RAISE NOTICE '⚠️  RLS is DISABLED on % - enabling now', tbl_name;
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl_name);
    END IF;
  END LOOP;
END $$;


-- 7. LIST ALL POLICIES (for verification)
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('items', 'payment_confirmations', 'advertisements')
ORDER BY tablename, policyname;


-- 8. TEST QUERIES (run these separately to verify)
-- =====================================================

-- Test payment_confirmations query
-- This should work now without 400 error
-- SELECT id, order_id, amount, status, confirmation_deadline
-- FROM payment_confirmations
-- WHERE seller_id = auth.uid() AND status = 'pending'
-- ORDER BY confirmation_deadline ASC;

-- Test advertisements query
-- This should work now without 400 error
-- SELECT * FROM advertisements
-- WHERE placement = 'top_banner' AND status = 'active'
-- ORDER BY priority DESC;

-- Test items query with views_count
-- This should work now without 400 error
-- SELECT * FROM items
-- WHERE status = 'active'
-- ORDER BY views_count DESC
-- LIMIT 6;


-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS POLICIES FIXED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '1. ✅ Payment confirmations - sellers and buyers can view';
  RAISE NOTICE '2. ✅ Advertisements - public can view active ads';
  RAISE NOTICE '3. ✅ Items - public can view active items';
  RAISE NOTICE '4. ✅ increment_item_view_count() function created';
  RAISE NOTICE '5. ✅ views_count column verified/added';
  RAISE NOTICE '6. ✅ RLS enabled on all tables';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All 400 errors should now be resolved!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Clear browser cache (Cmd+Shift+R)';
  RAISE NOTICE '2. Hard refresh the site';
  RAISE NOTICE '3. Check console for clean output';
  RAISE NOTICE '';
END $$;

