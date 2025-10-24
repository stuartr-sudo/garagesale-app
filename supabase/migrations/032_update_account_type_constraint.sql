-- Update account_type constraint to use 'seller' instead of 'business'

-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_account_type;

-- Add the updated constraint with 'seller' instead of 'business'
ALTER TABLE profiles ADD CONSTRAINT check_account_type 
CHECK (account_type IS NULL OR account_type IN ('individual', 'seller'));

-- Update any existing 'business' records to 'seller'
UPDATE profiles 
SET account_type = 'seller' 
WHERE account_type = 'business';
