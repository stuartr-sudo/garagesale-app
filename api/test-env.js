export default async function handler(req, res) {
  try {
    console.log('🧪 Testing Environment Variables...\n');

    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKeyValue: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    };

    console.log('Environment check:', envCheck);

    res.status(200).json({
      success: true,
      message: 'Environment variables test',
      envCheck
    });

  } catch (error) {
    console.error('❌ Environment test failed:', error);
    res.status(500).json({ 
      error: 'Environment test failed', 
      details: error.message 
    });
  }
}
