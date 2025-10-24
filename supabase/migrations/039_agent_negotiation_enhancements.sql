-- Agent Negotiation Enhancements - Database Schema Updates
-- This migration adds enhanced tracking and analytics for AI agent negotiations

-- Step 1.1: Update agent_messages table (already done in 038, but ensuring it exists)
ALTER TABLE agent_messages 
ADD COLUMN IF NOT EXISTS counter_offer_amount DECIMAL(10,2);

-- Step 1.2: Update agent_conversations table with buyer momentum tracking
ALTER TABLE agent_conversations 
ADD COLUMN IF NOT EXISTS buyer_momentum JSONB DEFAULT '{}'::jsonb;

-- Step 1.3: Create negotiation analytics table
CREATE TABLE IF NOT EXISTS negotiation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  outcome TEXT, -- accepted, declined, expired, abandoned
  initial_offer DECIMAL(10,2),
  final_price DECIMAL(10,2),
  num_counters INTEGER DEFAULT 0,
  time_to_close_minutes INTEGER,
  seller_minimum DECIMAL(10,2),
  seller_asking DECIMAL(10,2),
  buyer_increased_offer BOOLEAN DEFAULT false
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_item_id ON negotiation_analytics(item_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_outcome ON negotiation_analytics(outcome);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_closed_at ON negotiation_analytics(closed_at DESC);

-- Enable RLS
ALTER TABLE negotiation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy - sellers can see their own analytics
CREATE POLICY "analytics_select_seller" ON negotiation_analytics
  FOR SELECT USING (
    item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
  );

-- System can insert
CREATE POLICY "analytics_insert_system" ON negotiation_analytics
  FOR INSERT WITH CHECK (true);

-- Add comments for clarity
COMMENT ON TABLE negotiation_analytics IS 'Tracks negotiation success metrics and analytics for AI agent conversations';
COMMENT ON COLUMN negotiation_analytics.buyer_increased_offer IS 'Whether the buyer increased their offer during negotiation';
COMMENT ON COLUMN negotiation_analytics.time_to_close_minutes IS 'Time from start to close of negotiation in minutes';
COMMENT ON COLUMN agent_conversations.buyer_momentum IS 'JSONB tracking buyer behavior patterns and momentum during negotiation';
