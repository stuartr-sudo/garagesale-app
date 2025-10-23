-- Add image_urls column to baggage table
ALTER TABLE baggage ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN baggage.image_urls IS 'Array of image URLs for baggage items - stored in item-images bucket';
