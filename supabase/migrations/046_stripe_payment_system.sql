-- ============================================
-- STRIPE PAYMENT SYSTEM (Mobile App Pattern)
-- ============================================

-- Add missing payment fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS confirmation_timezone TEXT DEFAULT 'Australia/Sydney';

-- Add check constraints for payment fields
DO $$ BEGIN
  ALTER TABLE public.orders 
  ADD CONSTRAINT check_orders_payment_method 
  CHECK (payment_method IN ('stripe', 'bank_transfer', 'crypto'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders 
  ADD CONSTRAINT check_orders_payment_status 
  CHECK (payment_status IN ('pending', 'completed', 'confirmed', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);

-- ============================================
-- PROCESS PURCHASE RPC FUNCTION
-- ============================================

DROP FUNCTION IF EXISTS public.process_purchase(uuid, uuid[], text, text);

CREATE OR REPLACE FUNCTION public.process_purchase(
  param_buyer_id uuid,
  param_item_ids uuid[],
  param_delivery_method text DEFAULT 'collect',
  param_timezone text DEFAULT 'Australia/Sydney'
)
RETURNS TABLE(order_id uuid, item_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id uuid;
  v_seller_id uuid;
  v_amount numeric;
  v_order_id uuid;
  v_collection_address text;
  v_collection_date timestamptz;
BEGIN
  -- Set search path for security
  PERFORM set_config('search_path','public',true);

  -- Validate delivery_method
  IF param_delivery_method NOT IN ('collect','ship') THEN
    RAISE EXCEPTION 'Invalid delivery_method: %. Must be collect or ship', param_delivery_method;
  END IF;

  -- Process each item
  FOREACH v_item_id IN ARRAY param_item_ids LOOP
    -- Lock item row and get details
    SELECT 
      i.seller_id, 
      i.collection_address,
      i.collection_date
    INTO 
      v_seller_id, 
      v_collection_address,
      v_collection_date
    FROM public.items i
    WHERE i.id = v_item_id
    FOR UPDATE;

    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'Item % not found', v_item_id;
    END IF;

    -- Get price (negotiated from cart or original from item)
    SELECT COALESCE(
             (SELECT ci.negotiated_price
                FROM public.cart_items ci
               WHERE ci.buyer_id = param_buyer_id
                 AND ci.item_id  = v_item_id),
             (SELECT i2.price
                FROM public.items i2
               WHERE i2.id = v_item_id)
           )
      INTO v_amount;

    -- Mark item as SOLD immediately
    UPDATE public.items i
       SET status   = 'sold',
           is_sold  = true,
           sold_at  = NOW(),
           buyer_id = param_buyer_id
     WHERE i.id = v_item_id;

    -- Create order with payment_confirmed status
    INSERT INTO public.orders(
      item_id, 
      buyer_id, 
      seller_id, 
      total_amount,
      payment_method, 
      payment_status, 
      status,
      payment_confirmed_at, 
      delivery_method, 
      shipping_cost,
      collection_address,
      collection_date,
      confirmation_timezone
    )
    VALUES(
      v_item_id, 
      param_buyer_id, 
      v_seller_id, 
      v_amount,
      'stripe', 
      'completed', 
      'payment_confirmed',
      NOW(), 
      param_delivery_method, 
      0,
      v_collection_address,
      v_collection_date,
      COALESCE(param_timezone,'Australia/Sydney')
    )
    RETURNING id INTO v_order_id;

    -- Clear cart
    DELETE FROM public.cart_items ci
     WHERE ci.buyer_id = param_buyer_id
       AND ci.item_id  = v_item_id;

    -- Drop reservation
    DELETE FROM public.item_reservations r
     WHERE r.user_id = param_buyer_id
       AND r.item_id = v_item_id;

    -- Disable bundles containing this item
    UPDATE public.bundles
    SET status = 'inactive'
    WHERE item_ids @> ARRAY[v_item_id]::uuid[];

    RETURN QUERY SELECT v_order_id, v_item_id;
  END LOOP;

  RETURN;
END
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.process_purchase(uuid, uuid[], text, text) TO authenticated, anon;

-- Add comments
COMMENT ON FUNCTION public.process_purchase IS 'Atomically processes purchase: marks items sold, creates orders, clears cart, drops reservations, disables bundles';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used: stripe, bank_transfer, or crypto';
COMMENT ON COLUMN public.orders.payment_status IS 'Status of payment: pending, completed, confirmed, or failed';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID for reference';

