-- Migration to support negotiated/agent rates in cart
-- Adds fields to track different price sources and negotiated prices

-- Add negotiated_price and price_source to cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS negotiated_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_source TEXT DEFAULT 'original' 
  CHECK (price_source IN ('original', 'negotiated', 'agent'));

-- Add index for price_source queries
CREATE INDEX IF NOT EXISTS idx_cart_items_price_source 
  ON cart_items(price_source);

-- Add comments for documentation
COMMENT ON COLUMN cart_items.negotiated_price IS 
  'Custom negotiated price from AI agent or direct negotiation. NULL means use item.price';

COMMENT ON COLUMN cart_items.price_source IS 
  'Source of the price: original (list price), negotiated (AI agent), agent (custom rate)';

-- Also add to transactions table for historical tracking
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS negotiated_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_source TEXT DEFAULT 'original'
  CHECK (price_source IN ('original', 'negotiated', 'agent'));

COMMENT ON COLUMN transactions.negotiated_price IS 
  'Final negotiated price if different from listing price';

COMMENT ON COLUMN transactions.price_source IS 
  'Indicates if transaction used original, negotiated, or agent pricing';

-- Function to get the effective price for a cart item
CREATE OR REPLACE FUNCTION get_cart_item_price(
  p_cart_item_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_price DECIMAL(10,2);
  v_negotiated_price DECIMAL(10,2);
  v_item_price DECIMAL(10,2);
BEGIN
  -- Get cart item details
  SELECT ci.negotiated_price, i.price
  INTO v_negotiated_price, v_item_price
  FROM cart_items ci
  JOIN items i ON ci.item_id = i.id
  WHERE ci.id = p_cart_item_id;
  
  -- Return negotiated price if set, otherwise item price
  IF v_negotiated_price IS NOT NULL THEN
    RETURN v_negotiated_price;
  ELSE
    RETURN v_item_price;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate cart total with proper price source handling
CREATE OR REPLACE FUNCTION calculate_cart_total_v2(
  p_buyer_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_subtotal DECIMAL(10,2) := 0;
  v_discount DECIMAL(10,2) := 0;
  v_total DECIMAL(10,2) := 0;
  v_item_count INTEGER := 0;
  cart_item RECORD;
BEGIN
  -- Calculate subtotal using effective prices
  FOR cart_item IN 
    SELECT 
      ci.id,
      ci.quantity,
      ci.price_source,
      COALESCE(ci.negotiated_price, i.price) as effective_price,
      i.price as original_price,
      i.id as item_id
    FROM cart_items ci
    JOIN items i ON ci.item_id = i.id
    WHERE ci.buyer_id = p_buyer_id
  LOOP
    v_item_count := v_item_count + 1;
    v_subtotal := v_subtotal + (cart_item.effective_price * cart_item.quantity);
    
    -- Only apply discounts to items with 'original' price_source
    IF cart_item.price_source = 'original' THEN
      -- Discount logic would be calculated here
      -- For now, we're just tracking which items are eligible
      NULL;
    END IF;
  END LOOP;
  
  v_total := v_subtotal - v_discount;
  
  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'item_count', v_item_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow users to update their cart item prices
-- (This allows the AI agent to set negotiated prices)
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE 
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

