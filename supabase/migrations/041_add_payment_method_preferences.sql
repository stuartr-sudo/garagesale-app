-- Add payment method preferences to profiles table
-- This allows sellers to control which payment methods they accept

-- Add the accepted_payment_methods column as JSONB array
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["bank_transfer", "stripe", "crypto"]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN profiles.accepted_payment_methods IS 'Array of payment methods the seller accepts: bank_transfer, stripe, crypto';

-- Update existing profiles to have all payment methods as default
UPDATE profiles 
SET accepted_payment_methods = '["bank_transfer", "stripe", "crypto"]'::jsonb 
WHERE accepted_payment_methods IS NULL;
