-- Enable RLS on bundles table
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on bundle_items table  
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bundles table

-- Users can view all active bundles
CREATE POLICY "Anyone can view active bundles" ON bundles
  FOR SELECT USING (status = 'active');

-- Sellers can view their own bundles (including inactive ones)
CREATE POLICY "Sellers can view their own bundles" ON bundles
  FOR SELECT USING (seller_id = auth.uid());

-- Sellers can insert their own bundles
CREATE POLICY "Sellers can create bundles" ON bundles
  FOR INSERT WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own bundles
CREATE POLICY "Sellers can update their own bundles" ON bundles
  FOR UPDATE USING (seller_id = auth.uid());

-- Sellers can delete their own bundles
CREATE POLICY "Sellers can delete their own bundles" ON bundles
  FOR DELETE USING (seller_id = auth.uid());

-- RLS Policies for bundle_items table

-- Users can view bundle items for active bundles
CREATE POLICY "Anyone can view bundle items for active bundles" ON bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_items.bundle_id 
      AND bundles.status = 'active'
    )
  );

-- Sellers can view bundle items for their own bundles
CREATE POLICY "Sellers can view their own bundle items" ON bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_items.bundle_id 
      AND bundles.seller_id = auth.uid()
    )
  );

-- Sellers can insert bundle items for their own bundles
CREATE POLICY "Sellers can create bundle items for their bundles" ON bundle_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_items.bundle_id 
      AND bundles.seller_id = auth.uid()
    )
  );

-- Sellers can update bundle items for their own bundles
CREATE POLICY "Sellers can update their own bundle items" ON bundle_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_items.bundle_id 
      AND bundles.seller_id = auth.uid()
    )
  );

-- Sellers can delete bundle items for their own bundles
CREATE POLICY "Sellers can delete their own bundle items" ON bundle_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bundles 
      WHERE bundles.id = bundle_items.bundle_id 
      AND bundles.seller_id = auth.uid()
    )
  );

-- Add comments to explain the policies
COMMENT ON TABLE bundles IS 'Bundles table with RLS enabled - users can view active bundles, sellers can manage their own bundles';
COMMENT ON TABLE bundle_items IS 'Bundle items junction table with RLS enabled - users can view items in active bundles, sellers can manage their own bundle items';
