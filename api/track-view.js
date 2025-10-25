import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_KEY
);

/**
 * API endpoint to track item views and update view count
 * POST /api/track-view
 * Body: { itemId, sessionId }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, sessionId } = req.body;

    if (!itemId || !sessionId) {
      return res.status(400).json({ error: 'Missing itemId or sessionId' });
    }

    // Increment view count
    const { error: incrementError } = await supabase.rpc('increment_item_view_count', {
      item_id: itemId
    });

    if (incrementError) {
      console.error('Error incrementing view count:', incrementError);
      // Don't fail the request if this fails
    }

    // Track active viewer
    const { error: viewerError } = await supabase.rpc('upsert_active_viewer', {
      p_item_id: itemId,
      p_session_id: sessionId,
      p_viewer_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    if (viewerError) {
      console.error('Error tracking viewer:', viewerError);
    }

    return res.status(200).json({ 
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Error in track-view API:', error);
    return res.status(500).json({ 
      error: 'Failed to track view',
      details: error.message 
    });
  }
}

