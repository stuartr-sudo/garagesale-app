-- Shopping Cart and Bulk Buy Features
-- Migration to add shopping cart, bulk discounts, and BOGO offers

-- 1. Shopping Cart Table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, item_id)
);

-- 2. Special Offers Table (BOGO, Bulk Discounts, etc.)
CREATE TABLE IF NOT EXISTS special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('bogo', 'bulk_discount', 'percentage_off', 'bundle')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Offer configuration (JSON for flexibility)
  config JSONB NOT NULL DEFAULT '{}',
  -- Example configs:
  -- BOGO: {"buy_quantity": 1, "get_quantity": 1, "discount_percent": 100}
  -- Bulk: {"min_quantity": 3, "discount_percent": 10}
  -- Bundle: {"item_ids": ["uuid1", "uuid2"], "bundle_price": 100}
  
  item_ids UUID[] NOT NULL, -- Items included in the offer
  
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhanced Transactions Table for Bulk Purchases
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS items_purchased JSONB DEFAULT '[]';
-- Format: [{"item_id": "uuid", "quantity": 1, "price": 100, "discount": 10}]

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS special_offer_id UUID REFERENCES special_offers(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'confirmed', 'failed'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_buyer ON cart_items(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_item ON cart_items(item_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_seller ON special_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_active ON special_offers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);

-- 5. Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Cart items: Users can only see their own
CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can add to own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Users can delete from own cart" ON cart_items
  FOR DELETE USING (auth.uid() = buyer_id);

-- Special offers: Everyone can view active offers
CREATE POLICY "Everyone can view active offers" ON special_offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage own offers" ON special_offers
  FOR ALL USING (auth.uid() = seller_id);

-- 6. Function to calculate cart total with discounts
CREATE OR REPLACE FUNCTION calculate_cart_total(cart_buyer_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  subtotal DECIMAL(10,2);
  discount DECIMAL(10,2);
  total DECIMAL(10,2);
  cart_items_data JSONB;
BEGIN
  -- Get all cart items with item details
  SELECT 
    COALESCE(SUM(i.price * ci.quantity), 0),
    jsonb_agg(
      jsonb_build_object(
        'item_id', i.id,
        'title', i.title,
        'price', i.price,
        'quantity', ci.quantity,
        'subtotal', i.price * ci.quantity
      )
    )
  INTO subtotal, cart_items_data
  FROM cart_items ci
  JOIN items i ON ci.item_id = i.id
  WHERE ci.buyer_id = cart_buyer_id;
  
  -- TODO: Apply special offers logic here
  discount := 0;
  total := subtotal - discount;
  
  result := jsonb_build_object(
    'subtotal', subtotal,
    'discount', discount,
    'total', total,
    'items', COALESCE(cart_items_data, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

