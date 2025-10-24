-- Add account_type column to profiles table
-- This allows users to select between 'individual' and 'business' account types

-- Add account_type column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or business - set during onboarding';

-- Add a check constraint to ensure valid values
ALTER TABLE profiles ADD CONSTRAINT check_account_type 
CHECK (account_type IS NULL OR account_type IN ('individual', 'business'));

-- Create index for better performance on account type queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
