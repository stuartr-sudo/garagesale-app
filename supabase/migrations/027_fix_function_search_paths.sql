-- Fix function search_path security warnings by setting search_path for all functions
-- This prevents potential security issues with mutable search_path

-- Update all functions to have secure search_path
ALTER FUNCTION public.update_baggage_updated_at() SET search_path = '';
ALTER FUNCTION public.update_bundle_totals() SET search_path = '';
ALTER FUNCTION public.mark_bundle_items_sold() SET search_path = '';
ALTER FUNCTION public.mark_item_sold() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_reservations() SET search_path = '';
ALTER FUNCTION public.check_item_availability() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.calculate_cart_total() SET search_path = '';
ALTER FUNCTION public.update_orders_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_expired_orders() SET search_path = '';
ALTER FUNCTION public.check_and_lift_suspension() SET search_path = '';
ALTER FUNCTION public.is_item_available_for_reservation() SET search_path = '';
ALTER FUNCTION public.get_item_reservation() SET search_path = '';
ALTER FUNCTION public.get_cart_item_price() SET search_path = '';
ALTER FUNCTION public.calculate_cart_total_v2() SET search_path = '';
ALTER FUNCTION public.reserve_item() SET search_path = '';
ALTER FUNCTION public.expire_cart_reservations() SET search_path = '';
ALTER FUNCTION public.calculate_confirmation_deadline() SET search_path = '';
ALTER FUNCTION public.check_payment_confirmation_deadlines() SET search_path = '';
ALTER FUNCTION public.remove_account_restrictions_if_all_confirmed() SET search_path = '';
ALTER FUNCTION public.create_payment_confirmation() SET search_path = '';
ALTER FUNCTION public.confirm_payment_received() SET search_path = '';
ALTER FUNCTION public.update_payment_confirmation_updated_at() SET search_path = '';
ALTER FUNCTION public.update_email_logs_updated_at() SET search_path = '';
ALTER FUNCTION public.update_email_preferences_updated_at() SET search_path = '';
ALTER FUNCTION public.update_email_templates_updated_at() SET search_path = '';
ALTER FUNCTION public.get_email_statistics() SET search_path = '';
ALTER FUNCTION public.get_user_email_preferences() SET search_path = '';
ALTER FUNCTION public.update_user_email_preferences() SET search_path = '';

-- Add comment explaining the security fix
COMMENT ON SCHEMA public IS 'All functions now have secure search_path settings to prevent security vulnerabilities';
