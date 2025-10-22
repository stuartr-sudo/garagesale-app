-- ============================================
-- PAYMENT CONFIRMATION SYSTEM
-- ============================================

-- Add payment confirmation fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmation_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS seller_confirmation_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seller_confirmed_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmation_timezone TEXT DEFAULT 'Australia/Sydney';

-- Add account restriction fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_restricted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restriction_reason TEXT,
ADD COLUMN IF NOT EXISTS restriction_applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Australia/Sydney';

-- Create payment confirmations table for tracking
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_confirmed_at TIMESTAMPTZ NOT NULL,
  confirmation_deadline TIMESTAMPTZ NOT NULL,
  seller_confirmed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support requests table
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  item_name TEXT,
  issue_description TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_seller_id ON payment_confirmations(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_deadline ON payment_confirmations(confirmation_deadline);
CREATE INDEX IF NOT EXISTS idx_orders_seller_confirmation_required ON orders(seller_confirmation_required);
CREATE INDEX IF NOT EXISTS idx_profiles_account_restricted ON profiles(account_restricted);
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);

-- Function: Calculate confirmation deadline based on timezone and business hours
CREATE OR REPLACE FUNCTION calculate_confirmation_deadline(
  notification_time TIMESTAMPTZ,
  user_timezone TEXT DEFAULT 'Australia/Sydney'
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  local_time TIMESTAMPTZ;
  business_hours_start INTEGER := 8;  -- 8:00 AM
  business_hours_end INTEGER := 22;  -- 10:00 PM
  local_hour INTEGER;
  deadline TIMESTAMPTZ;
BEGIN
  -- Convert notification time to user's timezone
  local_time := notification_time AT TIME ZONE user_timezone;
  local_hour := EXTRACT(HOUR FROM local_time);
  
  -- Check if within business hours (8 AM - 10 PM)
  IF local_hour >= business_hours_start AND local_hour < business_hours_end THEN
    -- Business hours: 12 hours from notification
    deadline := notification_time + INTERVAL '12 hours';
  ELSE
    -- Outside business hours: 24 hours from notification
    deadline := notification_time + INTERVAL '24 hours';
  END IF;
  
  RETURN deadline;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and apply account restrictions
CREATE OR REPLACE FUNCTION check_payment_confirmation_deadlines()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  seller_record RECORD;
BEGIN
  -- Find all expired confirmations
  FOR seller_record IN 
    SELECT DISTINCT pc.seller_id, p.timezone
    FROM payment_confirmations pc
    JOIN profiles p ON pc.seller_id = p.id
    WHERE pc.status = 'pending' 
      AND pc.confirmation_deadline < NOW()
  LOOP
    -- Apply restrictions to seller
    UPDATE profiles 
    SET 
      account_restricted = TRUE,
      restriction_reason = 'Payment confirmation deadline exceeded',
      restriction_applied_at = NOW()
    WHERE id = seller_record.seller_id;
    
    -- Mark confirmations as expired
    UPDATE payment_confirmations 
    SET status = 'expired'
    WHERE seller_id = seller_record.seller_id 
      AND status = 'pending' 
      AND confirmation_deadline < NOW();
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Remove account restrictions when all payments confirmed
CREATE OR REPLACE FUNCTION remove_account_restrictions_if_all_confirmed(
  p_seller_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Check if seller has any pending confirmations
  SELECT COUNT(*) INTO pending_count
  FROM payment_confirmations
  WHERE seller_id = p_seller_id 
    AND status = 'pending';
  
  -- If no pending confirmations, remove restrictions
  IF pending_count = 0 THEN
    UPDATE profiles 
    SET 
      account_restricted = FALSE,
      restriction_reason = NULL,
      restriction_applied_at = NULL
    WHERE id = p_seller_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function: Create payment confirmation record
CREATE OR REPLACE FUNCTION create_payment_confirmation(
  p_order_id UUID,
  p_seller_id UUID,
  p_buyer_id UUID,
  p_item_id UUID,
  p_amount DECIMAL(10,2),
  p_seller_timezone TEXT DEFAULT 'Australia/Sydney'
)
RETURNS UUID AS $$
DECLARE
  confirmation_id UUID;
  deadline TIMESTAMPTZ;
BEGIN
  -- Calculate deadline
  deadline := calculate_confirmation_deadline(NOW(), p_seller_timezone);
  
  -- Create confirmation record
  INSERT INTO payment_confirmations (
    order_id,
    seller_id,
    buyer_id,
    item_id,
    amount,
    payment_confirmed_at,
    confirmation_deadline
  ) VALUES (
    p_order_id,
    p_seller_id,
    p_buyer_id,
    p_item_id,
    p_amount,
    NOW(),
    deadline
  ) RETURNING id INTO confirmation_id;
  
  -- Update order with confirmation details
  UPDATE orders 
  SET 
    seller_confirmation_required = TRUE,
    payment_confirmation_deadline = deadline
  WHERE id = p_order_id;
  
  RETURN confirmation_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Confirm payment received by seller
CREATE OR REPLACE FUNCTION confirm_payment_received(
  p_confirmation_id UUID,
  p_seller_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  confirmation_record RECORD;
  all_confirmed BOOLEAN;
BEGIN
  -- Get confirmation details
  SELECT * INTO confirmation_record
  FROM payment_confirmations
  WHERE id = p_confirmation_id 
    AND seller_id = p_seller_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as confirmed
  UPDATE payment_confirmations 
  SET 
    status = 'confirmed',
    seller_confirmed_at = NOW()
  WHERE id = p_confirmation_id;
  
  -- Update order
  UPDATE orders 
  SET 
    seller_confirmation_required = FALSE,
    seller_confirmed_payment_at = NOW()
  WHERE id = confirmation_record.order_id;
  
  -- Check if all confirmations are now complete
  SELECT remove_account_restrictions_if_all_confirmed(p_seller_id) INTO all_confirmed;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for payment_confirmations
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_confirmations_select_own" ON payment_confirmations
  FOR SELECT USING (
    auth.uid() = seller_id OR auth.uid() = buyer_id
  );

CREATE POLICY "payment_confirmations_update_seller" ON payment_confirmations
  FOR UPDATE USING (
    auth.uid() = seller_id AND status = 'pending'
  );

-- RLS Policies for support_requests
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_requests_select_own" ON support_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "support_requests_insert_own" ON support_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update existing RLS policies for orders to include new fields
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = (SELECT seller_id FROM items WHERE id = orders.item_id)
  );

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_payment_confirmation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_confirmations_updated_at
  BEFORE UPDATE ON payment_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_payment_confirmation_updated_at();

CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW EXECUTE FUNCTION update_payment_confirmation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE payment_confirmations IS 'Tracks payment confirmations requiring seller acknowledgment';
COMMENT ON TABLE support_requests IS 'Stores support requests for payment confirmation issues';
COMMENT ON FUNCTION calculate_confirmation_deadline IS 'Calculates deadline based on business hours and timezone';
COMMENT ON FUNCTION check_payment_confirmation_deadlines IS 'Checks for expired confirmations and applies restrictions';
COMMENT ON FUNCTION remove_account_restrictions_if_all_confirmed IS 'Removes restrictions when all payments are confirmed';
