-- Migration: Add urgency tracking for items (view counts, active viewers, agent conversations)

-- Add view_count column to items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'view_count') THEN
    ALTER TABLE items ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create table to track active viewers (last 5 minutes)
CREATE TABLE IF NOT EXISTS item_active_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewer_ip TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_item_active_viewers_item_id ON item_active_viewers(item_id);
CREATE INDEX IF NOT EXISTS idx_item_active_viewers_last_seen ON item_active_viewers(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_item_active_viewers_session ON item_active_viewers(session_id, item_id);

-- Add column to track active agent conversations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'active_negotiations_count') THEN
    ALTER TABLE items ADD COLUMN active_negotiations_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to update or insert active viewer
CREATE OR REPLACE FUNCTION upsert_active_viewer(
  p_item_id UUID,
  p_session_id TEXT,
  p_viewer_ip TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO item_active_viewers (item_id, session_id, viewer_ip, last_seen_at)
  VALUES (p_item_id, p_session_id, p_viewer_ip, NOW())
  ON CONFLICT (id)
  DO UPDATE SET last_seen_at = NOW()
  WHERE item_active_viewers.session_id = p_session_id 
    AND item_active_viewers.item_id = p_item_id;
  
  -- Clean up old viewers (>5 minutes)
  DELETE FROM item_active_viewers
  WHERE last_seen_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active viewer count (excluding current session)
CREATE OR REPLACE FUNCTION get_active_viewer_count(
  p_item_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  viewer_count INTEGER;
BEGIN
  -- Clean up old viewers first
  DELETE FROM item_active_viewers
  WHERE last_seen_at < NOW() - INTERVAL '5 minutes';
  
  -- Count active viewers (excluding current session if provided)
  SELECT COUNT(DISTINCT session_id)
  INTO viewer_count
  FROM item_active_viewers
  WHERE item_id = p_item_id
    AND last_seen_at > NOW() - INTERVAL '5 minutes'
    AND (p_session_id IS NULL OR session_id != p_session_id);
  
  RETURN COALESCE(viewer_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active negotiation count
CREATE OR REPLACE FUNCTION get_active_negotiations_count(p_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
  negotiation_count INTEGER;
BEGIN
  -- Count unique agent conversations that are active (not finalized, created in last 24 hours)
  SELECT COUNT(DISTINCT buyer_id)
  INTO negotiation_count
  FROM agent_conversations
  WHERE item_id = p_item_id
    AND status = 'active'
    AND created_at > NOW() - INTERVAL '24 hours';
  
  RETURN COALESCE(negotiation_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update active_negotiations_count when agent conversations change
CREATE OR REPLACE FUNCTION update_item_negotiations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE items
    SET active_negotiations_count = get_active_negotiations_count(NEW.item_id)
    WHERE id = NEW.item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE items
    SET active_negotiations_count = get_active_negotiations_count(OLD.item_id)
    WHERE id = OLD.item_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_negotiations_count ON agent_conversations;
CREATE TRIGGER trigger_update_negotiations_count
  AFTER INSERT OR UPDATE OR DELETE ON agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_item_negotiations_count();

-- RLS Policies for item_active_viewers
ALTER TABLE item_active_viewers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update their own viewer status
CREATE POLICY "Anyone can track their own viewing"
  ON item_active_viewers
  FOR ALL
  USING (true);

-- Allow anyone to read viewer counts
CREATE POLICY "Anyone can read viewer data"
  ON item_active_viewers
  FOR SELECT
  USING (true);

COMMENT ON TABLE item_active_viewers IS 'Tracks active viewers on item detail pages (5-minute window)';
COMMENT ON FUNCTION upsert_active_viewer(UUID, TEXT, TEXT) IS 'Updates or inserts active viewer status';
COMMENT ON FUNCTION get_active_viewer_count(UUID, TEXT) IS 'Returns count of active viewers excluding current session';
COMMENT ON FUNCTION get_active_negotiations_count(UUID) IS 'Returns count of active agent negotiations in last 24 hours';

