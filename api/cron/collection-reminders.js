import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is a legitimate cron job request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting collection reminder job...');
    
    // Get tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tomorrow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for collections on: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Find transactions with collection dates tomorrow
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        items:item_id (
          id,
          title,
          price,
          image_urls,
          collection_date,
          collection_address
        ),
        buyers:buyer_id (
          id,
          full_name,
          email
        ),
        sellers:seller_id (
          id,
          full_name,
          email
        )
      `)
      .gte('collection_date', startOfDay.toISOString())
      .lte('collection_date', endOfDay.toISOString())
      .in('payment_status', ['confirmed', 'completed']);

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError);
      return res.status(500).json({ 
        error: 'Failed to fetch transactions',
        details: transactionError.message 
      });
    }

    console.log(`Found ${transactions?.length || 0} transactions for tomorrow`);

    if (!transactions || transactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No collection reminders to send',
        count: 0
      });
    }

    // Send reminder emails
    const emailPromises = transactions.map(async (transaction) => {
      try {
        const item = transaction.items;
        const buyer = transaction.buyers;
        const seller = transaction.sellers;

        if (!buyer?.email || !item || !seller) {
          console.warn(`Missing data for transaction ${transaction.id}:`, {
            hasBuyerEmail: !!buyer?.email,
            hasItem: !!item,
            hasSeller: !!seller
          });
          return { success: false, error: 'Missing required data' };
        }

        // Format collection date
        const collectionDate = new Date(item.collection_date);
        const formattedDate = collectionDate.toLocaleString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Send email to buyer
        const emailData = {
          to: buyer.email,
          subject: `Collection Reminder: ${item.title} - Tomorrow`,
          template: 'collection-reminder',
          data: {
            buyerName: buyer.full_name,
            itemTitle: item.title,
            itemPrice: item.price,
            collectionDate: formattedDate,
            collectionAddress: item.collection_address,
            sellerName: seller.full_name,
            sellerEmail: seller.email,
            transactionId: transaction.id,
            itemImage: item.image_urls?.[0] || null
          }
        };

        const result = await sendEmail(emailData);
        console.log(`Collection reminder sent to ${buyer.email} for ${item.title}`);
        return { success: true, email: buyer.email, item: item.title };
      } catch (error) {
        console.error(`Error sending reminder for transaction ${transaction.id}:`, error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Collection reminder job completed: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: 'Collection reminder job completed',
      results: {
        total: transactions.length,
        successful,
        failed,
        details: results
      }
    });

  } catch (error) {
    console.error('Collection reminder job error:', error);
    return res.status(500).json({
      error: 'Collection reminder job failed',
      details: error.message
    });
  }
}
