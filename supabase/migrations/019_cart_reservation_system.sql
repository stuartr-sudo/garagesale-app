-- ============================================
-- CART RESERVATION SYSTEM - CRITICAL FIX
-- ============================================
-- This migration adds comprehensive protection against double-selling
-- by implementing item reservations, sold status tracking, and race condition prevention

-- ============================================
-- ADD RESERVATION FIELDS TO CART_ITEMS TABLE
-- ============================================
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reservation_status TEXT DEFAULT 'active' CHECK (reservation_status IN ('active', 'expired', 'purchased'));

-- ============================================
-- ADD SOLD FIELDS TO ITEMS TABLE
-- ============================================
ALTER TABLE items
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- ============================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_items_reserved_until ON cart_items(reserved_until);
CREATE INDEX IF NOT EXISTS idx_items_is_sold ON items(is_sold);
CREATE INDEX IF NOT EXISTS idx_cart_items_reservation_status ON cart_items(reservation_status);

-- ============================================
-- FUNCTION: Auto-expire reservations
-- ============================================
CREATE OR REPLACE FUNCTION expire_cart_reservations()
RETURNS void AS $$
BEGIN
  UPDATE cart_items
  SET reservation_status = 'expired'
  WHERE reservation_status = 'active'
    AND reserved_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Check item availability before checkout
-- ============================================
CREATE OR REPLACE FUNCTION check_item_availability(
  p_item_id UUID,
  p_buyer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_sold BOOLEAN;
  v_has_active_reservation BOOLEAN;
BEGIN
  -- Check if item is sold
  SELECT is_sold INTO v_is_sold
  FROM items
  WHERE id = p_item_id;
  
  IF v_is_sold THEN
    RETURN FALSE;
  END IF;
  
  -- Check if someone else has an active reservation
  SELECT EXISTS(
    SELECT 1 FROM cart_items
    WHERE item_id = p_item_id
      AND buyer_id != p_buyer_id
      AND reservation_status = 'active'
      AND reserved_until > NOW()
  ) INTO v_has_active_reservation;
  
  RETURN NOT v_has_active_reservation;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark item as sold (for checkout completion)
-- ============================================
CREATE OR REPLACE FUNCTION mark_item_sold(
  p_item_id UUID,
  p_buyer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Mark item as sold
  UPDATE items
  SET is_sold = TRUE,
      sold_at = NOW(),
      buyer_id = p_buyer_id
  WHERE id = p_item_id
    AND is_sold = FALSE;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Mark all cart reservations for this item as purchased
  UPDATE cart_items
  SET reservation_status = 'purchased'
  WHERE item_id = p_item_id
    AND reservation_status = 'active';
  
  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Clean up expired reservations (for maintenance)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items
  WHERE reservation_status = 'expired'
    AND reserved_until < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-expire reservations on cart_items updates
-- ============================================
CREATE OR REPLACE FUNCTION trigger_expire_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Expire old reservations when new ones are added
  PERFORM expire_cart_reservations();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_reservations
  AFTER INSERT OR UPDATE ON cart_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_expire_reservations();

-- ============================================
-- RLS POLICIES FOR RESERVATION SYSTEM
-- ============================================

-- Users can only see their own cart items
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = buyer_id);

-- Users can only insert their own cart items
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Users can only update their own cart items
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Users can only delete their own cart items
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = buyer_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN cart_items.reserved_until IS 'Timestamp when the reservation expires (typically 10 minutes from creation)';
COMMENT ON COLUMN cart_items.reservation_status IS 'Status of the reservation: active, expired, or purchased';
COMMENT ON COLUMN items.is_sold IS 'Whether the item has been sold';
COMMENT ON COLUMN items.sold_at IS 'Timestamp when the item was sold';
COMMENT ON COLUMN items.buyer_id IS 'ID of the user who purchased the item';

COMMENT ON FUNCTION expire_cart_reservations() IS 'Marks expired reservations as expired';
COMMENT ON FUNCTION check_item_availability(UUID, UUID) IS 'Checks if an item is available for purchase by a specific buyer';
COMMENT ON FUNCTION mark_item_sold(UUID, UUID) IS 'Marks an item as sold and updates all related cart reservations';
COMMENT ON FUNCTION cleanup_expired_reservations() IS 'Removes old expired reservations from the database';
