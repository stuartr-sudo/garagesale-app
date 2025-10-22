-- Item Reservations System
-- Migration to prevent duplicate sales by temporarily reserving items

-- 1. Item Reservations Table
CREATE TABLE IF NOT EXISTS item_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('cart', 'buy_now')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id) -- Only one reservation per item at a time
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_reservations_item_id ON item_reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reservations_user_id ON item_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_item_reservations_expires_at ON item_reservations(expires_at);

-- 3. Row Level Security
ALTER TABLE item_reservations ENABLE ROW LEVEL SECURITY;

-- Users can view reservations for items they're interested in
CREATE POLICY "Users can view item reservations" ON item_reservations
  FOR SELECT USING (true);

-- Users can create reservations for themselves
CREATE POLICY "Users can create reservations" ON item_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reservations
CREATE POLICY "Users can delete own reservations" ON item_reservations
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Function to clean up expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM item_reservations 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Function to create or update reservation
CREATE OR REPLACE FUNCTION reserve_item(
  p_item_id UUID,
  p_user_id UUID,
  p_reservation_type TEXT,
  p_duration_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_reservation UUID;
  expiration_time TIMESTAMPTZ;
BEGIN
  -- Calculate expiration time
  expiration_time := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check if item is already reserved
  SELECT id INTO existing_reservation
  FROM item_reservations
  WHERE item_id = p_item_id
    AND expires_at > NOW();
  
  -- If already reserved, return false
  IF existing_reservation IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Create new reservation
  INSERT INTO item_reservations (item_id, user_id, reservation_type, expires_at)
  VALUES (p_item_id, p_user_id, p_reservation_type, expiration_time)
  ON CONFLICT (item_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    reservation_type = EXCLUDED.reservation_type,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to check if item is available for reservation
CREATE OR REPLACE FUNCTION is_item_available_for_reservation(p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  reservation_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM item_reservations 
    WHERE item_id = p_item_id 
      AND expires_at > NOW()
  ) INTO reservation_exists;
  
  RETURN NOT reservation_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get reservation info for an item
CREATE OR REPLACE FUNCTION get_item_reservation(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'is_reserved', TRUE,
    'reserved_until', expires_at,
    'reserved_by_current_user', (user_id = auth.uid()),
    'reservation_type', reservation_type
  ) INTO result
  FROM item_reservations
  WHERE item_id = p_item_id
    AND expires_at > NOW();
  
  RETURN COALESCE(result, jsonb_build_object('is_reserved', FALSE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Comment
COMMENT ON TABLE item_reservations IS 'Tracks temporary reservations of items to prevent duplicate sales';
COMMENT ON FUNCTION reserve_item IS 'Creates a temporary reservation for an item';
COMMENT ON FUNCTION is_item_available_for_reservation IS 'Checks if an item is available for reservation';
COMMENT ON FUNCTION get_item_reservation IS 'Gets reservation information for an item';
COMMENT ON FUNCTION cleanup_expired_reservations IS 'Removes expired reservations';
