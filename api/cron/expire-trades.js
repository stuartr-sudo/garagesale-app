import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Cron job to expire trade offers that are past their expiration date
 * Runs daily
 */
export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting trade expiration process...');

    // Find all pending trades that have expired
    const { data: expiredTrades, error: fetchError } = await supabase
      .from('trade_offers')
      .select(`
        id,
        expires_at,
        offeror_id,
        requestee_id,
        offered_items:trade_items(
          item:items(id, title)
        ),
        requested_item:items!trade_offers_item_id_requested_fkey(id, title)
      `)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredTrades || expiredTrades.length === 0) {
      console.log('No expired trades found');
      return res.status(200).json({
        success: true,
        message: 'No expired trades to process',
        expired_count: 0
      });
    }

    console.log(`Found ${expiredTrades.length} expired trades`);

    let successCount = 0;
    let errorCount = 0;

    // Process each expired trade
    for (const trade of expiredTrades) {
      try {
        // Update trade status to expired
        const { error: updateError } = await supabase
          .from('trade_offers')
          .update({ 
            status: 'expired',
            responded_at: new Date().toISOString()
          })
          .eq('id', trade.id);

        if (updateError) throw updateError;

        // Release reserved items (offered items)
        const offeredItemIds = trade.offered_items.map(ti => ti.item.id);
        
        if (offeredItemIds.length > 0) {
          const { error: releaseError } = await supabase
            .from('items')
            .update({ 
              status: 'available',
              reserved_until: null
            })
            .in('id', offeredItemIds)
            .eq('status', 'reserved'); // Only update if still reserved

          if (releaseError) {
            console.error(`Error releasing items for trade ${trade.id}:`, releaseError);
          }
        }

        // Send notification to offeror that their trade expired
        try {
          const conversationResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/create-conversation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user1_id: trade.offeror_id,
              user2_id: trade.requestee_id
            })
          });

          if (conversationResponse.ok) {
            const { conversation_id } = await conversationResponse.json();
            
            await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/send-message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversation_id,
                sender_id: trade.offeror_id, // System message from offeror
                content: `⏰ Trade Expired: Your trade offer for "${trade.requested_item.title}" has expired after 7 days. Your items have been released and are available again.`
              })
            });
          }
        } catch (notificationError) {
          console.error(`Error sending expiration notification for trade ${trade.id}:`, notificationError);
          // Don't fail the cron job if notification fails
        }

        successCount++;
        console.log(`Successfully expired trade ${trade.id}`);

      } catch (error) {
        console.error(`Error processing expired trade ${trade.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Trade expiration complete: ${successCount} succeeded, ${errorCount} failed`);

    return res.status(200).json({
      success: true,
      message: 'Trade expiration completed',
      expired_count: successCount,
      error_count: errorCount,
      total_processed: expiredTrades.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in trade expiration cron:', error);
    return res.status(500).json({
      error: 'Failed to process trade expiration',
      details: error.message
    });
  }
}

