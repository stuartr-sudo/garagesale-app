-- Migration: Add AI Upsell Settings to Seller Profiles
-- Allows sellers to opt-in to AI-powered cross-selling/upselling
-- Sellers set commission rate (10-20%) which becomes buyer discount

-- Add columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS enable_ai_upsell BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upsell_commission_rate NUMERIC(4,2) DEFAULT 15.00;

-- Add constraint to ensure commission rate is between 10 and 20
ALTER TABLE profiles
ADD CONSTRAINT check_upsell_commission_rate 
CHECK (upsell_commission_rate >= 10.00 AND upsell_commission_rate <= 20.00);

-- Add comment for documentation
COMMENT ON COLUMN profiles.enable_ai_upsell IS 
'When true, seller opts into AI-powered upselling. Their items will be suggested to buyers in cart as cross-sells.';

COMMENT ON COLUMN profiles.upsell_commission_rate IS 
'Percentage (10-20) that seller pays as commission for AI-generated additional sales. This becomes the discount shown to buyers.';

-- Create index for faster queries when finding upsell-enabled sellers
CREATE INDEX IF NOT EXISTS idx_profiles_ai_upsell 
ON profiles(enable_ai_upsell) 
WHERE enable_ai_upsell = true;

-- Example data for testing (optional, comment out in production)
-- UPDATE profiles SET enable_ai_upsell = true, upsell_commission_rate = 15.00 
-- WHERE id = 'your-test-user-id';

