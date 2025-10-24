-- Remove the account_type constraint temporarily to allow any values
-- This will fix the enum error

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_account_type;

-- Update any existing 'business' records to 'seller'
UPDATE profiles 
SET account_type = 'seller' 
WHERE account_type = 'business';

-- Update the comment
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or seller - set during onboarding';
