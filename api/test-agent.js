/**
 * Test endpoint to verify AI agent configuration
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEW_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  return res.status(200).json({
    success: true,
    environment: {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openaiApiKey: !!openaiApiKey,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    },
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || 
      key.includes('OPENAI') || 
      key.includes('VERCEL')
    )
  });
}
