-- Add new payment-related fields to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_address TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS seller_bank_details JSONB;
ALTER TABLE items ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Add new payment-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_details JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Update transactions table with new payment fields
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged_at TIMESTAMP WITH TIME ZONE;

-- Create enum for payment methods
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'stripe', 'crypto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for payment status
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the payment_method column to use the enum
ALTER TABLE transactions ALTER COLUMN payment_method TYPE payment_method USING payment_method::payment_method;
ALTER TABLE transactions ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status;

-- Add constraints
ALTER TABLE transactions ADD CONSTRAINT check_payment_method CHECK (payment_method IN ('bank_transfer', 'stripe', 'crypto'));
ALTER TABLE transactions ADD CONSTRAINT check_payment_status CHECK (payment_status IN ('pending', 'confirmed', 'completed', 'failed'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_collection_date ON transactions(collection_date);
CREATE INDEX IF NOT EXISTS idx_items_collection_date ON items(collection_date);

-- Add comments for documentation
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
