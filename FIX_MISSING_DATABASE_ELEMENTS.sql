-- =====================================================
-- FIX MISSING DATABASE ELEMENTS
-- Run this in Supabase SQL Editor to fix 400/404 errors
-- =====================================================

-- 1. CREATE OR REPLACE increment_item_view_count FUNCTION
-- This fixes the 404 error for RPC calls
-- =====================================================

CREATE OR REPLACE FUNCTION increment_item_view_count(item_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the views_count for the item
  UPDATE items
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = item_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO anon;


-- 2. ENSURE views_count COLUMN EXISTS
-- This ensures the column is available for tracking
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


-- 3. FIX ADVERTISEMENTS TABLE (if missing columns)
-- This fixes 400 errors on advertisements queries
-- =====================================================

DO $$ 
BEGIN
  -- Add priority column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'advertisements' AND column_name = 'priority'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;

  -- Add placement column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'advertisements' AND column_name = 'placement'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN placement TEXT DEFAULT 'sidebar';
  END IF;

  -- Add status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'advertisements' AND column_name = 'status'
  ) THEN
    ALTER TABLE advertisements ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;


-- 4. FIX PAYMENT_CONFIRMATIONS TABLE
-- This fixes 400 errors on payment_confirmations queries
-- =====================================================

DO $$ 
BEGIN
  -- Ensure all required columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_confirmations' AND column_name = 'confirmation_deadline'
  ) THEN
    ALTER TABLE payment_confirmations ADD COLUMN confirmation_deadline TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_confirmations' AND column_name = 'payment_confirmed_at'
  ) THEN
    ALTER TABLE payment_confirmations ADD COLUMN payment_confirmed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_confirmations' AND column_name = 'status'
  ) THEN
    ALTER TABLE payment_confirmations ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;


-- 5. ENSURE RLS POLICIES ALLOW READS
-- This prevents 400 errors due to RLS restrictions
-- =====================================================

-- Allow authenticated users to read advertisements
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow authenticated users to read advertisements" ON advertisements;
  
  -- Create new policy
  CREATE POLICY "Allow authenticated users to read advertisements"
    ON advertisements
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Allow authenticated users to read payment confirmations (for sellers)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Sellers can view their payment confirmations" ON payment_confirmations;
  
  CREATE POLICY "Sellers can view their payment confirmations"
    ON payment_confirmations
    FOR SELECT
    TO authenticated
    USING (
      seller_id = auth.uid()
    );
END $$;


-- 6. ADD INDEXES FOR PERFORMANCE
-- Improve query performance on frequently accessed columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_items_views_count ON items(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_advertisements_placement ON advertisements(placement);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_deadline ON payment_confirmations(confirmation_deadline);


-- 7. VERIFY TABLES EXIST
-- Check if critical tables are present
-- =====================================================

DO $$ 
BEGIN
  -- Check if advertisements table exists
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'advertisements') THEN
    RAISE NOTICE 'WARNING: advertisements table does not exist. You may need to run the full schema migration.';
  END IF;

  -- Check if payment_confirmations table exists
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_confirmations') THEN
    RAISE NOTICE 'WARNING: payment_confirmations table does not exist. You may need to run the full schema migration.';
  END IF;
END $$;


-- =====================================================
-- VERIFICATION QUERIES
-- Run these separately to verify the fixes worked
-- =====================================================

-- Test increment_item_view_count function exists
SELECT proname, pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'increment_item_view_count';

-- Check items table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'items' AND column_name IN ('views_count', 'status', 'created_at');

-- Check advertisements table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'advertisements';

-- Check payment_confirmations table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_confirmations';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ DATABASE FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '1. ✅ increment_item_view_count() function created';
  RAISE NOTICE '2. ✅ views_count column added to items';
  RAISE NOTICE '3. ✅ advertisements columns verified/added';
  RAISE NOTICE '4. ✅ payment_confirmations columns verified/added';
  RAISE NOTICE '5. ✅ RLS policies updated';
  RAISE NOTICE '6. ✅ Performance indexes added';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All 400/404 errors should now be resolved!';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still see errors, please:';
  RAISE NOTICE '- Clear browser cache (Cmd+Shift+R)';
  RAISE NOTICE '- Check RLS is enabled on tables';
  RAISE NOTICE '- Verify user authentication';
END $$;

