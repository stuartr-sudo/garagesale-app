import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test if the new payment columns exist
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, title, collection_date, collection_address, seller_bank_details, crypto_wallet_addresses')
      .limit(1);

    if (itemsError) {
      return res.status(500).json({
        error: 'Database schema test failed',
        details: itemsError.message,
        suggestion: 'The payment system migration may not have been applied. Please run the migration in Supabase.'
      });
    }

    // Test if the new transaction columns exist
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, payment_method, payment_status, crypto_currency, crypto_tx_hash, collection_date, collection_acknowledged')
      .limit(1);

    if (transactionsError) {
      return res.status(500).json({
        error: 'Database schema test failed',
        details: transactionsError.message,
        suggestion: 'The payment system migration may not have been applied. Please run the migration in Supabase.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database schema is up to date',
      itemsColumns: items.length > 0 ? Object.keys(items[0]) : [],
      transactionsColumns: transactions.length > 0 ? Object.keys(transactions[0]) : []
    });

  } catch (error) {
    console.error('Database schema test error:', error);
    return res.status(500).json({
      error: 'Database schema test failed',
      details: error.message
    });
  }
}
