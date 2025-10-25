/**
 * Cart Utility Functions
 * Handles cart operations with reservation system to prevent double-selling
 */

import { supabase } from '@/lib/supabase';

const RESERVATION_DURATION_MINUTES = 10;

/**
 * Add item to cart with reservation
 * @param {Object} params - Parameters for adding to cart
 * @param {string} params.itemId - ID of the item to add
 * @param {string} params.buyerId - ID of the buyer
 * @param {number} params.quantity - Quantity to add (default: 1)
 * @param {number|null} params.negotiatedPrice - Negotiated price if applicable
 * @param {string} params.priceSource - Source of the price (original, negotiated, agent)
 * @returns {Promise<Object>} Result object with success status and data/error
 */
export async function addToCart({
  itemId,
  buyerId,
  quantity = 1,
  negotiatedPrice = null,
  priceSource = 'original'
}) {
  try {
    console.log('🛒 Adding item to cart:', { itemId, buyerId, quantity, negotiatedPrice, priceSource });

    // Step 1: Check if item is available
    const { data: available, error: availError } = await supabase
      .rpc('check_item_availability', {
        p_item_id: itemId,
        p_buyer_id: buyerId
      });

    if (availError) {
      console.error('❌ Error checking availability:', availError);
      throw availError;
    }

    if (!available) {
      return {
        success: false,
        error: 'Item is no longer available or reserved by another user'
      };
    }

    // Step 2: Calculate reservation expiry
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_DURATION_MINUTES);

    console.log('⏰ Reservation expires at:', reservedUntil.toISOString());

    // Step 3: Check if item is already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('item_id', itemId)
      .eq('buyer_id', buyerId)
      .single();

    let data;
    let error;

    if (existingItem) {
      // Item already in cart - update the reservation time
      console.log('🔄 Item already in cart, extending reservation');
      const result = await supabase
        .from('cart_items')
        .update({
          reserved_until: reservedUntil.toISOString(),
          reservation_status: 'active',
          negotiated_price: negotiatedPrice || existingItem.negotiated_price,
          price_source: priceSource || existingItem.price_source
        })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Add new item to cart
      const result = await supabase
        .from('cart_items')
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          quantity,
          negotiated_price: negotiatedPrice,
          price_source: priceSource,
          reserved_until: reservedUntil.toISOString(),
          reservation_status: 'active'
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }

    console.log('✅ Item added to cart successfully:', data);

    return {
      success: true,
      data,
      reservedUntil
    };

  } catch (error) {
    console.error('❌ Add to cart error:', error);
    return {
      success: false,
      error: error.message || 'Failed to add item to cart'
    };
  }
}

/**
 * Extend reservation (when user is actively viewing cart)
 * @param {string} cartItemId - ID of the cart item
 * @param {string} buyerId - ID of the buyer
 * @returns {Promise<Object>} Result object with success status
 */
export async function extendReservation(cartItemId, buyerId) {
  try {
    console.log('⏰ Extending reservation for cart item:', cartItemId);

    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_DURATION_MINUTES);

    const { error } = await supabase
      .from('cart_items')
      .update({
        reserved_until: reservedUntil.toISOString()
      })
      .eq('id', cartItemId)
      .eq('buyer_id', buyerId)
      .eq('reservation_status', 'active');

    if (error) {
      console.error('❌ Error extending reservation:', error);
      throw error;
    }

    console.log('✅ Reservation extended successfully');

    return { 
      success: true,
      reservedUntil
    };
  } catch (error) {
    console.error('❌ Extend reservation error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to extend reservation'
    };
  }
}

/**
 * Remove item from cart
 * @param {string} cartItemId - ID of the cart item to remove
 * @param {string} buyerId - ID of the buyer (for security)
 * @returns {Promise<Object>} Result object with success status
 */
export async function removeFromCart(cartItemId, buyerId) {
  try {
    console.log('🗑️ Removing item from cart:', cartItemId);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('buyer_id', buyerId);

    if (error) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    }

    console.log('✅ Item removed from cart successfully');

    return { success: true };
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to remove item from cart'
    };
  }
}

/**
 * Check if cart items are still available
 * @param {Array} cartItems - Array of cart items to check
 * @param {string} buyerId - ID of the buyer
 * @returns {Promise<Object>} Result with available items and unavailable item IDs
 */
export async function checkCartItemAvailability(cartItems, buyerId) {
  try {
    console.log('🔍 Checking cart item availability:', cartItems.length, 'items');

    const unavailableItems = [];
    const availableItems = [];

    for (const cartItem of cartItems) {
      const { data: available, error } = await supabase
        .rpc('check_item_availability', {
          p_item_id: cartItem.item.id,
          p_buyer_id: buyerId
        });

      if (error) {
        console.error('❌ Error checking availability for item:', cartItem.item.id, error);
        continue;
      }

      if (available) {
        availableItems.push(cartItem);
      } else {
        unavailableItems.push(cartItem.item.id);
      }
    }

    console.log('✅ Availability check complete:', {
      available: availableItems.length,
      unavailable: unavailableItems.length
    });

    return {
      success: true,
      availableItems,
      unavailableItemIds: unavailableItems
    };
  } catch (error) {
    console.error('❌ Check availability error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check item availability'
    };
  }
}

/**
 * Get time remaining for a reservation
 * @param {string|Date} reservedUntil - Reservation expiry timestamp
 * @returns {Object} Time remaining object with minutes, seconds, and expired status
 */
export function getTimeRemaining(reservedUntil) {
  if (!reservedUntil) return null;
  
  const now = new Date();
  const expiry = new Date(reservedUntil);
  const diff = expiry - now;
  
  if (diff <= 0) return { expired: true };
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return { minutes, seconds, expired: false };
}

/**
 * Mark item as sold (for checkout completion)
 * @param {string} itemId - ID of the item to mark as sold
 * @param {string} buyerId - ID of the buyer
 * @returns {Promise<Object>} Result object with success status
 */
export async function markItemSold(itemId, buyerId) {
  try {
    console.log('💰 Marking item as sold:', itemId, 'by buyer:', buyerId);

    const { data: success, error } = await supabase
      .rpc('mark_item_sold', {
        p_item_id: itemId,
        p_buyer_id: buyerId
      });

    if (error) {
      console.error('❌ Error marking item as sold:', error);
      throw error;
    }

    if (!success) {
      return {
        success: false,
        error: 'Item could not be marked as sold (may have been sold to someone else)'
      };
    }

    console.log('✅ Item marked as sold successfully');

    return { success: true };
  } catch (error) {
    console.error('❌ Mark item sold error:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark item as sold'
    };
  }
}

/**
 * Clean up expired reservations (maintenance function)
 * @returns {Promise<Object>} Result object with cleanup count
 */
export async function cleanupExpiredReservations() {
  try {
    console.log('🧹 Cleaning up expired reservations...');

    const { data: deletedCount, error } = await supabase
      .rpc('cleanup_expired_reservations');

    if (error) {
      console.error('❌ Error cleaning up expired reservations:', error);
      throw error;
    }

    console.log('✅ Cleanup complete, removed:', deletedCount, 'expired reservations');

    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return {
      success: false,
      error: error.message || 'Failed to cleanup expired reservations'
    };
  }
}
