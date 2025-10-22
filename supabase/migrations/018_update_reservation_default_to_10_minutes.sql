-- Update reservation default from 5 to 10 minutes
-- This ensures all reservation types default to 10 minutes

-- Drop and recreate the reserve_item function with updated default
DROP FUNCTION IF EXISTS reserve_item(UUID, UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION reserve_item(
  p_item_id UUID,
  p_user_id UUID,
  p_reservation_type TEXT,
  p_duration_minutes INTEGER DEFAULT 10  -- Changed from 5 to 10
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

COMMENT ON FUNCTION reserve_item IS 'Creates a temporary reservation for an item (default 10 minutes)';

