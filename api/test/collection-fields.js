import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test 1: Check if we can insert an item with collection fields
    const testItem = {
      title: 'Test Item for Collection Fields',
      description: 'This is a test item to verify collection fields work',
      price: 50.00,
      condition: 'good',
      category: 'other',
      location: 'Test Location',
      tags: ['test'],
      image_urls: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'],
      seller_id: 'test-seller-id',
      status: 'active',
      collection_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      collection_address: '123 Test Street, Test City, 1234'
    };

    // Try to insert the test item
    const { data: insertedItem, error: insertError } = await supabase
      .from('items')
      .insert(testItem)
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to insert test item with collection fields',
        details: insertError.message,
        suggestion: 'Check if the database migration was applied correctly'
      });
    }

    // Clean up the test item
    await supabase
      .from('items')
      .delete()
      .eq('id', insertedItem.id);

    // Test 2: Check if we can query items with collection fields
    const { data: itemsWithCollection, error: queryError } = await supabase
      .from('items')
      .select('id, title, collection_date, collection_address')
      .not('collection_date', 'is', null)
      .limit(5);

    if (queryError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to query items with collection fields',
        details: queryError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection fields are working correctly',
      details: {
        testItemInserted: true,
        testItemCleanedUp: true,
        itemsWithCollectionFields: itemsWithCollection.length,
        sampleItems: itemsWithCollection.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Collection fields test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
}
