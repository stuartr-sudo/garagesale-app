-- Ultra Simple Database Migration for Payment System
-- This avoids all enum conversion issues

-- Step 1: Add new payment-related fields to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS collection_address TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS seller_bank_details JSONB;
ALTER TABLE items ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Step 2: Add new payment-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_details JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB;

-- Step 3: Add new columns to transactions table (as TEXT only, no enums)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS collection_acknowledged_at TIMESTAMP WITH TIME ZONE;

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_collection_date ON transactions(collection_date);
CREATE INDEX IF NOT EXISTS idx_items_collection_date ON items(collection_date);

-- Step 5: Add comments for documentation
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
