-- Add terms acceptance tracking to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_date TIMESTAMPTZ;

-- Add index for querying users who have accepted terms
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted 
ON profiles(terms_accepted);

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.terms_accepted IS 'Indicates whether the user has accepted the terms of service, privacy policy, and acceptable use policy';
COMMENT ON COLUMN profiles.terms_accepted_date IS 'Timestamp when the user accepted the terms';

