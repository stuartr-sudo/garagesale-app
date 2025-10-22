import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    console.log('Test function called successfully!')
    
    // Check environment variables
    const envCheck = {
      hasGmailClientId: !!Deno.env.get('GMAIL_CLIENT_ID'),
      hasGmailClientSecret: !!Deno.env.get('GMAIL_CLIENT_SECRET'),
      hasGmailRefreshToken: !!Deno.env.get('GMAIL_REFRESH_TOKEN'),
      hasGmailFromEmail: !!Deno.env.get('GMAIL_FROM_EMAIL'),
    }

    console.log('Environment variables check:', envCheck)

    return new Response(JSON.stringify({
      success: true,
      message: 'Test function working!',
      timestamp: new Date().toISOString(),
      environment: envCheck
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Test function error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
