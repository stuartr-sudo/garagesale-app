-- Simple fix: just add a new account_type column as TEXT
-- This avoids all the enum/constraint issues

-- Add a new account_type column as TEXT (no constraints)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type_new TEXT;

-- Copy any existing account_type values to the new column
UPDATE profiles 
SET account_type_new = account_type::TEXT 
WHERE account_type IS NOT NULL;

-- Drop the old problematic column
ALTER TABLE profiles DROP COLUMN IF EXISTS account_type;

-- Rename the new column to account_type
ALTER TABLE profiles RENAME COLUMN account_type_new TO account_type;

-- Add a simple comment
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or seller';
