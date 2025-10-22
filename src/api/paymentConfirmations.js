/**
 * Payment Confirmation API Functions
 * Handles payment confirmation system for sellers
 */

import { supabase } from '@/lib/supabase';
import { calculateConfirmationDeadline, getUserTimezone } from '@/utils/timezone';

/**
 * Create a payment confirmation record
 * @param {Object} params - Payment confirmation parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.sellerId - Seller ID
 * @param {string} params.buyerId - Buyer ID
 * @param {string} params.itemId - Item ID
 * @param {number} params.amount - Payment amount
 * @param {string} params.sellerTimezone - Seller's timezone
 * @returns {Promise<Object>} Result object
 */
export async function createPaymentConfirmation({
  orderId,
  sellerId,
  buyerId,
  itemId,
  amount,
  sellerTimezone = null
}) {
  try {
    console.log('🔄 Creating payment confirmation:', {
      orderId,
      sellerId,
      buyerId,
      itemId,
      amount
    });

    const timezone = sellerTimezone || getUserTimezone();

    const { data, error } = await supabase
      .rpc('create_payment_confirmation', {
        p_order_id: orderId,
        p_seller_id: sellerId,
        p_buyer_id: buyerId,
        p_item_id: itemId,
        p_amount: amount,
        p_seller_timezone: timezone
      });

    if (error) {
      console.error('❌ Error creating payment confirmation:', error);
      throw error;
    }

    console.log('✅ Payment confirmation created:', data);

    return {
      success: true,
      confirmationId: data
    };
  } catch (error) {
    console.error('❌ Create payment confirmation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment confirmation'
    };
  }
}

/**
 * Get pending payment confirmations for a seller
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} Result object with confirmations
 */
export async function getPendingConfirmations(sellerId) {
  try {
    console.log('🔍 Getting pending confirmations for seller:', sellerId);

    const { data, error } = await supabase
      .from('payment_confirmations')
      .select(`
        id,
        order_id,
        amount,
        payment_confirmed_at,
        confirmation_deadline,
        status,
        created_at,
        item:items(
          id,
          title,
          image_urls
        ),
        buyer:buyer_id(
          id,
          email,
          full_name
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'pending')
      .order('confirmation_deadline', { ascending: true });

    if (error) {
      console.error('❌ Error fetching pending confirmations:', error);
      throw error;
    }

    console.log('✅ Found pending confirmations:', data?.length || 0);

    return {
      success: true,
      confirmations: data || []
    };
  } catch (error) {
    console.error('❌ Get pending confirmations error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch pending confirmations'
    };
  }
}

/**
 * Confirm payment received by seller
 * @param {string} confirmationId - Confirmation ID
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} Result object
 */
export async function confirmPaymentReceived(confirmationId, sellerId) {
  try {
    console.log('✅ Confirming payment received:', { confirmationId, sellerId });

    const { data, error } = await supabase
      .rpc('confirm_payment_received', {
        p_confirmation_id: confirmationId,
        p_seller_id: sellerId
      });

    if (error) {
      console.error('❌ Error confirming payment:', error);
      throw error;
    }

    console.log('✅ Payment confirmed successfully');

    return {
      success: true,
      confirmed: data
    };
  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    return {
      success: false,
      error: error.message || 'Failed to confirm payment'
    };
  }
}

/**
 * Check if seller account is restricted
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} Result object with restriction status
 */
export async function checkAccountRestrictions(sellerId) {
  try {
    console.log('🔍 Checking account restrictions for seller:', sellerId);

    const { data, error } = await supabase
      .from('profiles')
      .select('account_restricted, restriction_reason, restriction_applied_at')
      .eq('id', sellerId)
      .single();

    if (error) {
      console.error('❌ Error checking account restrictions:', error);
      throw error;
    }

    return {
      success: true,
      isRestricted: data?.account_restricted || false,
      restrictionReason: data?.restriction_reason,
      restrictionAppliedAt: data?.restriction_applied_at
    };
  } catch (error) {
    console.error('❌ Check account restrictions error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check account restrictions'
    };
  }
}

/**
 * Submit support request
 * @param {Object} params - Support request parameters
 * @param {string} params.orderId - Order ID (optional)
 * @param {string} params.itemName - Item name
 * @param {string} params.issueDescription - Issue description
 * @param {string} params.userEmail - User email
 * @returns {Promise<Object>} Result object
 */
export async function submitSupportRequest({
  orderId,
  itemName,
  issueDescription,
  userEmail
}) {
  try {
    console.log('📧 Submitting support request:', {
      orderId,
      itemName,
      issueDescription,
      userEmail
    });

    const { data, error } = await supabase
      .from('support_requests')
      .insert({
        order_id: orderId,
        item_name: itemName,
        issue_description: issueDescription,
        user_email: userEmail
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error submitting support request:', error);
      throw error;
    }

    console.log('✅ Support request submitted:', data.id);

    return {
      success: true,
      requestId: data.id
    };
  } catch (error) {
    console.error('❌ Submit support request error:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit support request'
    };
  }
}

/**
 * Get all pending confirmations count for a seller
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} Result object with count
 */
export async function getPendingConfirmationsCount(sellerId) {
  try {
    const { count, error } = await supabase
      .from('payment_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error getting pending count:', error);
      throw error;
    }

    return {
      success: true,
      count: count || 0
    };
  } catch (error) {
    console.error('❌ Get pending count error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get pending count'
    };
  }
}
