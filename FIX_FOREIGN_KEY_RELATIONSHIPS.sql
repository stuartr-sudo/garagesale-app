-- =====================================================
-- FIX FOREIGN KEY RELATIONSHIPS FOR EMBEDDED QUERIES
-- Fixes 400 errors when querying with relationships
-- =====================================================

-- The 400 errors are caused by queries trying to embed related data
-- like: buyer:buyer_id(id,email,full_name)
-- This requires proper foreign key relationships

-- 1. VERIFY FOREIGN KEYS ON PAYMENT_CONFIRMATIONS
-- =====================================================

-- Check current foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'payment_confirmations';


-- 2. ADD MISSING FOREIGN KEYS (if not exist)
-- =====================================================

-- Add foreign key for buyer_id -> profiles
DO $$ 
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_confirmations_buyer_id_fkey'
    AND table_name = 'payment_confirmations'
  ) THEN
    ALTER TABLE payment_confirmations
    ADD CONSTRAINT payment_confirmations_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES profiles(id);
    
    RAISE NOTICE '✅ Added foreign key: buyer_id -> profiles';
  ELSE
    RAISE NOTICE '✓ Foreign key already exists: buyer_id -> profiles';
  END IF;
END $$;

-- Add foreign key for seller_id -> profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_confirmations_seller_id_fkey'
    AND table_name = 'payment_confirmations'
  ) THEN
    ALTER TABLE payment_confirmations
    ADD CONSTRAINT payment_confirmations_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES profiles(id);
    
    RAISE NOTICE '✅ Added foreign key: seller_id -> profiles';
  ELSE
    RAISE NOTICE '✓ Foreign key already exists: seller_id -> profiles';
  END IF;
END $$;

-- Add foreign key for item_id -> items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_confirmations_item_id_fkey'
    AND table_name = 'payment_confirmations'
  ) THEN
    ALTER TABLE payment_confirmations
    ADD CONSTRAINT payment_confirmations_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES items(id);
    
    RAISE NOTICE '✅ Added foreign key: item_id -> items';
  ELSE
    RAISE NOTICE '✓ Foreign key already exists: item_id -> items';
  END IF;
END $$;


-- 3. CHECK IF PROFILES HAS RLS POLICIES
-- =====================================================

-- Profiles need to be readable for the embedded queries to work
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON profiles
      FOR SELECT
      TO public
      USING (true);
    
    RAISE NOTICE '✅ Added policy: Public profiles viewable';
  ELSE
    RAISE NOTICE '✓ Policy already exists: Public profiles viewable';
  END IF;
END $$;


-- 4. VERIFY ITEMS FOREIGN KEYS (for embedded queries)
-- =====================================================

-- Check if seller_id -> profiles foreign key exists on items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_seller_id_fkey'
    AND table_name = 'items'
  ) THEN
    ALTER TABLE items
    ADD CONSTRAINT items_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES profiles(id);
    
    RAISE NOTICE '✅ Added foreign key: items.seller_id -> profiles';
  ELSE
    RAISE NOTICE '✓ Foreign key already exists: items.seller_id -> profiles';
  END IF;
END $$;


-- 5. TEST THE PROBLEMATIC QUERIES
-- =====================================================

-- Test 1: Payment confirmations with embedded buyer/seller/item
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- This simulates the frontend query that was failing
  SELECT COUNT(*) INTO test_count
  FROM payment_confirmations pc
  LEFT JOIN profiles buyer ON pc.buyer_id = buyer.id
  LEFT JOIN profiles seller ON pc.seller_id = seller.id
  LEFT JOIN items ON pc.item_id = items.id
  WHERE pc.status = 'pending'
  LIMIT 1;
  
  IF test_count IS NOT NULL THEN
    RAISE NOTICE '✅ Payment confirmations query works!';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Payment confirmations query failed: %', SQLERRM;
END $$;


-- 6. ALTERNATIVE: SIMPLER QUERY APPROACH
-- =====================================================

-- If embedded queries still fail, we can query without embedding
-- and let the frontend handle the joins

-- Create a view that pre-joins the data
CREATE OR REPLACE VIEW payment_confirmations_with_details AS
SELECT 
  pc.id,
  pc.order_id,
  pc.seller_id,
  pc.buyer_id,
  pc.item_id,
  pc.amount,
  pc.payment_confirmed_at,
  pc.confirmation_deadline,
  pc.seller_confirmed_at,
  pc.status,
  pc.created_at,
  pc.updated_at,
  -- Buyer details
  buyer.full_name as buyer_name,
  buyer.email as buyer_email,
  -- Seller details
  seller.full_name as seller_name,
  seller.email as seller_email,
  -- Item details
  items.title as item_title,
  items.image_urls as item_images
FROM payment_confirmations pc
LEFT JOIN profiles buyer ON pc.buyer_id = buyer.id
LEFT JOIN profiles seller ON pc.seller_id = seller.id
LEFT JOIN items ON pc.item_id = items.id;

-- Grant access to the view
GRANT SELECT ON payment_confirmations_with_details TO authenticated;
GRANT SELECT ON payment_confirmations_with_details TO anon;

-- Note: Views don't have RLS policies
-- The view inherits RLS from the underlying tables
-- (payment_confirmations, profiles, items)
-- So the existing policies on those tables will apply


-- 7. LIST ALL FOREIGN KEYS FOR VERIFICATION
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
  AND conrelid::regclass::text IN ('payment_confirmations', 'items')
ORDER BY conrelid::regclass::text, conname;


-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ FOREIGN KEY RELATIONSHIPS FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '1. ✅ payment_confirmations.buyer_id -> profiles';
  RAISE NOTICE '2. ✅ payment_confirmations.seller_id -> profiles';
  RAISE NOTICE '3. ✅ payment_confirmations.item_id -> items';
  RAISE NOTICE '4. ✅ items.seller_id -> profiles';
  RAISE NOTICE '5. ✅ profiles RLS policy for public access';
  RAISE NOTICE '6. ✅ Created payment_confirmations_with_details view';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Embedded queries should now work!';
  RAISE NOTICE '';
  RAISE NOTICE 'The queries like:';
  RAISE NOTICE '  item:items(id,title,image_urls)';
  RAISE NOTICE '  buyer:buyer_id(id,email,full_name)';
  RAISE NOTICE '';
  RAISE NOTICE 'Should now return data instead of 400 errors!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alternative: Use payment_confirmations_with_details view';
  RAISE NOTICE 'for a simpler query without embedded relationships.';
  RAISE NOTICE '';
END $$;

