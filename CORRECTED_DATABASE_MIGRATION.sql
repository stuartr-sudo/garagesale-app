-- Corrected Database Migration for Payment System
-- This handles PostgreSQL syntax properly

-- Step 1: Add new payment-related fields to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_address TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS seller_bank_details JSONB;
ALTER TABLE items ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Step 2: Add new payment-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_details JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Step 3: Add new columns to transactions table (as TEXT first)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged_at TIMESTAMP WITH TIME ZONE;

-- Step 4: Create enum types
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'stripe', 'crypto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 5: Update existing data to valid enum values (if any)
UPDATE transactions 
SET payment_method = 'bank_transfer' 
WHERE payment_method IS NOT NULL 
AND payment_method NOT IN ('bank_transfer', 'stripe', 'crypto');

UPDATE transactions 
SET payment_status = 'pending' 
WHERE payment_status IS NOT NULL 
AND payment_status NOT IN ('pending', 'confirmed', 'completed', 'failed');

-- Step 6: Convert columns to enum types (this will work now)
ALTER TABLE transactions ALTER COLUMN payment_method TYPE payment_method USING payment_method::payment_method;
ALTER TABLE transactions ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status;

-- Step 7: Set default values for new columns
ALTER TABLE transactions ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Step 8: Add constraints (without IF NOT EXISTS)
-- First check if constraints exist before adding them
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_payment_method' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT check_payment_method CHECK (payment_method IN ('bank_transfer', 'stripe', 'crypto'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_payment_status' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'confirmed', 'completed', 'failed'));
    END IF;
END $$;

-- Step 9: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_collection_date ON transactions(collection_date);
CREATE INDEX IF NOT EXISTS idx_items_collection_date ON items(collection_date);

-- Step 10: Add comments for documentation
COMMENT ON COLUMN items.collection_date IS 'Date when the item can be collected by the buyer';
COMMENT ON COLUMN items.collection_address IS 'Address where the item can be collected';
COMMENT ON COLUMN items.seller_bank_details IS 'Bank account details for bank transfer payments';
COMMENT ON COLUMN items.crypto_wallet_addresses IS 'Cryptocurrency wallet addresses for crypto payments';
COMMENT ON COLUMN transactions.payment_method IS 'Method used for payment: bank_transfer, stripe, or crypto';
COMMENT ON COLUMN transactions.payment_status IS 'Current status of the payment';
COMMENT ON COLUMN transactions.crypto_currency IS 'Cryptocurrency used for payment (if applicable)';
COMMENT ON COLUMN transactions.crypto_tx_hash IS 'Blockchain transaction hash (if applicable)';
COMMENT ON COLUMN transactions.collection_date IS 'Date when the item should be collected';
COMMENT ON COLUMN transactions.collection_acknowledged IS 'Whether the buyer has acknowledged collection details';
