import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { itemIds, userId } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'Item IDs are required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify that all items belong to the user
    const { data: items, error: fetchError } = await supabase
      .from('items')
      .select('id, seller_id')
      .in('id', itemIds);

    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      return res.status(500).json({ error: 'Failed to verify items' });
    }

    // Check if all items belong to the user
    const unauthorizedItems = items.filter(item => item.seller_id !== userId);
    if (unauthorizedItems.length > 0) {
      return res.status(403).json({ 
        error: 'You can only delete your own items',
        unauthorizedItems: unauthorizedItems.map(item => item.id)
      });
    }

    // Check if any items are currently reserved or have active transactions
    const { data: reservedItems, error: reservedError } = await supabase
      .from('items')
      .select('id, title, status')
      .in('id', itemIds)
      .in('status', ['reserved', 'sold']);

    if (reservedError) {
      console.error('Error checking item status:', reservedError);
      return res.status(500).json({ error: 'Failed to check item status' });
    }

    if (reservedItems.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete items that are reserved or sold',
        reservedItems: reservedItems.map(item => ({ id: item.id, title: item.title, status: item.status }))
      });
    }

    // Delete the items
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .in('id', itemIds)
      .eq('seller_id', userId);

    if (deleteError) {
      console.error('Error deleting items:', deleteError);
      return res.status(500).json({ error: 'Failed to delete items' });
    }

    return res.status(200).json({ 
      message: `Successfully deleted ${itemIds.length} item(s)`,
      deletedCount: itemIds.length,
      deletedIds: itemIds
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
