import { supabase } from '@/lib/supabase';

/**
 * Get active special offers for a specific item
 */
export async function getItemSpecialOffers(itemId) {
  try {
    console.log('🔍 Fetching offers for item:', itemId);
    
    // First, get all active offers
    const { data: allOffers, error } = await supabase
      .from('special_offers')
      .select('*')
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching special offers:', error);
      throw error;
    }
    
    console.log('📦 All active offers:', allOffers?.length || 0);
    
    // Filter offers that include this item
    const itemOffers = (allOffers || []).filter(offer => 
      offer.item_ids && Array.isArray(offer.item_ids) && offer.item_ids.includes(itemId)
    );
    
    console.log('✅ Found offers for item:', itemOffers.length, itemOffers);
    return itemOffers;
  } catch (error) {
    console.error('❌ Exception in getItemSpecialOffers:', error);
    return [];
  }
}

/**
 * Get all active special offers for a seller
 */
export async function getSellerSpecialOffers(sellerId) {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching seller special offers:', error);
    return [];
  }
}

/**
 * Get all items that are part of a specific offer
 */
export async function getOfferItems(offerId) {
  try {
    const { data: offer, error: offerError } = await supabase
      .from('special_offers')
      .select('item_ids')
      .eq('id', offerId)
      .single();

    if (offerError) throw offerError;

    if (!offer?.item_ids || offer.item_ids.length === 0) {
      return [];
    }

    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .in('id', offer.item_ids);

    if (itemsError) throw itemsError;
    return items || [];
  } catch (error) {
    console.error('Error fetching offer items:', error);
    return [];
  }
}

/**
 * Format offer text for display
 */
export function formatOfferText(offer) {
  const config = offer.config || {};
  
  switch (offer.offer_type) {
    case 'bogo':
      return `Buy ${config.buy_quantity || 1}, Get ${config.get_quantity || 1} Free!`;
    
    case 'bulk_discount':
      return `Buy ${config.min_quantity || 2}+, Save ${config.discount_percentage || 0}%`;
    
    case 'percentage_off':
      return `${config.discount_percentage || 0}% OFF`;
    
    case 'bundle':
      return `Bundle Deal: ${config.discount_percentage || 0}% OFF`;
    
    default:
      return offer.title || 'Special Offer';
  }
}

/**
 * Get offer badge color based on type
 */
export function getOfferBadgeColor(offerType) {
  switch (offerType) {
    case 'bogo':
      return 'bg-gradient-to-r from-green-500 to-emerald-600';
    case 'bulk_discount':
      return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    case 'percentage_off':
      return 'bg-gradient-to-r from-orange-500 to-red-600';
    case 'bundle':
      return 'bg-gradient-to-r from-purple-500 to-pink-600';
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600';
  }
}

