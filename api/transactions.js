import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        itemId,
        buyerId,
        sellerId,
        paymentMethod,
        paymentStatus = 'pending',
        amount,
        cryptoCurrency,
        cryptoTxHash,
        stripePaymentIntentId,
        collectionDate,
        collectionAcknowledged = false
      } = req.body;

      // Validate required fields
      if (!itemId || !buyerId || !sellerId || !paymentMethod || !amount) {
        return res.status(400).json({
          error: 'Missing required fields: itemId, buyerId, sellerId, paymentMethod, amount'
        });
      }

      // Validate payment method (replaces database constraint)
      const validPaymentMethods = ['bank_transfer', 'stripe', 'crypto'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: 'Invalid payment method. Must be one of: bank_transfer, stripe, crypto'
        });
      }

      // Validate payment status (replaces database constraint)
      const validPaymentStatuses = ['pending', 'confirmed', 'completed', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          error: 'Invalid payment status. Must be one of: pending, confirmed, completed, failed'
        });
      }

      // Create transaction record
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          seller_id: sellerId,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          amount: amount,
          crypto_currency: cryptoCurrency,
          crypto_tx_hash: cryptoTxHash,
          stripe_payment_intent_id: stripePaymentIntentId,
          collection_date: collectionDate,
          collection_acknowledged: collectionAcknowledged,
          collection_acknowledged_at: collectionAcknowledged ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Transaction creation error:', error);
        return res.status(500).json({
          error: 'Failed to create transaction',
          details: error.message
        });
      }

      // Update item status if payment is completed
      if (paymentStatus === 'completed') {
        await supabase
          .from('items')
          .update({ status: 'sold' })
          .eq('id', itemId);
      }

      return res.status(201).json({
        success: true,
        transaction: transaction
      });

    } catch (error) {
      console.error('Transaction API error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { buyerId, sellerId, status } = req.query;

      let query = supabase.from('transactions').select(`
        *,
        items:item_id (
          id,
          title,
          price,
          image_urls
        ),
        buyer:buyer_id (
          id,
          full_name,
          email
        ),
        seller:seller_id (
          id,
          full_name,
          email
        )
      `);

      if (buyerId) {
        query = query.eq('buyer_id', buyerId);
      }

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      if (status) {
        query = query.eq('payment_status', status);
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Transaction fetch error:', error);
        return res.status(500).json({
          error: 'Failed to fetch transactions',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        transactions: transactions
      });

    } catch (error) {
      console.error('Transaction fetch API error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
