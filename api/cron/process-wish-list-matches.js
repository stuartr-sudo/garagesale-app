/**
 * Cron job to process wish list matches hourly
 * This should be configured in Vercel to run every hour
 */

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls (Vercel sends this automatically or via query param)
  const authHeader = req.headers.authorization;
  const secretFromQuery = req.query.secret;
  const CRON_SECRET = process.env.CRON_SECRET;
  
  const isAuthorized = 
    authHeader === `Bearer ${CRON_SECRET}` || 
    secretFromQuery === CRON_SECRET ||
    req.headers['x-vercel-cron-id']; // Vercel's built-in cron auth
  
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting hourly wish list matching process...');

    // Call the match API for all recent items
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/ai/match-wish-lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        processAll: true
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Matching failed');
    }

    console.log(`Wish list matching complete:`, result);

    return res.status(200).json({
      success: true,
      message: 'Wish list matching completed',
      items_processed: result.items_processed,
      matches_created: result.matches_created,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in wish list matching cron:', error);
    return res.status(500).json({
      error: 'Failed to process wish list matches',
      details: error.message
    });
  }
}

