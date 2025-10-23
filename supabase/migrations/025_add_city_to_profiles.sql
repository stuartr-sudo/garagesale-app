-- Add city column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.city IS 'User city for location details in profile settings';
