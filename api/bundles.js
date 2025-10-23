import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        sellerId,
        title,
        description,
        bundlePrice,
        itemIds,
        collectionDate,
        collectionAddress
      } = req.body;

      // Validate required fields
      if (!sellerId || !title || !bundlePrice || !itemIds || itemIds.length < 2) {
        return res.status(400).json({
          error: 'Missing required fields: sellerId, title, bundlePrice, and at least 2 itemIds'
        });
      }

      // Get individual item prices
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, price, status')
        .in('id', itemIds)
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (itemsError) {
        return res.status(500).json({
          error: 'Failed to fetch items',
          details: itemsError.message
        });
      }

      if (items.length !== itemIds.length) {
        return res.status(400).json({
          error: 'Some items not found or not available for bundling'
        });
      }

      // Calculate totals
      const individualTotal = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
      const savings = individualTotal - parseFloat(bundlePrice);

      if (savings <= 0) {
        return res.status(400).json({
          error: 'Bundle price must be less than the sum of individual item prices'
        });
      }

      // Create bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .insert({
          seller_id: sellerId,
          title,
          description,
          bundle_price: parseFloat(bundlePrice),
          individual_total: individualTotal,
          savings,
          collection_date: collectionDate,
          collection_address: collectionAddress
        })
        .select()
        .single();

      if (bundleError) {
        return res.status(500).json({
          error: 'Failed to create bundle',
          details: bundleError.message
        });
      }

      // Add items to bundle
      const bundleItems = itemIds.map(itemId => ({
        bundle_id: bundle.id,
        item_id: itemId,
        quantity: 1
      }));

      const { error: bundleItemsError } = await supabase
        .from('bundle_items')
        .insert(bundleItems);

      if (bundleItemsError) {
        // Rollback bundle creation
        await supabase.from('bundles').delete().eq('id', bundle.id);
        return res.status(500).json({
          error: 'Failed to add items to bundle',
          details: bundleItemsError.message
        });
      }

      return res.status(201).json({
        success: true,
        bundle: {
          ...bundle,
          items: items,
          savings_percentage: Math.round((savings / individualTotal) * 100)
        }
      });

    } catch (error) {
      console.error('Bundle creation error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const { sellerId, status = 'active', limit = 20, offset = 0 } = req.query;

      let query = supabase
        .from('bundles')
        .select(`
          *,
          seller:seller_id (
            id,
            full_name,
            email
          ),
          bundle_items (
            id,
            quantity,
            items:item_id (
              id,
              title,
              price,
              image_urls,
              condition
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bundles, error } = await query;

      if (error) {
        console.error('Bundle fetch error:', error);
        return res.status(500).json({
          error: 'Failed to fetch bundles',
          details: error.message
        });
      }

      // Calculate savings percentage for each bundle
      const bundlesWithSavings = bundles.map(bundle => ({
        ...bundle,
        savings_percentage: Math.round((bundle.savings / bundle.individual_total) * 100)
      }));

      return res.status(200).json({
        success: true,
        bundles: bundlesWithSavings
      });

    } catch (error) {
      console.error('Bundle fetch error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
