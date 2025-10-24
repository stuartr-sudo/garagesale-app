-- ============================================
-- SUPABASE SQL MIGRATIONS - SAFE VERSION
-- ============================================
-- This version uses DROP POLICY IF EXISTS to avoid conflicts
-- Safe to run multiple times - will skip existing objects
-- ============================================

-- ============================================
-- MIGRATION 039: Agent Negotiation Enhancements
-- ============================================

-- Step 1.1: Update agent_messages table
ALTER TABLE agent_messages 
ADD COLUMN IF NOT EXISTS counter_offer_amount DECIMAL(10,2);

-- Step 1.2: Update agent_conversations table
ALTER TABLE agent_conversations 
ADD COLUMN IF NOT EXISTS buyer_momentum JSONB DEFAULT '{}'::jsonb;

-- Step 1.3: Create negotiation_analytics table
CREATE TABLE IF NOT EXISTS negotiation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  outcome TEXT,
  initial_offer DECIMAL(10,2),
  final_price DECIMAL(10,2),
  num_counters INTEGER DEFAULT 0,
  time_to_close_minutes INTEGER,
  seller_minimum DECIMAL(10,2),
  seller_asking DECIMAL(10,2),
  buyer_increased_offer BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_item_id ON negotiation_analytics(item_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_outcome ON negotiation_analytics(outcome);
CREATE INDEX IF NOT EXISTS idx_negotiation_analytics_closed_at ON negotiation_analytics(closed_at DESC);

ALTER TABLE negotiation_analytics ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid "already exists" errors
DROP POLICY IF EXISTS "analytics_select_seller" ON negotiation_analytics;
CREATE POLICY "analytics_select_seller" ON negotiation_analytics
  FOR SELECT USING (
    item_id IN (SELECT id FROM items WHERE seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "analytics_insert_system" ON negotiation_analytics;
CREATE POLICY "analytics_insert_system" ON negotiation_analytics
  FOR INSERT WITH CHECK (true);

-- ============================================
-- MIGRATION 040: Add Negotiation Aggressiveness
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS negotiation_aggressiveness TEXT DEFAULT 'balanced';

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_negotiation_aggressiveness_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_negotiation_aggressiveness_check 
    CHECK (negotiation_aggressiveness IN ('passive', 'balanced', 'aggressive', 'very_aggressive'));
  END IF;
END $$;

UPDATE profiles 
SET negotiation_aggressiveness = 'balanced' 
WHERE negotiation_aggressiveness IS NULL;

-- ============================================
-- MIGRATION 041: Add Payment Method Preferences
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["bank_transfer", "stripe", "crypto"]'::jsonb;

UPDATE profiles
SET accepted_payment_methods = '["bank_transfer", "stripe", "crypto"]'::jsonb
WHERE accepted_payment_methods IS NULL;

-- ============================================
-- MIGRATION 042: Promoted Listings System
-- ============================================

-- Seller balance
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS seller_balance DECIMAL(10,2) DEFAULT 0.00;

-- Collection flexibility
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS collection_flexible BOOLEAN DEFAULT false;

-- Make collection_date nullable
DO $$ 
BEGIN
  ALTER TABLE items ALTER COLUMN collection_date DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Item status tracking
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Balance transactions
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

-- Seller balances
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

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'promotions_status_check'
  ) THEN
    ALTER TABLE promotions 
    ADD CONSTRAINT promotions_status_check 
    CHECK (status IN ('active', 'expired', 'cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_promotions_item ON promotions(item_id);
CREATE INDEX IF NOT EXISTS idx_promotions_seller ON promotions(seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- Promotion bids
CREATE TABLE IF NOT EXISTS promotion_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_bids_promotion ON promotion_bids(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_bids_bidder ON promotion_bids(bidder_id);

-- Notify me requests
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

-- Enable RLS
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_me_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "users_see_own_transactions" ON balance_transactions;
CREATE POLICY "users_see_own_transactions" ON balance_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_see_own_balance" ON seller_balances;
CREATE POLICY "users_see_own_balance" ON seller_balances
  FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "anyone_can_view_promotions" ON promotions;
CREATE POLICY "anyone_can_view_promotions" ON promotions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_create_own_promotions" ON promotions;
CREATE POLICY "users_create_own_promotions" ON promotions
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "users_see_promotion_bids" ON promotion_bids;
CREATE POLICY "users_see_promotion_bids" ON promotion_bids
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_create_bids" ON promotion_bids;
CREATE POLICY "users_create_bids" ON promotion_bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

DROP POLICY IF EXISTS "users_manage_own_notifications" ON notify_me_requests;
CREATE POLICY "users_manage_own_notifications" ON notify_me_requests
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION 043: Messaging, Trading, Wish Lists
-- ============================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversation_participants(user_id);

-- Update conversation timestamp function
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

-- Trading
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS open_to_trades BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id_requested UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  offeror_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requestee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cash_adjustment DECIMAL(10,2) DEFAULT 0,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMPTZ
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trade_offers_status_check'
  ) THEN
    ALTER TABLE trade_offers 
    ADD CONSTRAINT trade_offers_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cash_adjustment_limit'
  ) THEN
    ALTER TABLE trade_offers 
    ADD CONSTRAINT cash_adjustment_limit 
    CHECK (ABS(cash_adjustment) <= 500);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS trade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id UUID NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_offers_offeror ON trade_offers(offeror_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_requestee ON trade_offers(requestee_id);
CREATE INDEX IF NOT EXISTS idx_trade_offers_status ON trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trade_items_trade ON trade_items(trade_offer_id);

-- Wish Lists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wishlists_status_check'
  ) THEN
    ALTER TABLE wishlists 
    ADD CONSTRAINT wishlists_status_check 
    CHECK (status IN ('active', 'paused', 'fulfilled'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  preferred_condition TEXT,
  max_price DECIMAL(10,2),
  location_preference TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wishlist_items_priority_check'
  ) THEN
    ALTER TABLE wishlist_items 
    ADD CONSTRAINT wishlist_items_priority_check 
    CHECK (priority IN ('low', 'medium', 'high'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wishlist_items_status_check'
  ) THEN
    ALTER TABLE wishlist_items 
    ADD CONSTRAINT wishlist_items_status_check 
    CHECK (status IN ('active', 'fulfilled', 'cancelled'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wishlist_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id UUID NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score DECIMAL(3,2),
  price_locked DECIMAL(10,2) NOT NULL,
  match_reasoning TEXT,
  notification_sent BOOLEAN DEFAULT false,
  seller_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wishlist_item_id, item_id)
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wishlist_matches_match_score_check'
  ) THEN
    ALTER TABLE wishlist_matches 
    ADD CONSTRAINT wishlist_matches_match_score_check 
    CHECK (match_score >= 0 AND match_score <= 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON wishlists(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_item ON wishlist_matches(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_seller ON wishlist_matches(seller_id);

-- Update timestamp functions
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

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_matches ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all RLS policies
DROP POLICY IF EXISTS "users_see_own_conversations" ON conversations;
CREATE POLICY "users_see_own_conversations" ON conversations
  FOR SELECT USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "system_creates_conversations" ON conversations;
CREATE POLICY "system_creates_conversations" ON conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_see_own_participants" ON conversation_participants;
CREATE POLICY "users_see_own_participants" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid() OR conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "system_adds_participants" ON conversation_participants;
CREATE POLICY "system_adds_participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "users_see_conversation_messages" ON messages;
CREATE POLICY "users_see_conversation_messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_send_own_messages" ON messages;
CREATE POLICY "users_send_own_messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_see_own_trades" ON trade_offers;
CREATE POLICY "users_see_own_trades" ON trade_offers
  FOR SELECT USING (auth.uid() = offeror_id OR auth.uid() = requestee_id);

DROP POLICY IF EXISTS "users_create_own_trades" ON trade_offers;
CREATE POLICY "users_create_own_trades" ON trade_offers
  FOR INSERT WITH CHECK (auth.uid() = offeror_id);

DROP POLICY IF EXISTS "users_update_trades" ON trade_offers;
CREATE POLICY "users_update_trades" ON trade_offers
  FOR UPDATE USING (auth.uid() = offeror_id OR auth.uid() = requestee_id);

DROP POLICY IF EXISTS "users_see_trade_items" ON trade_items;
CREATE POLICY "users_see_trade_items" ON trade_items
  FOR SELECT USING (
    trade_offer_id IN (
      SELECT id FROM trade_offers WHERE offeror_id = auth.uid() OR requestee_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "system_creates_trade_items" ON trade_items;
CREATE POLICY "system_creates_trade_items" ON trade_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anyone_can_view_public_wishlists" ON wishlists;
CREATE POLICY "anyone_can_view_public_wishlists" ON wishlists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_wishlists" ON wishlists;
CREATE POLICY "users_manage_own_wishlists" ON wishlists
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_see_wishlist_items" ON wishlist_items;
CREATE POLICY "users_see_wishlist_items" ON wishlist_items
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE is_public = true OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "users_manage_own_wishlist_items" ON wishlist_items;
CREATE POLICY "users_manage_own_wishlist_items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "users_see_relevant_matches" ON wishlist_matches;
CREATE POLICY "users_see_relevant_matches" ON wishlist_matches
  FOR SELECT USING (
    seller_id = auth.uid() OR 
    buyer_id = auth.uid()
  );

DROP POLICY IF EXISTS "system_creates_matches" ON wishlist_matches;
CREATE POLICY "system_creates_matches" ON wishlist_matches
  FOR INSERT WITH CHECK (true);

-- ============================================
-- ✅ ALL MIGRATIONS COMPLETE!
-- ============================================
-- Safe to run multiple times - will skip existing objects
-- No errors should occur now!
-- ============================================

