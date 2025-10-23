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
    console.log('Testing Resend configuration...')
    
    // Check environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL')
    
    console.log('Environment check:', {
      hasResendApiKey: !!resendApiKey,
      apiKeyLength: resendApiKey?.length || 0,
      apiKeyPrefix: resendApiKey?.substring(0, 10) || 'N/A',
      fromEmail: fromEmail
    })

    if (!resendApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'RESEND_API_KEY environment variable is not set',
        details: {
          resendApiKey: 'MISSING',
          fromEmail: fromEmail || 'NOT_SET'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Test API key by making a simple request to Resend
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const domains = await response.json()
        console.log('Resend API key is valid, domains:', domains)
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Resend API key is valid!',
          details: {
            apiKeyLength: resendApiKey.length,
            fromEmail: fromEmail,
            domains: domains.data || []
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } else {
        const error = await response.text()
        console.error('Resend API error:', response.status, error)
        
        return new Response(JSON.stringify({
          success: false,
          error: 'Resend API key is invalid',
          details: {
            status: response.status,
            error: error,
            apiKeyPrefix: resendApiKey.substring(0, 10)
          }
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    } catch (apiError) {
      console.error('Resend API test error:', apiError)
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to test Resend API',
        details: {
          message: apiError.message,
          apiKeyPrefix: resendApiKey.substring(0, 10)
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error) {
    console.error('Resend config test error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Unexpected error',
      details: {
        message: error.message,
        stack: error.stack
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
