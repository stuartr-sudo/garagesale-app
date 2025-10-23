import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing simple bundle query...\n');

    // Just try to query the bundles table
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Bundle query failed:', error.message);
      return res.status(500).json({ 
        error: 'Bundle query failed', 
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log('✅ Bundle query successful');
    console.log('Data:', data);

    res.status(200).json({
      success: true,
      message: 'Bundle query test passed',
      data: data
    });

  } catch (error) {
    console.error('❌ Bundle test failed:', error);
    res.status(500).json({ 
      error: 'Bundle test failed', 
      details: error.message 
    });
  }
}
