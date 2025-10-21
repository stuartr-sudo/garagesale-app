-- Create orders table for payment tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Pricing
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Delivery
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('collect', 'ship')),
  shipping_address TEXT,
  tracking_number TEXT,
  
  -- Payment tracking
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN (
    'awaiting_payment',
    'payment_pending_seller_confirmation',
    'payment_confirmed',
    'shipped',
    'delivered',
    'collected',
    'expired',
    'cancelled'
  )),
  payment_deadline TIMESTAMPTZ,
  buyer_confirmed_payment_at TIMESTAMPTZ,
  seller_confirmed_payment_at TIMESTAMPTZ,
  
  -- Collection details (for collect method)
  collection_address TEXT,
  collection_date DATE,
  collection_time_start TIME,
  collection_time_end TIME,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON public.orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS buyers_can_view_their_orders ON public.orders;
CREATE POLICY buyers_can_view_their_orders ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS sellers_can_view_their_orders ON public.orders;
CREATE POLICY sellers_can_view_their_orders ON public.orders
  FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS buyers_can_create_orders ON public.orders;
CREATE POLICY buyers_can_create_orders ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS buyers_can_update_their_orders ON public.orders;
CREATE POLICY buyers_can_update_their_orders ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS sellers_can_update_their_orders ON public.orders;
CREATE POLICY sellers_can_update_their_orders ON public.orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS orders_updated_at_trigger ON public.orders;
CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Function to handle expired orders
CREATE OR REPLACE FUNCTION handle_expired_orders()
RETURNS void AS $$
BEGIN
  UPDATE public.orders
  SET status = 'expired'
  WHERE status = 'awaiting_payment'
    AND payment_deadline < now()
    AND buyer_confirmed_payment_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE public.orders IS 'Tracks all purchase orders with payment confirmation and delivery tracking';

