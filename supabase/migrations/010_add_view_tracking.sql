-- Add view tracking column to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add index for performance on view_count queries
CREATE INDEX IF NOT EXISTS idx_items_view_count ON public.items(view_count DESC);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_item_view_count(item_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.items
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_item_view_count(UUID) TO anon;

-- Add comments
COMMENT ON COLUMN public.items.view_count IS 'Number of times this item has been viewed';
COMMENT ON FUNCTION increment_item_view_count IS 'Increments the view count for an item';

