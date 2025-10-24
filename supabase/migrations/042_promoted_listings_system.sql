-- Migration 042: Promoted Listings, Seller Balance, and Item Availability System
-- This migration includes tables for promotions, auctions, seller balances, and real-time availability

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
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' 
CHECK (availability_status IN ('available', 'reserved', 'pending_payment', 'sold'));

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create balance transactions table for audit trail
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale_credit', 'promotion_debit', 'refund', 'adjustment')),
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_promotion_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX idx_balance_transactions_created ON balance_transactions(created_at DESC);

-- Function to update seller balance on sale
CREATE OR REPLACE FUNCTION update_seller_balance_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to payment_confirmed, credit seller (95% after 5% fee)
  IF NEW.status = 'payment_confirmed' AND OLD.status != 'payment_confirmed' THEN
    UPDATE profiles 
    SET seller_balance = seller_balance + (NEW.total_amount * 0.95)
    WHERE id = NEW.seller_id;
    
    -- Record transaction
    INSERT INTO balance_transactions (user_id, amount, transaction_type, related_order_id, description)
    VALUES (NEW.seller_id, NEW.total_amount * 0.95, 'sale_credit', NEW.id, 'Sale of item: ' || NEW.item_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for balance updates
DROP TRIGGER IF EXISTS trigger_update_seller_balance ON orders;
CREATE TRIGGER trigger_update_seller_balance
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_balance_on_sale();

-- ============================================
-- PART 2: REAL-TIME AVAILABILITY SYSTEM
-- ============================================

-- Function to automatically release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE items 
  SET availability_status = 'available', 
      reserved_until = NULL,
      reserved_by = NULL
  WHERE availability_status = 'reserved' 
    AND reserved_until < now();
END;
$$ LANGUAGE plpgsql;

-- Function to reserve item for purchase (10-minute hold)
CREATE OR REPLACE FUNCTION reserve_item_for_purchase(
  p_item_id UUID,
  p_buyer_id UUID,
  p_reservation_minutes INTEGER DEFAULT 10
)
RETURNS void AS $$
BEGIN
  UPDATE items 
  SET availability_status = 'reserved',
      reserved_until = now() + (p_reservation_minutes || ' minutes')::interval,
      reserved_by = p_buyer_id
  WHERE id = p_item_id 
    AND availability_status = 'available';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item is not available for reservation';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check item availability before actions
CREATE OR REPLACE FUNCTION check_item_availability_before_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Release expired reservations first
  IF OLD.availability_status = 'reserved' AND OLD.reserved_until < now() THEN
    NEW.availability_status := 'available';
    NEW.reserved_until := NULL;
    NEW.reserved_by := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_item_availability ON items;
CREATE TRIGGER trigger_check_item_availability
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION check_item_availability_before_action();

-- ============================================
-- PART 3: PROMOTED LISTINGS & AUCTIONS
-- ============================================

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

-- Promotion auctions (daily per category)
CREATE TABLE IF NOT EXISTS promotion_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  auction_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  winning_bid DECIMAL(10,2),
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, auction_date)
);

CREATE INDEX idx_promotion_auctions_category ON promotion_auctions(category);
CREATE INDEX idx_promotion_auctions_status ON promotion_auctions(status);

-- Individual bids on auctions
CREATE TABLE IF NOT EXISTS promotion_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES promotion_auctions(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL CHECK (bid_amount >= 5.00),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auction_id, seller_id) -- One bid per seller per auction
);

CREATE INDEX idx_promotion_bids_auction ON promotion_bids(auction_id);
CREATE INDEX idx_promotion_bids_seller ON promotion_bids(seller_id);

-- Active promotions (winners get daily promotion)
CREATE TABLE IF NOT EXISTS active_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  rotation_weight DECIMAL(3,2) DEFAULT 1.0, -- 0.00 to 1.00, higher = more visibility
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_active_promotions_category ON active_promotions(category);
CREATE INDEX idx_active_promotions_active ON active_promotions(starts_at, ends_at);

-- ============================================
-- PART 4: ITEM NOTIFICATIONS (Notify Me Feature)
-- ============================================

CREATE TABLE IF NOT EXISTS item_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  search_criteria JSONB NOT NULL, -- category, price_range, keywords, location
  notify_via TEXT NOT NULL CHECK (notify_via IN ('email', 'sms', 'both')),
  active BOOLEAN DEFAULT true,
  notification_count INTEGER DEFAULT 0, -- track how many times notified
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days')
);

CREATE INDEX idx_item_notifications_user ON item_notifications(user_id);
CREATE INDEX idx_item_notifications_active ON item_notifications(active) WHERE active = true;

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for balance_transactions
CREATE POLICY "users_see_own_transactions" ON balance_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for seller_balances
CREATE POLICY "users_see_own_balance" ON seller_balances
  FOR SELECT USING (auth.uid() = seller_id);

-- RLS Policies for promotion_auctions
CREATE POLICY "anyone_can_view_auctions" ON promotion_auctions
  FOR SELECT USING (true);

-- RLS Policies for promotion_bids
CREATE POLICY "users_see_own_bids" ON promotion_bids
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "users_create_own_bids" ON promotion_bids
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for active_promotions
CREATE POLICY "anyone_can_view_active_promotions" ON active_promotions
  FOR SELECT USING (true);

-- RLS Policies for item_notifications
CREATE POLICY "users_manage_own_notifications" ON item_notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE balance_transactions IS 'Audit trail for all seller balance changes';
COMMENT ON TABLE seller_balances IS 'Detailed seller balance tracking separate from profiles';
COMMENT ON TABLE promotion_auctions IS 'Daily auctions for promoted placement per category';
COMMENT ON TABLE promotion_bids IS 'Individual seller bids on promotion auctions';
COMMENT ON TABLE active_promotions IS 'Currently running promoted listings with rotation';
COMMENT ON TABLE item_notifications IS 'User alerts for when similar items are listed';
COMMENT ON COLUMN items.availability_status IS 'Real-time item availability: available, reserved, pending_payment, sold';
COMMENT ON COLUMN items.collection_flexible IS 'Whether seller allows flexible collection time vs specific date';

