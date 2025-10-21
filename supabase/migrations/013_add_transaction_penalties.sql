-- Add transaction penalty tracking to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS incomplete_transaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_incomplete_transaction_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_suspension_end_date ON profiles(suspension_end_date);

-- Add comments
COMMENT ON COLUMN profiles.incomplete_transaction_count IS 'Number of times user accepted an offer but did not complete the transaction';
COMMENT ON COLUMN profiles.last_incomplete_transaction_date IS 'Date of the most recent incomplete transaction';
COMMENT ON COLUMN profiles.is_suspended IS 'Whether the user is currently suspended';
COMMENT ON COLUMN profiles.suspension_end_date IS 'When the suspension will be lifted (24 hours after first offense)';
COMMENT ON COLUMN profiles.is_banned IS 'Whether the user is permanently banned from the platform';
COMMENT ON COLUMN profiles.ban_reason IS 'Reason for permanent ban';

-- Create a function to check if suspension has expired
CREATE OR REPLACE FUNCTION check_and_lift_suspension(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_suspended BOOLEAN;
  suspension_end TIMESTAMPTZ;
BEGIN
  SELECT is_suspended, suspension_end_date
  INTO user_suspended, suspension_end
  FROM profiles
  WHERE id = user_id;
  
  -- If user is suspended and suspension period has ended, lift the suspension
  IF user_suspended AND suspension_end IS NOT NULL AND suspension_end <= NOW() THEN
    UPDATE profiles
    SET is_suspended = FALSE,
        suspension_end_date = NULL
    WHERE id = user_id;
    RETURN FALSE; -- No longer suspended
  END IF;
  
  RETURN COALESCE(user_suspended, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Add a column to orders table to track if the buyer completed the transaction
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS marked_incomplete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS incomplete_reason TEXT;

-- Add index for querying incomplete transactions
CREATE INDEX IF NOT EXISTS idx_orders_marked_incomplete ON orders(marked_incomplete);
CREATE INDEX IF NOT EXISTS idx_orders_payment_deadline ON orders(payment_deadline);

-- Add comments
COMMENT ON COLUMN orders.marked_incomplete IS 'Whether this order has been marked as incomplete due to non-payment';
COMMENT ON COLUMN orders.incomplete_reason IS 'Reason why the order was marked incomplete';

