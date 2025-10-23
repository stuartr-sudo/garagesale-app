-- Add collection_address column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS collection_address TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.collection_address IS 'Default collection address for sellers - pre-fills in item creation forms';
