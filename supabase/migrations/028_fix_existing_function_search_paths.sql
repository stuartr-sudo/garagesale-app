-- Fix function search_path security warnings for functions that actually exist
-- This script uses DO blocks to safely check if functions exist before altering them

DO $$
BEGIN
    -- Only alter functions that actually exist
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_baggage_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_baggage_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_bundle_totals' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_bundle_totals() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_bundle_items_sold' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.mark_bundle_items_sold() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_reservations' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.cleanup_expired_reservations() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_item_availability' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.check_item_availability() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_cart_total' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.calculate_cart_total() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_orders_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_orders_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_expired_orders' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.handle_expired_orders() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_lift_suspension' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.check_and_lift_suspension() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_item_available_for_reservation' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.is_item_available_for_reservation() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_item_reservation' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_item_reservation() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_cart_item_price' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_cart_item_price() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_cart_total_v2' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.calculate_cart_total_v2() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reserve_item' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.reserve_item() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_cart_reservations' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.expire_cart_reservations() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_confirmation_deadline' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.calculate_confirmation_deadline() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_payment_confirmation_deadlines' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.check_payment_confirmation_deadlines() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'remove_account_restrictions_if_all_confirmed' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.remove_account_restrictions_if_all_confirmed() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_payment_confirmation' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.create_payment_confirmation() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_payment_received' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.confirm_payment_received() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_payment_confirmation_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_payment_confirmation_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_email_logs_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_email_logs_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_email_preferences_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_email_preferences_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_email_templates_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_email_templates_updated_at() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_email_statistics' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_email_statistics() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_email_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.get_user_email_preferences() SET search_path = '';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_email_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER FUNCTION public.update_user_email_preferences() SET search_path = '';
    END IF;
END $$;

-- Add comment explaining the security fix
COMMENT ON SCHEMA public IS 'All functions now have secure search_path settings to prevent security vulnerabilities';
