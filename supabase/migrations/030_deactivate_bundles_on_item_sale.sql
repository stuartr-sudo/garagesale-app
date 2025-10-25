-- Migration: Deactivate bundles when individual items are sold
-- This ensures bundles are automatically marked as unavailable if any of their items sell individually

-- Function to deactivate bundles when any of their items is sold
CREATE OR REPLACE FUNCTION deactivate_bundles_on_item_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- When an item is marked as sold or reserved, deactivate all bundles containing that item
  IF NEW.status IN ('sold', 'reserved') AND (OLD.status IS NULL OR OLD.status NOT IN ('sold', 'reserved')) THEN
    -- Update all bundles that contain this item to unavailable status
    UPDATE bundles
    SET status = 'unavailable',
        updated_at = NOW()
    WHERE id IN (
      SELECT bundle_id
      FROM bundle_items
      WHERE item_id = NEW.id
    )
    AND status = 'available';
    
    -- Log the deactivation
    RAISE NOTICE 'Deactivated bundles containing item %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on items table
DROP TRIGGER IF EXISTS trigger_deactivate_bundles_on_item_sale ON items;
CREATE TRIGGER trigger_deactivate_bundles_on_item_sale
  AFTER UPDATE ON items
  FOR EACH ROW
  WHEN (NEW.status IN ('sold', 'reserved'))
  EXECUTE FUNCTION deactivate_bundles_on_item_sale();

-- Also create a function to check bundle availability (for queries)
CREATE OR REPLACE FUNCTION is_bundle_available(bundle_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  unavailable_count INTEGER;
BEGIN
  -- Check if any items in the bundle are sold or reserved
  SELECT COUNT(*)
  INTO unavailable_count
  FROM bundle_items bi
  JOIN items i ON i.id = bi.item_id
  WHERE bi.bundle_id = bundle_id_param
    AND i.status IN ('sold', 'reserved');
  
  -- Bundle is available only if all items are available
  RETURN unavailable_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deactivate_bundles_on_item_sale() IS 'Automatically deactivates bundles when any of their items are sold or reserved individually';
COMMENT ON FUNCTION is_bundle_available(UUID) IS 'Checks if a bundle is available by verifying all its items are available';

