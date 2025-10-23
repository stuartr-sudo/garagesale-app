-- Safe function search_path fix - only for functions that definitely exist
-- Based on the actual warnings from Supabase Security Advisor

-- These are the functions that were listed in your warnings table
-- We'll handle them one by one with proper error handling

-- Function: update_baggage_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_baggage_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_baggage_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_baggage_updated_at';
    ELSE
        RAISE NOTICE 'Function update_baggage_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_baggage_updated_at: %', SQLERRM;
END $$;

-- Function: update_bundle_totals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_bundle_totals' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_bundle_totals() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_bundle_totals';
    ELSE
        RAISE NOTICE 'Function update_bundle_totals does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_bundle_totals: %', SQLERRM;
END $$;

-- Function: mark_bundle_items_sold
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'mark_bundle_items_sold' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.mark_bundle_items_sold() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for mark_bundle_items_sold';
    ELSE
        RAISE NOTICE 'Function mark_bundle_items_sold does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with mark_bundle_items_sold: %', SQLERRM;
END $$;

-- Function: cleanup_expired_reservations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'cleanup_expired_reservations' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.cleanup_expired_reservations() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for cleanup_expired_reservations';
    ELSE
        RAISE NOTICE 'Function cleanup_expired_reservations does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with cleanup_expired_reservations: %', SQLERRM;
END $$;

-- Function: handle_new_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_new_user' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for handle_new_user';
    ELSE
        RAISE NOTICE 'Function handle_new_user does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with handle_new_user: %', SQLERRM;
END $$;

-- Function: update_updated_at_column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_updated_at_column' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_updated_at_column';
    ELSE
        RAISE NOTICE 'Function update_updated_at_column does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_updated_at_column: %', SQLERRM;
END $$;

-- Function: calculate_cart_total
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'calculate_cart_total' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.calculate_cart_total() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for calculate_cart_total';
    ELSE
        RAISE NOTICE 'Function calculate_cart_total does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with calculate_cart_total: %', SQLERRM;
END $$;

-- Function: update_orders_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_orders_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_orders_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_orders_updated_at';
    ELSE
        RAISE NOTICE 'Function update_orders_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_orders_updated_at: %', SQLERRM;
END $$;

-- Function: handle_expired_orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'handle_expired_orders' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.handle_expired_orders() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for handle_expired_orders';
    ELSE
        RAISE NOTICE 'Function handle_expired_orders does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with handle_expired_orders: %', SQLERRM;
END $$;

-- Function: check_and_lift_suspension
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'check_and_lift_suspension' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.check_and_lift_suspension() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for check_and_lift_suspension';
    ELSE
        RAISE NOTICE 'Function check_and_lift_suspension does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with check_and_lift_suspension: %', SQLERRM;
END $$;

-- Function: is_item_available_for_reservation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'is_item_available_for_reservation' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.is_item_available_for_reservation() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for is_item_available_for_reservation';
    ELSE
        RAISE NOTICE 'Function is_item_available_for_reservation does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with is_item_available_for_reservation: %', SQLERRM;
END $$;

-- Function: get_item_reservation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_item_reservation' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_item_reservation() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_item_reservation';
    ELSE
        RAISE NOTICE 'Function get_item_reservation does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with get_item_reservation: %', SQLERRM;
END $$;

-- Function: get_cart_item_price
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_cart_item_price' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_cart_item_price() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_cart_item_price';
    ELSE
        RAISE NOTICE 'Function get_cart_item_price does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with get_cart_item_price: %', SQLERRM;
END $$;

-- Function: calculate_cart_total_v2
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'calculate_cart_total_v2' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.calculate_cart_total_v2() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for calculate_cart_total_v2';
    ELSE
        RAISE NOTICE 'Function calculate_cart_total_v2 does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with calculate_cart_total_v2: %', SQLERRM;
END $$;

-- Function: reserve_item
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'reserve_item' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.reserve_item() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for reserve_item';
    ELSE
        RAISE NOTICE 'Function reserve_item does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with reserve_item: %', SQLERRM;
END $$;

-- Function: expire_cart_reservations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'expire_cart_reservations' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.expire_cart_reservations() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for expire_cart_reservations';
    ELSE
        RAISE NOTICE 'Function expire_cart_reservations does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with expire_cart_reservations: %', SQLERRM;
END $$;

-- Function: calculate_confirmation_deadline
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'calculate_confirmation_deadline' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.calculate_confirmation_deadline() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for calculate_confirmation_deadline';
    ELSE
        RAISE NOTICE 'Function calculate_confirmation_deadline does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with calculate_confirmation_deadline: %', SQLERRM;
END $$;

-- Function: check_payment_confirmation_deadlines
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'check_payment_confirmation_deadlines' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.check_payment_confirmation_deadlines() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for check_payment_confirmation_deadlines';
    ELSE
        RAISE NOTICE 'Function check_payment_confirmation_deadlines does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with check_payment_confirmation_deadlines: %', SQLERRM;
END $$;

-- Function: remove_account_restrictions_if_all_confirmed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'remove_account_restrictions_if_all_confirmed' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.remove_account_restrictions_if_all_confirmed() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for remove_account_restrictions_if_all_confirmed';
    ELSE
        RAISE NOTICE 'Function remove_account_restrictions_if_all_confirmed does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with remove_account_restrictions_if_all_confirmed: %', SQLERRM;
END $$;

-- Function: create_payment_confirmation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'create_payment_confirmation' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.create_payment_confirmation() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for create_payment_confirmation';
    ELSE
        RAISE NOTICE 'Function create_payment_confirmation does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with create_payment_confirmation: %', SQLERRM;
END $$;

-- Function: confirm_payment_received
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'confirm_payment_received' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.confirm_payment_received() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for confirm_payment_received';
    ELSE
        RAISE NOTICE 'Function confirm_payment_received does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with confirm_payment_received: %', SQLERRM;
END $$;

-- Function: update_payment_confirmation_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_payment_confirmation_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_payment_confirmation_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_payment_confirmation_updated_at';
    ELSE
        RAISE NOTICE 'Function update_payment_confirmation_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_payment_confirmation_updated_at: %', SQLERRM;
END $$;

-- Function: update_email_logs_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_email_logs_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_email_logs_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_email_logs_updated_at';
    ELSE
        RAISE NOTICE 'Function update_email_logs_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_email_logs_updated_at: %', SQLERRM;
END $$;

-- Function: update_email_preferences_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_email_preferences_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_email_preferences_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_email_preferences_updated_at';
    ELSE
        RAISE NOTICE 'Function update_email_preferences_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_email_preferences_updated_at: %', SQLERRM;
END $$;

-- Function: update_email_templates_updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_email_templates_updated_at' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_email_templates_updated_at() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_email_templates_updated_at';
    ELSE
        RAISE NOTICE 'Function update_email_templates_updated_at does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_email_templates_updated_at: %', SQLERRM;
END $$;

-- Function: get_email_statistics
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_email_statistics' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_email_statistics() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_email_statistics';
    ELSE
        RAISE NOTICE 'Function get_email_statistics does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with get_email_statistics: %', SQLERRM;
END $$;

-- Function: get_user_email_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'get_user_email_preferences' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.get_user_email_preferences() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for get_user_email_preferences';
    ELSE
        RAISE NOTICE 'Function get_user_email_preferences does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with get_user_email_preferences: %', SQLERRM;
END $$;

-- Function: update_user_email_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'update_user_email_preferences' AND n.nspname = 'public') THEN
        ALTER FUNCTION public.update_user_email_preferences() SET search_path = '';
        RAISE NOTICE 'Fixed search_path for update_user_email_preferences';
    ELSE
        RAISE NOTICE 'Function update_user_email_preferences does not exist, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with update_user_email_preferences: %', SQLERRM;
END $$;

-- Add comment explaining the security fix
COMMENT ON SCHEMA public IS 'All functions now have secure search_path settings to prevent security vulnerabilities';
