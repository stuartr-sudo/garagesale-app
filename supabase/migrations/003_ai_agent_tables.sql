-- Create item_knowledge table for AI agent data
CREATE TABLE IF NOT EXISTS item_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  minimum_price DECIMAL(10,2),
  selling_points TEXT[],
  additional_info JSONB DEFAULT '{}'::jsonb,
  faqs JSONB DEFAULT '{}'::jsonb,
  negotiation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id)
);

-- Create agent_conversations table
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_email TEXT,
  status TEXT DEFAULT 'active', -- active, offer_accepted, offer_declined, closed
  current_offer DECIMAL(10,2),
  negotiation_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent_messages table
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'ai' or 'user'
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, offer, counter_offer, acceptance
  offer_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_item_knowledge_item_id ON item_knowledge(item_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_item_id ON agent_conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_buyer_id ON agent_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation_id ON agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at DESC);

-- Enable RLS
ALTER TABLE item_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_knowledge
-- Only sellers can see minimum_price, others can see public info
CREATE POLICY "item_knowledge_select_public" ON item_knowledge
  FOR SELECT USING (true);

-- Sellers can update their item knowledge
CREATE POLICY "item_knowledge_update_seller" ON item_knowledge
  FOR UPDATE USING (
    item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
  );

-- System can insert (for webhook)
CREATE POLICY "item_knowledge_insert_system" ON item_knowledge
  FOR INSERT WITH CHECK (true);

-- RLS Policies for agent_conversations
-- Users can see their own conversations
CREATE POLICY "conversations_select_own" ON agent_conversations
  FOR SELECT USING (
    buyer_id = auth.uid() OR
    item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
  );

-- Anyone can create a conversation
CREATE POLICY "conversations_insert_any" ON agent_conversations
  FOR INSERT WITH CHECK (true);

-- Users can update their own conversations
CREATE POLICY "conversations_update_own" ON agent_conversations
  FOR UPDATE USING (
    buyer_id = auth.uid() OR
    item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
  );

-- RLS Policies for agent_messages
-- Users can see messages in their conversations
CREATE POLICY "messages_select_own" ON agent_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM agent_conversations
      WHERE buyer_id = auth.uid() OR
            item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
    )
  );

-- Anyone can insert messages (AI agent needs to)
CREATE POLICY "messages_insert_any" ON agent_messages
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_item_knowledge_updated_at BEFORE UPDATE ON item_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON agent_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

