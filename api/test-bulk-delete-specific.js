import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test the exact same logic as bulk-delete-items.js
    const { itemIds, userId } = req.body || { itemIds: ['5ef6351d-751d-4b48-9466-f3a8ccf48aeb'], userId: '8b56d288-d66d-4f47-af5f-7a050550cd10' };

    console.log('Testing with:', { itemIds, userId });

    // Step 1: Verify that all items belong to the user
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, seller_id')
      .in('id', itemIds);

    console.log('Fetch items result:', { items, fetchError });

    if (fetchError) {
      return res.status(500).json({ 
        error: 'Failed to verify items',
        details: fetchError.message,
        step: 'fetch_items'
      });
    }

    // Check if all items belong to the user
    const unauthorizedItems = items.filter(item => item.seller_id !== userId);
    console.log('Unauthorized items check:', { unauthorizedItems });

    if (unauthorizedItems.length > 0) {
      return res.status(403).json({ 
        error: 'You can only delete your own items',
        unauthorizedItems: unauthorizedItems.map(item => item.id),
        step: 'authorization_check'
      });
    }

    // Step 2: Check if any items are currently reserved or have active transactions
    const { data: reservedItems, error: reservedError } = await supabase
      .from('items')
      .select('id, title, status')
      .in('id', itemIds)
      .in('status', ['reserved', 'sold']);

    console.log('Reserved items check:', { reservedItems, reservedError });

    if (reservedError) {
      return res.status(500).json({ 
        error: 'Failed to check item status',
        details: reservedError.message,
        step: 'status_check'
      });
    }

    if (reservedItems.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete items that are reserved or sold',
        reservedItems: reservedItems.map(item => ({ id: item.id, title: item.title, status: item.status })),
        step: 'reserved_items_check'
      });
    }

    // Step 3: Test the delete operation (but don't actually delete)
    console.log('All checks passed, would delete items:', itemIds);

    return res.status(200).json({ 
      message: 'Bulk delete test passed all checks',
      itemIds,
      userId,
      itemsFound: items.length,
      unauthorizedCount: unauthorizedItems.length,
      reservedCount: reservedItems.length,
      wouldDelete: true
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
