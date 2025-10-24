import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * API endpoint to propose a trade between users
 * Creates trade offer and reserves items
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      target_item_id,
      target_seller_id,
      offered_item_ids,
      offeror_id,
      cash_adjustment = 0,
      message = null
    } = req.body;

    // Validation
    if (!target_item_id || !target_seller_id || !offeror_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!offered_item_ids || offered_item_ids.length === 0) {
      return res.status(400).json({ error: 'Must offer at least one item' });
    }

    if (cash_adjustment < 0 || cash_adjustment > 500) {
      return res.status(400).json({ error: 'Cash adjustment must be between $0 and $500' });
    }

    // Check if user is trying to trade with themselves
    if (offeror_id === target_seller_id) {
      return res.status(400).json({ error: 'Cannot trade with yourself' });
    }

    // Check if both users have trading enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, open_to_trades')
      .in('id', [offeror_id, target_seller_id]);

    if (profilesError) throw profilesError;

    const offerorProfile = profiles.find(p => p.id === offeror_id);
    const targetProfile = profiles.find(p => p.id === target_seller_id);

    if (!offerorProfile?.open_to_trades || !targetProfile?.open_to_trades) {
      return res.status(400).json({ 
        error: 'Trading is not enabled for one or both users. Both parties must enable trading in settings.' 
      });
    }

    // Verify target item exists and is available
    const { data: targetItem, error: targetError } = await supabase
      .from('items')
      .select('*')
      .eq('id', target_item_id)
      .eq('status', 'active')
      .single();

    if (targetError || !targetItem) {
      return res.status(404).json({ error: 'Target item not found or not available' });
    }

    if (targetItem.seller_id !== target_seller_id) {
      return res.status(400).json({ error: 'Target item does not belong to specified seller' });
    }

    // Verify offered items exist, are available, and belong to offeror
    const { data: offeredItems, error: offeredError } = await supabase
      .from('items')
      .select('*')
      .in('id', offered_item_ids)
      .eq('seller_id', offeror_id)
      .eq('status', 'active');

    if (offeredError) throw offeredError;

    if (!offeredItems || offeredItems.length !== offered_item_ids.length) {
      return res.status(400).json({ 
        error: 'Some offered items are not found, not available, or do not belong to you' 
      });
    }

    // Check if there's already a pending trade for the target item
    const { data: existingTrade, error: existingError } = await supabase
      .from('trade_offers')
      .select('id')
      .eq('item_id_requested', target_item_id)
      .eq('status', 'pending')
      .single();

    if (existingTrade) {
      return res.status(400).json({ 
        error: 'There is already a pending trade offer for this item' 
      });
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create trade offer
    const { data: tradeOffer, error: tradeError } = await supabase
      .from('trade_offers')
      .insert({
        item_id_requested: target_item_id,
        offeror_id: offeror_id,
        requestee_id: target_seller_id,
        cash_adjustment: cash_adjustment,
        message: message,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    // Create trade_items records for offered items
    const tradeItems = offered_item_ids.map(item_id => ({
      trade_offer_id: tradeOffer.id,
      item_id: item_id
    }));

    const { error: itemsError } = await supabase
      .from('trade_items')
      .insert(tradeItems);

    if (itemsError) throw itemsError;

    // Reserve the offered items (prevent them from being sold/traded while offer is pending)
    const reservedUntil = expiresAt.toISOString();
    
    const { error: reserveError } = await supabase
      .from('items')
      .update({ 
        status: 'reserved',
        reserved_until: reservedUntil
      })
      .in('id', offered_item_ids);

    if (reserveError) {
      console.error('Error reserving items:', reserveError);
      // Don't fail the request if reservation fails, just log it
    }

    // Send notification to target seller via messaging
    try {
      // Get offeror name first
      const { data: offerorProfileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', offeror_id)
        .single();

      // Create or get conversation directly via Supabase
      let conversationId;
      
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${offeror_id},user2_id.eq.${target_seller_id}),and(user1_id.eq.${target_seller_id},user2_id.eq.${offeror_id})`)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user1_id: offeror_id,
            user2_id: target_seller_id
          })
          .select('id')
          .single();
        
        if (newConv) conversationId = newConv.id;
      }

      if (conversationId) {
        // Send notification message directly via Supabase
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: offeror_id,
            content: `🔄 Trade Offer: ${offerorProfileData?.full_name || 'Someone'} wants to trade ${offeredItems.length} item${offeredItems.length > 1 ? 's' : ''}${cash_adjustment > 0 ? ` + $${cash_adjustment}` : ''} for your "${targetItem.title || 'item'}"!\n\nView the offer in Trade Offers to accept or reject. Offer expires in 7 days.`,
            is_read: false
          });
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return res.status(200).json({
      success: true,
      trade_offer_id: tradeOffer.id,
      expires_at: expiresAt.toISOString(),
      message: 'Trade offer sent successfully'
    });

  } catch (error) {
    console.error('Error proposing trade:', error);
    return res.status(500).json({ 
      error: 'Failed to create trade offer',
      details: error.message 
    });
  }
}

