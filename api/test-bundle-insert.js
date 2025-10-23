import { createClient } from '@supabase/supabase-js';

// Create Supabase client using environment variables
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing bundle insert...\n');

    // Test 1: Check if bundles table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'bundles');

    if (tableError) {
      console.error('❌ Table check failed:', tableError.message);
      return res.status(500).json({ error: 'Table check failed', details: tableError.message });
    }

    console.log('✅ Bundles table exists:', tableCheck.length > 0);

    // Test 2: Check table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'bundles')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Columns check failed:', columnsError.message);
      return res.status(500).json({ error: 'Columns check failed', details: columnsError.message });
    }

    console.log('✅ Bundle table columns:', columns);

    // Test 3: Try a simple insert with minimal data
    const testBundle = {
      seller_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      title: 'Test Bundle',
      description: 'Test Description',
      bundle_price: 10.00,
      individual_total: 15.00,
      savings: 5.00,
      status: 'active'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('bundles')
      .insert(testBundle)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return res.status(500).json({ 
        error: 'Insert test failed', 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      });
    }

    console.log('✅ Insert test successful:', insertResult);

    // Clean up test data
    await supabase.from('bundles').delete().eq('id', insertResult.id);

    res.status(200).json({
      success: true,
      message: 'Bundle insert test passed',
      tableExists: tableCheck.length > 0,
      columns: columns,
      testInsert: insertResult
    });

  } catch (error) {
    console.error('❌ Bundle insert test failed:', error);
    res.status(500).json({ 
      error: 'Bundle insert test failed', 
      details: error.message 
    });
  }
}
