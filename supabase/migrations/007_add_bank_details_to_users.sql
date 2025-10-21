-- Add bank account fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_bsb TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

