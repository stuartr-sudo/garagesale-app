-- ============================================
-- SUPABASE SQL MIGRATIONS - RUN IN ORDER
-- ============================================
-- These are ALL the SQL migrations you need to run in your Supabase SQL editor
-- Run them in the order shown below (039 -> 040 -> 041 -> 042 -> 043)
-- ============================================

-- ============================================
-- MIGRATION 039: Agent Negotiation Enhancements
-- ============================================

-- Step 1.1: Update agent_messages table
-- Add missing column to store counter-offer amounts.
ALTER TABLE agent_messages 
ADD COLUMN IF NOT EXISTS counter_offer_amount DECIMAL(10,2);

-- Step 1.2: Update agent_conversations table with buyer momentum tracking
ALTER TABLE agent_conversations 
ADD COLUMN IF NOT EXISTS buyer_momentum JSONB DEFAULT '{}'::jsonb;

-- Step 1.3: Create negotiation_analytics table
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

-- Add index for analytics queries
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


-- ============================================
-- MIGRATION 040: Add Negotiation Aggressiveness
-- ============================================

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


-- ============================================
-- MIGRATION 041: Add Payment Method Preferences
-- ============================================

-- Add accepted_payment_methods to profiles table
-- This allows sellers to specify which payment methods they accept

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["bank_transfer", "stripe", "crypto"]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN profiles.accepted_payment_methods IS 'JSONB array of payment methods accepted by the seller (e.g., ["bank_transfer", "stripe", "crypto"])';

-- Update existing profiles to ensure the new column has the default value if it was null
UPDATE profiles
SET accepted_payment_methods = '["bank_transfer", "stripe", "crypto"]'::jsonb
WHERE accepted_payment_methods IS NULL;


-- ============================================
-- MIGRATION 042: Promoted Listings, Seller Balance, and Item Availability System
-- ============================================

-- PART 1: SELLER BALANCE SYSTEM
-- ============================================

-- Add seller balance to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seller_balance DECIMAL(10,2) DEFAULT 0.00;

-- Add collection date flexibility
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS collection_flexible BOOLEAN DEFAULT false;

-- Allow collection_date to be null when flexible
ALTER TABLE items 
ALTER COLUMN collection_date DROP NOT NULL;

-- Add real-time availability tracking
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create balance transactions table for audit trail
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created ON balance_transactions(created_at DESC);

-- Seller balances tracking (separate from profiles for detailed accounting)
CREATE TABLE IF NOT EXISTS seller_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  available_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PART 2: PROMOTED LISTINGS & AUCTIONS
-- ============================================

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_item ON promotions(item_id);
CREATE INDEX IF NOT EXISTS idx_promotions_seller ON promotions(seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Promotion bids table
CREATE TABLE IF NOT EXISTS promotion_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_bids_promotion ON promotion_bids(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_bids_bidder ON promotion_bids(bidder_id);

-- PART 3: ITEM NOTIFICATIONS (Notify Me Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS notify_me_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  search_criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
  notified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notify_me_user ON notify_me_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_notify_me_item ON notify_me_requests(original_item_id);

-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_me_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for balance_transactions
CREATE POLICY "users_see_own_transactions" ON balance_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for seller_balances
CREATE POLICY "users_see_own_balance" ON seller_balances
  FOR SELECT USING (auth.uid() = seller_id);

-- RLS Policies for promotions
CREATE POLICY "anyone_can_view_promotions" ON promotions
  FOR SELECT USING (true);

CREATE POLICY "users_create_own_promotions" ON promotions
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for promotion_bids
CREATE POLICY "users_see_promotion_bids" ON promotion_bids
  FOR SELECT USING (true);

CREATE POLICY "users_create_bids" ON promotion_bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- RLS Policies for notify_me_requests
CREATE POLICY "users_manage_own_notifications" ON notify_me_requests
  FOR ALL USING (auth.uid() = user_id);

-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE balance_transactions IS 'Audit trail for all seller balance changes';
COMMENT ON TABLE seller_balances IS 'Detailed seller balance tracking separate from profiles';
COMMENT ON TABLE promotions IS 'Promoted listings with bidding for top placement';
COMMENT ON TABLE promotion_bids IS 'Individual seller bids on promotion spots';
COMMENT ON TABLE notify_me_requests IS 'User alerts for when similar items are listed';
COMMENT ON COLUMN items.collection_flexible IS 'Whether seller allows flexible collection time vs specific date';


-- ============================================
-- MIGRATION 043: Messaging, Trading, and Wish List System
-- ============================================

-- PART 1: IN-PLATFORM MESSAGING SYSTEM
-- ============================================

-- Conversations table (container for messages between users)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation participants (many-to-many: users to conversations)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversation_participants(user_id);

-- Function to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- PART 2: ITEM TRADING SYSTEM
-- ============================================

-- Add trading preference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS open_to_trades BOOLEAN DEFAULT false;

-- Trade offers table
CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id_requested UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  offeror_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requestee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cash_adjustment DECIMAL(10,2) DEFAULT 0,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMPTZ,
  CONSTRAINT cash_adjustment_limit CHECK (ABS(cash_adjustment) <= 500)
);

-- Trade items (items offered by the offeror)
CREATE TABLE IF NOT EXISTS trade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id UUID NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for trades
CREATE INDEX IF NOT EXISTS idx_trade_offers_offeror ON trade_offers(offeror_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_requestee ON trade_offers(requestee_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_items_trade ON trade_items(trade_offer_id);

-- PART 3: PUBLIC WISH LIST SYSTEM
-- ============================================

-- Wish lists table (buyer requests)
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'fulfilled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual wish list items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  preferred_condition TEXT,
  max_price DECIMAL(10,2),
  location_preference TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wish list matches (AI-identified matches with price locking)
CREATE TABLE IF NOT EXISTS wishlist_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2) CHECK (match_score >= 0 AND match_score <= 1),
  price_locked DECIMAL(10,2) NOT NULL,
  match_reasoning TEXT,
  notification_sent BOOLEAN DEFAULT false,
  seller_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wishlist_item_id, item_id)
);

-- Indexes for wish lists
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON wishlists(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_item ON wishlist_matches(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_seller ON wishlist_matches(seller_id);

-- Function to update wish list timestamp
CREATE OR REPLACE FUNCTION update_wishlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wishlist_timestamp ON wishlists;
CREATE TRIGGER trigger_update_wishlist_timestamp
  BEFORE UPDATE ON wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_timestamp();

DROP TRIGGER IF EXISTS trigger_update_wishlist_item_timestamp ON wishlist_items;
CREATE TRIGGER trigger_update_wishlist_item_timestamp
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_timestamp();

-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "users_see_own_conversations" ON conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "system_creates_conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for conversation_participants
CREATE POLICY "users_see_own_participants" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid() OR conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "system_adds_participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

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
  FOR SELECT USING (auth.uid() = offeror_id OR auth.uid() = requestee_id);

CREATE POLICY "users_create_own_trades" ON trade_offers
  FOR INSERT WITH CHECK (auth.uid() = offeror_id);

CREATE POLICY "users_update_trades" ON trade_offers
  FOR UPDATE USING (auth.uid() = offeror_id OR auth.uid() = requestee_id);

-- RLS Policies for trade_items
CREATE POLICY "users_see_trade_items" ON trade_items
  FOR SELECT USING (
    trade_offer_id IN (
      SELECT id FROM trade_offers WHERE offeror_id = auth.uid() OR requestee_id = auth.uid()
    )
  );

CREATE POLICY "system_creates_trade_items" ON trade_items
  FOR INSERT WITH CHECK (true);

-- RLS Policies for wishlists (public for sellers to see)
CREATE POLICY "anyone_can_view_public_wishlists" ON wishlists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "users_manage_own_wishlists" ON wishlists
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for wishlist_items
CREATE POLICY "users_see_wishlist_items" ON wishlist_items
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE is_public = true OR user_id = auth.uid())
  );

CREATE POLICY "users_manage_own_wishlist_items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

-- RLS Policies for wishlist_matches
CREATE POLICY "users_see_relevant_matches" ON wishlist_matches
  FOR SELECT USING (
    seller_id = auth.uid() OR 
    buyer_id = auth.uid()
  );

CREATE POLICY "system_creates_matches" ON wishlist_matches
  FOR INSERT WITH CHECK (true);

-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE conversations IS 'Container for messages between users';
COMMENT ON TABLE conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE trade_offers IS 'Proposals to swap items between sellers, with optional cash adjustment';
COMMENT ON TABLE trade_items IS 'Items offered by the initiator in a trade';
COMMENT ON TABLE wishlists IS 'Public buyer wish lists visible to sellers';
COMMENT ON TABLE wishlist_items IS 'Individual items on a wish list';
COMMENT ON TABLE wishlist_matches IS 'AI-identified matches between wish lists and available items with price locking';
COMMENT ON COLUMN wishlist_matches.price_locked IS 'Price at time of match - prevents seller from hiking price after notification';
COMMENT ON COLUMN trade_offers.cash_adjustment IS 'Optional cash difference to balance trade value, max $500';

-- ============================================
-- ALL MIGRATIONS COMPLETE! ✅
-- ============================================
-- You now have all the database tables and functions needed for the platform
-- Next steps:
-- 1. Verify all tables were created successfully
-- 2. Set environment variables in Vercel
-- 3. Enable Vercel cron jobs
-- 4. Test the platform!
-- ============================================

