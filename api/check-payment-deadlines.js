/**
 * Check Payment Confirmation Deadlines
 * Cron job endpoint to check for expired payment confirmations and apply restrictions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('MISSING SUPABASE ENVIRONMENT VARIABLES');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  // Only allow POST requests (for cron job security)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple authentication check (you can add more sophisticated auth)
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET || 'default-cron-secret';
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Checking payment confirmation deadlines...');

    // Call the database function to check and apply restrictions
    const { data: expiredCount, error } = await supabase
      .rpc('check_payment_confirmation_deadlines');

    if (error) {
      console.error('❌ Error checking deadlines:', error);
      return res.status(500).json({ 
        error: 'Failed to check deadlines',
        details: error.message 
      });
    }

    console.log('✅ Deadline check completed:', {
      expiredConfirmations: expiredCount,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      expiredConfirmations: expiredCount,
      timestamp: new Date().toISOString(),
      message: `Checked deadlines and applied restrictions to ${expiredCount} expired confirmations`
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
