export default async function handler(req, res) {
  try {
    console.log('🧪 Testing Bundle System...\n');

    // Test 1: Check if we can import Supabase
    let supabase;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log('✅ Supabase client created successfully');
    } catch (error) {
      console.error('❌ Failed to create Supabase client:', error.message);
      return res.status(500).json({ 
        error: 'Supabase client creation failed', 
        details: error.message 
      });
    }

    // Test 2: Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    console.log('Environment variables:', envCheck);

    // Test 3: Try to query bundles table
    try {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Bundle table query failed:', error.message);
        return res.status(500).json({ 
          error: 'Bundle table query failed', 
          details: error.message 
        });
      }
      
      console.log('✅ Bundle table query successful');
      console.log('Bundles found:', bundles?.length || 0);
      
    } catch (error) {
      console.error('❌ Bundle table access failed:', error.message);
      return res.status(500).json({ 
        error: 'Bundle table access failed', 
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bundle system test passed',
      envCheck,
      bundlesFound: 0
    });

  } catch (error) {
    console.error('❌ Bundle system test failed:', error);
    res.status(500).json({ 
      error: 'Bundle system test failed', 
      details: error.message 
    });
  }
}
