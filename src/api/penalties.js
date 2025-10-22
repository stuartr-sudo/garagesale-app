import { supabase } from '../lib/supabase';

/**
 * Check if a user's suspension has expired and lift it if necessary
 * @param {string} userId - The user's ID
 * @returns {Promise<{isSuspended: boolean, isBanned: boolean, suspensionEndDate: string|null, banReason: string|null}>}
 */
export async function checkUserStatus(userId) {
  try {
    // Call the database function to check and potentially lift suspension
    const { data: isSuspended, error: funcError } = await supabase
      .rpc('check_and_lift_suspension', { user_id: userId });

    if (funcError) {
      console.error('Error checking suspension status:', funcError);
    }

    // Get the current user status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_suspended, suspension_end_date, is_banned, ban_reason, incomplete_transaction_count, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user status:', error);
      return { isSuspended: false, isBanned: false, suspensionEndDate: null, banReason: null };
    }

    // Admin and super_admin users are exempt from suspensions and bans
    if (profile.role === 'admin' || profile.role === 'super_admin') {
      return {
        isSuspended: false,
        isBanned: false,
        suspensionEndDate: null,
        banReason: null,
        incompleteTransactionCount: profile.incomplete_transaction_count
      };
    }

    return {
      isSuspended: profile.is_suspended,
      isBanned: profile.is_banned,
      suspensionEndDate: profile.suspension_end_date,
      banReason: profile.ban_reason,
      incompleteTransactionCount: profile.incomplete_transaction_count
    };
  } catch (error) {
    console.error('Error in checkUserStatus:', error);
    return { isSuspended: false, isBanned: false, suspensionEndDate: null, banReason: null };
  }
}

/**
 * Mark an order as incomplete and apply penalties to the buyer
 * @param {string} orderId - The order ID
 * @param {string} buyerId - The buyer's user ID
 * @param {string} reason - Reason for marking incomplete
 */
export async function markOrderIncomplete(orderId, buyerId, reason = 'Payment not completed within deadline') {
  try {
    // First, check if this order has already been marked incomplete
    const { data: order, error: orderCheckError } = await supabase
      .from('orders')
      .select('marked_incomplete')
      .eq('id', orderId)
      .single();

    if (orderCheckError) {
      console.error('Error checking order status:', orderCheckError);
      return { success: false, error: orderCheckError };
    }

    // If already marked, don't double-penalize
    if (order.marked_incomplete) {
      console.log('Order already marked incomplete, skipping penalty');
      return { success: true, alreadyMarked: true };
    }

    // Get the buyer's current penalty count and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('incomplete_transaction_count, is_banned, role')
      .eq('id', buyerId)
      .single();

    if (profileError) {
      console.error('Error fetching buyer profile:', profileError);
      return { success: false, error: profileError };
    }

    // If already banned, no need to proceed
    if (profile.is_banned) {
      console.log('User is already banned');
      return { success: true, alreadyBanned: true };
    }

    // Skip penalties for admin and super_admin users
    if (profile.role === 'admin' || profile.role === 'super_admin') {
      console.log(`Admin user ${buyerId} exempted from penalties`);
      // Still mark the order as incomplete but don't apply penalties
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          marked_incomplete: true,
          incomplete_reason: reason,
          status: 'expired'
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Error marking order incomplete:', orderUpdateError);
        return { success: false, error: orderUpdateError };
      }

      // Return the item to active status
      const { data: orderData } = await supabase
        .from('orders')
        .select('item_id')
        .eq('id', orderId)
        .single();

      if (orderData?.item_id) {
        await supabase
          .from('items')
          .update({ status: 'active' })
          .eq('id', orderData.item_id);
      }

      return {
        success: true,
        penaltyApplied: 'none',
        newCount: profile.incomplete_transaction_count || 0,
        adminExempted: true
      };
    }

    const currentCount = profile.incomplete_transaction_count || 0;
    const newCount = currentCount + 1;

    // Determine the penalty
    let updateData = {
      incomplete_transaction_count: newCount,
      last_incomplete_transaction_date: new Date().toISOString()
    };

    if (newCount === 1) {
      // First offense: 24-hour suspension
      const suspensionEnd = new Date();
      suspensionEnd.setHours(suspensionEnd.getHours() + 24);
      
      updateData.is_suspended = true;
      updateData.suspension_end_date = suspensionEnd.toISOString();
      
      console.log(`First offense for user ${buyerId}: 24-hour suspension until ${suspensionEnd}`);
    } else if (newCount >= 2) {
      // Second offense: permanent ban
      updateData.is_suspended = false; // Remove suspension
      updateData.suspension_end_date = null;
      updateData.is_banned = true;
      updateData.ban_reason = 'Multiple incomplete transactions (failed to complete payment after accepting offers)';
      
      console.log(`Second offense for user ${buyerId}: permanent ban`);
    }

    // Update the buyer's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', buyerId);

    if (updateError) {
      console.error('Error updating buyer profile:', updateError);
      return { success: false, error: updateError };
    }

    // Mark the order as incomplete
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        marked_incomplete: true,
        incomplete_reason: reason,
        status: 'expired'
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Error marking order incomplete:', orderUpdateError);
      return { success: false, error: orderUpdateError };
    }

    // Return the item to active status
    const { data: orderData } = await supabase
      .from('orders')
      .select('item_id')
      .eq('id', orderId)
      .single();

    if (orderData?.item_id) {
      await supabase
        .from('items')
        .update({ status: 'active' })
        .eq('id', orderData.item_id);
    }

    return {
      success: true,
      penaltyApplied: newCount === 1 ? 'suspension' : newCount >= 2 ? 'ban' : 'none',
      newCount
    };
  } catch (error) {
    console.error('Error in markOrderIncomplete:', error);
    return { success: false, error };
  }
}

/**
 * Check for expired orders and apply penalties automatically
 * This should be called periodically (e.g., via a cron job or when users log in)
 */
export async function checkExpiredOrders() {
  try {
    const now = new Date().toISOString();

    // Find all orders that have passed their payment deadline and haven't been marked incomplete
    const { data: expiredOrders, error } = await supabase
      .from('orders')
      .select('id, buyer_id, payment_deadline, status')
      .lt('payment_deadline', now)
      .in('status', ['awaiting_payment', 'payment_pending_seller_confirmation'])
      .eq('marked_incomplete', false);

    if (error) {
      console.error('Error fetching expired orders:', error);
      return { success: false, error };
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return { success: true, expiredCount: 0 };
    }

    // Process each expired order
    const results = [];
    for (const order of expiredOrders) {
      const result = await markOrderIncomplete(
        order.id,
        order.buyer_id,
        `Payment deadline expired on ${new Date(order.payment_deadline).toLocaleString()}`
      );
      results.push({ orderId: order.id, ...result });
    }

    return {
      success: true,
      expiredCount: expiredOrders.length,
      results
    };
  } catch (error) {
    console.error('Error in checkExpiredOrders:', error);
    return { success: false, error };
  }
}

