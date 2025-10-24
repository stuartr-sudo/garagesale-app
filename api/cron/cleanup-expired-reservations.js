/**
 * Cleanup Expired Reservations Cron Job
 * Runs every minute to release expired item reservations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the release_expired_reservations function
    const { error: releaseError } = await supabase.rpc('release_expired_reservations');

    if (releaseError) throw releaseError;

    // Get count of items that were just released
    const { count, error: countError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('availability_status', 'available')
      .is('reserved_by', null);

    if (countError) throw countError;

    console.log(`Cleaned up expired reservations. ${count || 0} items now available.`);

    return res.status(200).json({
      success: true,
      message: 'Expired reservations cleaned up',
      items_released: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up reservations:', error);
    return res.status(500).json({
      error: 'Failed to cleanup reservations',
      details: error.message
    });
  }
}

