export default async function handler(req, res) {
  try {
    console.log('🧪 Testing Supabase connection...\n');

    // Try to import and use the existing Supabase client
    const { supabase } = await import('../src/lib/supabase.js');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('items')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query failed:', error.message);
      return res.status(500).json({ 
        error: 'Supabase query failed', 
        details: error.message 
      });
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Sample data:', data);
    
    res.status(200).json({
      success: true,
      message: 'Supabase connection test passed',
      sampleData: data
    });

  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    res.status(500).json({ 
      error: 'Supabase test failed', 
      details: error.message 
    });
  }
}
