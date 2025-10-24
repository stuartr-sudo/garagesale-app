-- Convert account_type column to TEXT to avoid enum issues
-- This is the safest approach

-- First, update any existing values to avoid conflicts
UPDATE profiles 
SET account_type = 'individual' 
WHERE account_type = 'business' OR account_type IS NULL;

-- Change the column type to TEXT (this will remove any enum constraints)
ALTER TABLE profiles 
ALTER COLUMN account_type TYPE TEXT;

-- Update the comment
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or seller - set during onboarding';
