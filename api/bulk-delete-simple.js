import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== BULK DELETE START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { itemIds, userId } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      console.log('ERROR: No item IDs provided');
      return res.status(400).json({ error: 'Item IDs are required' });
    }

    if (!userId) {
      console.log('ERROR: No user ID provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Environment check:', {
      supabaseUrl: process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEW_SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING'
    });

    // Create Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.NEW_SUPABASE_SERVICE_KEY
    );

    console.log('Supabase client created');

    // Simple approach: just try to delete the first item to test
    console.log('Attempting to delete item:', itemIds[0]);
    
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemIds[0])
      .eq('seller_id', userId)
      .select();

    console.log('Delete result:', { data, error });

    if (error) {
      console.log('DELETE ERROR:', error);
      return res.status(500).json({ 
        error: 'Delete failed', 
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log('=== BULK DELETE SUCCESS ===');
    return res.status(200).json({ 
      message: 'Test delete successful',
      deletedItem: itemIds[0],
      result: data
    });

  } catch (error) {
    console.log('=== BULK DELETE CATCH ERROR ===');
    console.log('Error type:', typeof error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Catch block error',
      message: error.message,
      type: typeof error
    });
  }
}
