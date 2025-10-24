-- Add negotiation aggressiveness preference to profiles table
-- This allows sellers to control how aggressive their AI agent is during negotiations

-- Add the negotiation_aggressiveness column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS negotiation_aggressiveness TEXT DEFAULT 'balanced' 
CHECK (negotiation_aggressiveness IN ('passive', 'balanced', 'aggressive', 'very_aggressive'));

-- Add comment for clarity
COMMENT ON COLUMN profiles.negotiation_aggressiveness IS 'Controls how aggressive the AI agent is during negotiations: passive (quick to accept), balanced (standard), aggressive (firm), very_aggressive (maximize value)';

-- Update existing profiles to have balanced as default
UPDATE profiles 
SET negotiation_aggressiveness = 'balanced' 
WHERE negotiation_aggressiveness IS NULL;
