-- Migration 043: Messaging, Trading, and Wish List System
-- In-platform messaging, item trading, and public wish lists with AI matching

-- ============================================
-- PART 1: IN-PLATFORM MESSAGING SYSTEM
-- ============================================

-- Conversations table (container for messages between users)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation participants (many-to-many: users to conversations)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'trade_offer', 'wish_list_match', 'system')),
  metadata JSONB, -- for trade offers, item links, wish list details, etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for messaging performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_conversations_participants ON conversation_participants(user_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = false;

-- Function to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Increment unread count for recipient(s)
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- PART 2: ITEM TRADING SYSTEM
-- ============================================

-- Add trading preference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS open_to_trades BOOLEAN DEFAULT false;

-- Trade offers table
CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'cancelled', 'completed')),
  cash_adjustment DECIMAL(10,2) DEFAULT 0, -- positive = recipient pays, negative = initiator pays
  counter_offer_id UUID REFERENCES trade_offers(id) ON DELETE SET NULL, -- link to counter offer
  message TEXT, -- explanation for the trade
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT cash_adjustment_limit CHECK (ABS(cash_adjustment) <= 500)
);

-- Trade offer items (items included in the trade from each party)
CREATE TABLE IF NOT EXISTS trade_offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id UUID NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  offered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_value DECIMAL(10,2) NOT NULL, -- locked value at time of offer
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for trades
CREATE INDEX idx_trade_offers_initiator ON trade_offers(initiator_id);
CREATE INDEX idx_trade_offers_recipient ON trade_offers(recipient_id);
CREATE INDEX idx_trade_offers_status ON trade_offers(status);
CREATE INDEX idx_trade_offer_items_trade ON trade_offer_items(trade_offer_id);

-- Function to check if items are available for trade
CREATE OR REPLACE FUNCTION validate_trade_offer_items()
RETURNS TRIGGER AS $$
DECLARE
  v_item_status TEXT;
BEGIN
  -- Check if item is available
  SELECT availability_status INTO v_item_status
  FROM items 
  WHERE id = NEW.item_id;
  
  IF v_item_status != 'available' THEN
    RAISE EXCEPTION 'Item is not available for trading (status: %)', v_item_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_trade_items ON trade_offer_items;
CREATE TRIGGER trigger_validate_trade_items
  BEFORE INSERT ON trade_offer_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_trade_offer_items();

-- ============================================
-- PART 3: PUBLIC WISH LIST SYSTEM
-- ============================================

-- Wish lists table (buyer requests)
CREATE TABLE IF NOT EXISTS wish_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  preferred_price_min DECIMAL(10,2),
  preferred_price_max DECIMAL(10,2),
  acceptable_conditions TEXT[] DEFAULT ARRAY['new', 'like_new', 'good'],
  category TEXT,
  max_distance_km INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by_item_id UUID REFERENCES items(id) ON DELETE SET NULL
);

-- Wish list matches (AI-identified matches with price locking)
CREATE TABLE IF NOT EXISTS wish_list_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_list_id UUID NOT NULL REFERENCES wish_lists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) CHECK (match_score >= 0 AND match_score <= 1), -- 0.00 to 1.00
  price_locked DECIMAL(10,2) NOT NULL, -- price at time of match (prevents hiking)
  match_details JSONB, -- AI reasoning for match
  notified_at TIMESTAMPTZ DEFAULT now(),
  seller_responded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wish_list_id, item_id) -- prevent duplicate notifications
);

-- Indexes for wish lists
CREATE INDEX idx_wish_lists_user ON wish_lists(user_id);
CREATE INDEX idx_wish_lists_active ON wish_lists(status) WHERE status = 'active';
CREATE INDEX idx_wish_lists_category ON wish_lists(category) WHERE status = 'active';
CREATE INDEX idx_wish_list_matches_wish ON wish_list_matches(wish_list_id);
CREATE INDEX idx_wish_list_matches_seller ON wish_list_matches(seller_id);
CREATE INDEX idx_wish_list_matches_item ON wish_list_matches(item_id);

-- Function to prevent price hiking after wish list match
CREATE OR REPLACE FUNCTION prevent_price_hike_on_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if item has pending wish list matches
  IF EXISTS (
    SELECT 1 FROM wish_list_matches 
    WHERE item_id = NEW.id 
    AND seller_responded = false
    AND NEW.price > OLD.price
  ) THEN
    RAISE EXCEPTION 'Cannot increase price while wish list matches are pending. Your item matches buyer requests at the current price.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_price_hike_before_update ON items;
CREATE TRIGGER trigger_check_price_hike_before_update
  BEFORE UPDATE ON items
  FOR EACH ROW
  WHEN (NEW.price IS DISTINCT FROM OLD.price)
  EXECUTE FUNCTION prevent_price_hike_on_matches();

-- Function to update wish list timestamp
CREATE OR REPLACE FUNCTION update_wish_list_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wish_list_timestamp ON wish_lists;
CREATE TRIGGER trigger_update_wish_list_timestamp
  BEFORE UPDATE ON wish_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_wish_list_timestamp();

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_list_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "users_see_own_conversations" ON conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- RLS Policies for conversation_participants
CREATE POLICY "users_see_own_participants" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid() OR conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

-- RLS Policies for messages
CREATE POLICY "users_see_conversation_messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_send_own_messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for trade_offers
CREATE POLICY "users_see_own_trades" ON trade_offers
  FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

CREATE POLICY "users_create_own_trades" ON trade_offers
  FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "users_update_own_trades" ON trade_offers
  FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

-- RLS Policies for trade_offer_items
CREATE POLICY "users_see_trade_items" ON trade_offer_items
  FOR SELECT USING (
    trade_offer_id IN (
      SELECT id FROM trade_offers WHERE initiator_id = auth.uid() OR recipient_id = auth.uid()
    )
  );

-- RLS Policies for wish_lists (public for sellers to see)
CREATE POLICY "anyone_can_view_active_wishes" ON wish_lists
  FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "users_manage_own_wishes" ON wish_lists
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for wish_list_matches
CREATE POLICY "users_see_relevant_matches" ON wish_list_matches
  FOR SELECT USING (
    seller_id = auth.uid() OR 
    wish_list_id IN (SELECT id FROM wish_lists WHERE user_id = auth.uid())
  );

CREATE POLICY "system_creates_matches" ON wish_list_matches
  FOR INSERT WITH CHECK (true); -- Allow system to create matches

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE conversations IS 'Container for messages between users';
COMMENT ON TABLE conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON TABLE messages IS 'Individual messages within conversations, supports multiple types';
COMMENT ON TABLE trade_offers IS 'Proposals to swap items between sellers, with optional cash adjustment';
COMMENT ON TABLE trade_offer_items IS 'Items included in each side of a trade offer';
COMMENT ON TABLE wish_lists IS 'Public buyer requests for specific items, visible to all sellers';
COMMENT ON TABLE wish_list_matches IS 'AI-identified matches between wish lists and available items with price locking';
COMMENT ON COLUMN wish_list_matches.price_locked IS 'Price at time of match - prevents seller from hiking price after notification';
COMMENT ON COLUMN trade_offers.cash_adjustment IS 'Optional cash difference: positive = recipient pays, negative = initiator pays, max $500';

