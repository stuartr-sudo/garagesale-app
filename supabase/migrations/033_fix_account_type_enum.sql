-- Fix account_type to use proper enum values
-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_account_type;

-- Update any existing 'business' records to 'seller' first
UPDATE profiles 
SET account_type = 'seller' 
WHERE account_type = 'business';

-- Add the updated constraint with correct values
ALTER TABLE profiles ADD CONSTRAINT check_account_type 
CHECK (account_type IS NULL OR account_type IN ('individual', 'seller'));

-- Update the comment to reflect the correct values
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or seller - set during onboarding';
