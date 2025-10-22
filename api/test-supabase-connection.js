/**
 * Test Supabase Connection
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'Missing Supabase credentials',
        debug: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .limit(1);

    if (error) {
      return res.status(500).json({
        error: 'Supabase connection failed',
        details: error.message,
        code: error.code
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Supabase connection successful',
      itemsFound: data?.length || 0
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
