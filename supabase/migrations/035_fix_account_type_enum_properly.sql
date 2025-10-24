-- Fix account_type enum issue by handling the existing enum type
-- This will work around the enum constraint

-- First, let's see what enum values are currently allowed
-- We'll update the enum type to include 'seller' instead of 'business'

-- Check if there's an enum type for account_type and update it
DO $$ 
BEGIN
    -- Check if the enum type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
        -- Add 'seller' to the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'seller' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_type_enum')) THEN
            ALTER TYPE account_type_enum ADD VALUE 'seller';
        END IF;
        
        -- Update any existing 'business' records to 'seller' (if they exist)
        UPDATE profiles 
        SET account_type = 'seller'::account_type_enum 
        WHERE account_type = 'business'::account_type_enum;
    ELSE
        -- If no enum type, just update the text values
        UPDATE profiles 
        SET account_type = 'seller' 
        WHERE account_type = 'business';
    END IF;
END $$;

-- Update the comment
COMMENT ON COLUMN profiles.account_type IS 'Account type: individual or seller - set during onboarding';
