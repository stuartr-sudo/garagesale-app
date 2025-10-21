-- Add minimum_price column to items table
ALTER TABLE items ADD COLUMN minimum_price DECIMAL(10,2);

-- Add comment to explain the column
COMMENT ON COLUMN items.minimum_price IS 'Minimum price for AI agent negotiation - agent will automatically accept offers at or above this price';

-- Update RLS policy to allow reading minimum_price
-- (The existing policies should already cover this, but let's make sure)
