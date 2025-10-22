-- Fix RLS policies for special_offers to ensure everyone can view active offers
-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view active offers" ON special_offers;
DROP POLICY IF EXISTS "Sellers can manage own offers" ON special_offers;

-- Recreate policies with proper permissions
-- Allow anyone (including anonymous users) to view active offers
CREATE POLICY "Anyone can view active special offers" ON special_offers
  FOR SELECT USING (is_active = true);

-- Allow sellers to view all their own offers (active or inactive)
CREATE POLICY "Sellers can view own special offers" ON special_offers
  FOR SELECT USING (auth.uid() = seller_id);

-- Allow sellers to insert their own offers
CREATE POLICY "Sellers can create special offers" ON special_offers
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Allow sellers to update their own offers
CREATE POLICY "Sellers can update own special offers" ON special_offers
  FOR UPDATE USING (auth.uid() = seller_id);

-- Allow sellers to delete their own offers
CREATE POLICY "Sellers can delete own special offers" ON special_offers
  FOR DELETE USING (auth.uid() = seller_id);

