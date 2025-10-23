import { createClient } from '@supabase/supabase-js';

// Create Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        sellerId,
        title,
        description,
        bundlePrice,
        itemIds, // Array of item IDs
        collectionDate,
        collectionAddress
      } = req.body;

      // Validate required fields
      if (!sellerId || !title || !bundlePrice || !itemIds || itemIds.length < 2) {
        return res.status(400).json({ error: 'Missing required fields or not enough items for a bundle.' });
      }

      // Fetch individual item prices to calculate individual_total and savings
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, price, status')
        .in('id', itemIds);

      if (itemsError) throw itemsError;
      if (!itemsData || itemsData.length !== itemIds.length) {
        return res.status(400).json({ error: 'One or more items not found or invalid.' });
      }

      // Ensure all items are active and calculate individual total
      let individualTotal = 0;
      for (const itemId of itemIds) {
        const item = itemsData.find(i => i.id === itemId);
        if (!item || item.status !== 'active') {
          return res.status(400).json({ error: `Item ${itemId} is not active or does not exist.` });
        }
        individualTotal += item.price;
      }

      if (bundlePrice >= individualTotal) {
        return res.status(400).json({ error: 'Bundle price must be less than the sum of individual item prices to offer a saving.' });
      }

      const savings = individualTotal - bundlePrice;

      // Start a transaction for bundle creation
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .insert({
          seller_id: sellerId,
          title,
          description,
          bundle_price: bundlePrice,
          individual_total: individualTotal,
          savings,
          collection_date: collectionDate,
          collection_address: collectionAddress,
          status: 'active'
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Create bundle_items entries
      const bundleItemsPayload = itemIds.map(itemId => ({
        bundle_id: bundle.id,
        item_id: itemId,
        quantity: 1
      }));

      const { error: bundleItemsError } = await supabase
        .from('bundle_items')
        .insert(bundleItemsPayload);

      if (bundleItemsError) {
        // Rollback bundle creation if bundle_items insertion fails
        await supabase.from('bundles').delete().eq('id', bundle.id);
        throw bundleItemsError;
      }

      // Mark individual items as 'bundled' to prevent individual sale
      const { error: updateItemsError } = await supabase
        .from('items')
        .update({ status: 'bundled' })
        .in('id', itemIds);

      if (updateItemsError) {
        console.error("Failed to update item statuses after bundle creation:", updateItemsError);
      }

      res.status(201).json({ bundle });

    } catch (error) {
      console.error('Error creating bundle:', error);
      res.status(500).json({ error: error.message || 'Failed to create bundle' });
    }
  } else if (req.method === 'GET') {
    try {
      const { status, seller_id, limit = 10, offset = 0 } = req.query;

      let query = supabase
        .from('bundles')
        .select(`
          *,
          bundle_items (
            item_id,
            quantity,
            items (
              id,
              title,
              price,
              image_url,
              status
            )
          ),
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (seller_id) {
        query = query.eq('seller_id', seller_id);
      }

      const { data: bundles, error } = await query;

      if (error) throw error;

      res.status(200).json({ bundles });

    } catch (error) {
      console.error('Error fetching bundles:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch bundles' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
