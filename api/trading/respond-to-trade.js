import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceKey
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * API endpoint to accept or reject a trade offer
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trade_id, user_id, action } = req.body;

    // Validation
    if (!trade_id || !user_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "accept" or "reject"' });
    }

    // Get trade offer with all details
    const { data: trade, error: tradeError } = await supabase
      .from('trade_offers')
      .select(`
        *,
        offered_items:trade_items(
          item:items(*)
        ),
        requested_item:items!trade_offers_item_id_requested_fkey(*)
      `)
      .eq('id', trade_id)
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade offer not found' });
    }

    // Verify user is the requestee
    if (trade.requestee_id !== user_id) {
      return res.status(403).json({ error: 'Only the requestee can respond to this trade' });
    }

    // Check if trade is still pending
    if (trade.status !== 'pending') {
      return res.status(400).json({ 
        error: `Trade is ${trade.status}, cannot ${action}` 
      });
    }

    // Check if expired
    if (trade.expires_at && new Date(trade.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This trade offer has expired' });
    }

    if (action === 'reject') {
      // REJECT TRADE
      const { error: updateError } = await supabase
        .from('trade_offers')
        .update({ 
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', trade_id);

      if (updateError) throw updateError;

      // Release reserved items
      const offeredItemIds = trade.offered_items.map(ti => ti.item.id);
      
      const { error: releaseError } = await supabase
        .from('items')
        .update({ 
          status: 'available',
          reserved_until: null
        })
        .in('id', offeredItemIds);

      if (releaseError) {
        console.error('Error releasing items:', releaseError);
      }

      // Notify offeror
      try {
        const conversationResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/create-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user1_id: trade.offeror_id,
            user2_id: user_id
          })
        });

        if (conversationResponse.ok) {
          const { conversation_id } = await conversationResponse.json();
          
          await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id,
              sender_id: user_id,
              content: `❌ Trade Rejected: Your trade offer for "${trade.requested_item.title}" was declined.`
            })
          });
        }
      } catch (error) {
        console.error('Error sending rejection notification:', error);
      }

      return res.status(200).json({
        success: true,
        action: 'rejected',
        message: 'Trade offer rejected'
      });

    } else {
      // ACCEPT TRADE
      
      // Verify all items are still available
      const offeredItemIds = trade.offered_items.map(ti => ti.item.id);
      
      const { data: offeredItems, error: itemsError } = await supabase
        .from('items')
        .select('id, status, seller_id')
        .in('id', offeredItemIds);

      if (itemsError) throw itemsError;

      const unavailableItems = offeredItems.filter(item => 
        item.status !== 'reserved' && item.status !== 'available'
      );

      if (unavailableItems.length > 0) {
        return res.status(400).json({ 
          error: 'Some offered items are no longer available' 
        });
      }

      // Verify requested item is still available
      const { data: requestedItem } = await supabase
        .from('items')
        .select('id, status, seller_id')
        .eq('id', trade.item_id_requested)
        .single();

      if (!requestedItem || (requestedItem.status !== 'available' && requestedItem.status !== 'reserved')) {
        return res.status(400).json({ 
          error: 'Requested item is no longer available' 
        });
      }

      // Update trade status
      const { error: updateError } = await supabase
        .from('trade_offers')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', trade_id);

      if (updateError) throw updateError;

      // Mark all items as traded (sold via trade)
      const allItemIds = [...offeredItemIds, trade.item_id_requested];
      
      const { error: markError } = await supabase
        .from('items')
        .update({ 
          status: 'sold',
          sold_at: new Date().toISOString(),
          reserved_until: null
        })
        .in('id', allItemIds);

      if (markError) throw markError;

      // Create transaction records for tracking
      const transactions = [];

      // Transaction for requested item (going to offeror)
      transactions.push({
        item_id: trade.item_id_requested,
        buyer_id: trade.offeror_id,
        seller_id: trade.requestee_id,
        amount: trade.requested_item.price || 0,
        payment_method: 'trade',
        payment_status: 'completed',
        created_at: new Date().toISOString()
      });

      // Transactions for offered items (going to requestee)
      trade.offered_items.forEach(ti => {
        transactions.push({
          item_id: ti.item.id,
          buyer_id: trade.requestee_id,
          seller_id: trade.offeror_id,
          amount: ti.item.price || 0,
          payment_method: 'trade',
          payment_status: 'completed',
          created_at: new Date().toISOString()
        });
      });

      // Insert transactions
      const { error: transError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (transError) {
        console.error('Error creating transactions:', transError);
        // Don't fail if transaction logging fails
      }

      // Handle cash adjustment if present
      if (trade.cash_adjustment > 0) {
        // In a real system, this would trigger a payment flow
        // For now, we just log it
        console.log(`Cash adjustment of $${trade.cash_adjustment} from ${trade.offeror_id} to ${trade.requestee_id}`);
        
        // Create a transaction record for the cash
        await supabase
          .from('balance_transactions')
          .insert({
            user_id: trade.requestee_id,
            amount: trade.cash_adjustment,
            type: 'trade_cash_in',
            related_entity_type: 'trade_offer',
            related_entity_id: trade_id,
            description: `Cash received from trade offer`
          });

        await supabase
          .from('balance_transactions')
          .insert({
            user_id: trade.offeror_id,
            amount: -trade.cash_adjustment,
            type: 'trade_cash_out',
            related_entity_type: 'trade_offer',
            related_entity_id: trade_id,
            description: `Cash paid for trade offer`
          });
      }

      // Notify offeror
      try {
        const conversationResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/create-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user1_id: trade.offeror_id,
            user2_id: user_id
          })
        });

        if (conversationResponse.ok) {
          const { conversation_id } = await conversationResponse.json();
          
          await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id,
              sender_id: user_id,
              content: `✅ Trade Accepted! Your trade offer for "${trade.requested_item.title}" was accepted!\n\nPlease arrange collection details with the other party. Both items are now marked as traded.`
            })
          });
        }
      } catch (error) {
        console.error('Error sending acceptance notification:', error);
      }

      return res.status(200).json({
        success: true,
        action: 'accepted',
        message: 'Trade offer accepted successfully',
        trade_id: trade_id
      });
    }

  } catch (error) {
    console.error('Error responding to trade:', error);
    return res.status(500).json({ 
      error: 'Failed to respond to trade offer',
      details: error.message 
    });
  }
}

