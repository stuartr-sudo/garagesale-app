import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing Bundle Schema...\n');

    // Test 1: Check if bundles table exists
    console.log('1. ⏳ Checking bundles table...');
    const { data: bundlesTable, error: bundlesError } = await supabase
      .from('bundles')
      .select('*')
      .limit(1);

    if (bundlesError) {
      console.log('   ❌ Bundles table not found or error:', bundlesError.message);
      return res.status(500).json({
        error: 'Bundles table not found',
        details: bundlesError.message,
        suggestion: 'Please run the bundle system migration: supabase/migrations/20241223_bundle_system.sql'
      });
    }

    console.log('   ✅ Bundles table exists');

    // Test 2: Check if bundle_items table exists
    console.log('2. ⏳ Checking bundle_items table...');
    const { data: bundleItemsTable, error: bundleItemsError } = await supabase
      .from('bundle_items')
      .select('*')
      .limit(1);

    if (bundleItemsError) {
      console.log('   ❌ Bundle_items table not found or error:', bundleItemsError.message);
      return res.status(500).json({
        error: 'Bundle_items table not found',
        details: bundleItemsError.message,
        suggestion: 'Please run the bundle system migration: supabase/migrations/20241223_bundle_system.sql'
      });
    }

    console.log('   ✅ Bundle_items table exists');

    // Test 3: Check if transactions table has bundle columns
    console.log('3. ⏳ Checking transactions table for bundle columns...');
    const { data: transactionsTable, error: transactionsError } = await supabase
      .from('transactions')
      .select('bundle_id, transaction_type')
      .limit(1);

    if (transactionsError) {
      console.log('   ❌ Transactions table missing bundle columns:', transactionsError.message);
      return res.status(500).json({
        error: 'Transactions table missing bundle columns',
        details: transactionsError.message,
        suggestion: 'Please run the bundle system migration: supabase/migrations/20241223_bundle_system.sql'
      });
    }

    console.log('   ✅ Transactions table has bundle columns');

    // Test 4: Test creating a sample bundle (dry run)
    console.log('4. ⏳ Testing bundle creation (dry run)...');
    
    // Check if we have any items to bundle
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, title, price, seller_id')
      .eq('status', 'active')
      .limit(5);

    if (itemsError) {
      console.log('   ❌ Error fetching items:', itemsError.message);
      return res.status(500).json({
        error: 'Error fetching items',
        details: itemsError.message
      });
    }

    if (items.length < 2) {
      console.log('   ⚠️  Not enough items to create bundles (need at least 2)');
      return res.status(200).json({
        success: true,
        message: 'Bundle schema is ready, but need at least 2 active items to create bundles',
        itemsCount: items.length,
        items: items.map(item => ({ id: item.id, title: item.title, price: item.price }))
      });
    }

    console.log('   ✅ Found items for bundling:', items.length);
    console.log('   Items:', items.map(item => `${item.title} ($${item.price})`));

    return res.status(200).json({
      success: true,
      message: 'Bundle schema is ready and working!',
      tables: {
        bundles: '✅ Ready',
        bundle_items: '✅ Ready', 
        transactions: '✅ Ready'
      },
      itemsCount: items.length,
      items: items.map(item => ({ id: item.id, title: item.title, price: item.price }))
    });

  } catch (error) {
    console.error('❌ Bundle schema test failed:', error);
    return res.status(500).json({
      error: 'Bundle schema test failed',
      details: error.message,
      suggestion: 'Please run the bundle system migration: supabase/migrations/20241223_bundle_system.sql'
    });
  }
}
