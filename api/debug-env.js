/**
 * Debug Environment Variables
 * Simple endpoint to check what environment variables are available
 */

export default async function handler(req, res) {
  return res.status(200).json({
    supabaseUrl: !!process.env.VITE_SUPABASE_URL,
    supabaseUrlValue: process.env.VITE_SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    supabaseAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    openaiApiKey: !!process.env.VITE_OPENAI_API_KEY,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('OPENAI'))
  });
}
