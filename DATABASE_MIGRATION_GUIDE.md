# Database Migration Guide

## Issue: Payment System Database Schema Not Applied

The "Buy Now" button is failing because the database schema changes for the payment system have not been applied to your Supabase database.

## Solution: Apply the Migration

### Option 1: Apply via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl
   - Navigate to SQL Editor

2. **Run the Migration SQL**
   Copy and paste the following SQL into the SQL Editor and execute:

```sql
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
```

### Option 2: Test Database Schema

After applying the migration, you can test if it worked by visiting:
```
https://garage-sale-40afc1f5.vercel.app/api/test/database-schema
```

This will return a success message if the schema is correct.

### Option 3: Manual Verification

You can also verify the schema by checking your Supabase dashboard:
1. Go to Table Editor
2. Check the `items` table - it should have `collection_date`, `collection_address`, `seller_bank_details`, `crypto_wallet_addresses` columns
3. Check the `transactions` table - it should have `payment_method`, `payment_status`, `crypto_currency`, `crypto_tx_hash`, `collection_date`, `collection_acknowledged`, `collection_acknowledged_at` columns

## After Migration

Once the migration is applied:
1. The "Buy Now" button should work correctly
2. The payment wizard will function properly
3. Collection date/address fields will be available in item creation
4. Email notifications will work for collection reminders

## Troubleshooting

If you encounter any issues:
1. Check the Supabase logs for SQL errors
2. Ensure you have the correct permissions in Supabase
3. Try running the SQL statements one by one if the full script fails
4. Contact support if you need assistance

## Environment Variables Still Needed

Don't forget to add these environment variables to Vercel:

### Stripe
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email Service
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx...
FROM_EMAIL=noreply@yourdomain.com
```

### Security
```
CRON_SECRET=your-secret-key
```
