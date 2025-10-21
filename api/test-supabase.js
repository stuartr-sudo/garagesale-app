/**
 * Test Supabase Connection
 * Simple endpoint to test if Supabase client is working
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Service Key available:', !!supabaseServiceKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('items')
      .select('id, title, price')
      .limit(1);
    
    console.log('Query result:', { data, error });
    
    return res.status(200).json({
      success: true,
      supabaseUrl: !!supabaseUrl,
      serviceKeyAvailable: !!supabaseServiceKey,
      queryResult: { data, error },
      itemCount: data?.length || 0
    });
  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
