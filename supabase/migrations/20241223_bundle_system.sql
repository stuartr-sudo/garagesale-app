-- Bundle System Migration
-- This adds support for bundling multiple items together

-- Step 1: Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_price DECIMAL(10,2) NOT NULL,
  individual_total DECIMAL(10,2) NOT NULL, -- Sum of individual item prices
  savings DECIMAL(10,2) NOT NULL, -- bundle_price - individual_total
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  collection_date TIMESTAMP WITH TIME ZONE,
  collection_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create bundle_items junction table
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, item_id)
);

-- Step 3: Update transactions table for bundles
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES bundles(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'single';

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bundles_seller_id ON bundles(seller_id);
CREATE INDEX IF NOT EXISTS idx_bundles_status ON bundles(status);
CREATE INDEX IF NOT EXISTS idx_bundles_created_at ON bundles(created_at);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_item_id ON bundle_items(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bundle_id ON transactions(bundle_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);

-- Step 5: Add comments for documentation
COMMENT ON TABLE bundles IS 'Bundles of items sold together at a discounted price';
COMMENT ON TABLE bundle_items IS 'Junction table linking bundles to their constituent items';
COMMENT ON COLUMN bundles.bundle_price IS 'Total price for the entire bundle';
COMMENT ON COLUMN bundles.individual_total IS 'Sum of individual item prices (before bundle discount)';
COMMENT ON COLUMN bundles.savings IS 'Amount saved by buying the bundle vs individual items';
COMMENT ON COLUMN bundle_items.quantity IS 'Quantity of this item in the bundle';
COMMENT ON COLUMN transactions.bundle_id IS 'Reference to bundle if this is a bundle transaction';
COMMENT ON COLUMN transactions.transaction_type IS 'Type of transaction: single item or bundle';

-- Step 6: Create function to update bundle totals when items are added/removed
CREATE OR REPLACE FUNCTION update_bundle_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update bundle totals when bundle_items changes
  UPDATE bundles 
  SET 
    individual_total = (
      SELECT COALESCE(SUM(i.price * bi.quantity), 0)
      FROM bundle_items bi
      JOIN items i ON bi.item_id = i.id
      WHERE bi.bundle_id = COALESCE(NEW.bundle_id, OLD.bundle_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.bundle_id, OLD.bundle_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update bundle totals
DROP TRIGGER IF EXISTS trigger_update_bundle_totals ON bundle_items;
CREATE TRIGGER trigger_update_bundle_totals
  AFTER INSERT OR UPDATE OR DELETE ON bundle_items
  FOR EACH ROW
  EXECUTE FUNCTION update_bundle_totals();

-- Step 8: Create function to mark items as sold when bundle is sold
CREATE OR REPLACE FUNCTION mark_bundle_items_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- When a bundle transaction is completed, mark all items in the bundle as sold
  IF NEW.transaction_type = 'bundle' AND NEW.payment_status = 'completed' THEN
    UPDATE items 
    SET status = 'sold'
    WHERE id IN (
      SELECT item_id 
      FROM bundle_items 
      WHERE bundle_id = NEW.bundle_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to mark bundle items as sold
DROP TRIGGER IF EXISTS trigger_mark_bundle_items_sold ON transactions;
CREATE TRIGGER trigger_mark_bundle_items_sold
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed' AND NEW.transaction_type = 'bundle')
  EXECUTE FUNCTION mark_bundle_items_sold();
