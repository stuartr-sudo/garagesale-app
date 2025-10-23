import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { google } from 'npm:googleapis@128.0.0'

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
    console.log('Testing Gmail OAuth credentials...')
    
    // Get environment variables
    const clientId = Deno.env.get('GMAIL_CLIENT_ID')
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')
    const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')
    const fromEmail = Deno.env.get('GMAIL_FROM_EMAIL')

    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      hasFromEmail: !!fromEmail,
      clientIdLength: clientId?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    })

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing Gmail OAuth credentials',
        details: {
          clientId: clientId ? 'SET' : 'MISSING',
          clientSecret: clientSecret ? 'SET' : 'MISSING',
          refreshToken: refreshToken ? 'SET' : 'MISSING',
          fromEmail: fromEmail ? 'SET' : 'MISSING'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Test OAuth2 client setup
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    )

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    console.log('OAuth2 client created, testing access token...')

    // Test getting access token
    try {
      const { token } = await oauth2Client.getAccessToken()
      
      if (!token) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to get access token - refresh token may be invalid',
          details: 'The refresh token might be expired or invalid'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      console.log('Access token obtained successfully')

      // Test Gmail API access
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
      
      try {
        const profile = await gmail.users.getProfile({ userId: 'me' })
        console.log('Gmail profile accessed:', profile.data.emailAddress)

        return new Response(JSON.stringify({
          success: true,
          message: 'Gmail OAuth credentials are valid!',
          details: {
            email: profile.data.emailAddress,
            accessTokenLength: token.length,
            fromEmail: fromEmail
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })

      } catch (gmailError) {
        console.error('Gmail API error:', gmailError)
        return new Response(JSON.stringify({
          success: false,
          error: 'Gmail API access failed',
          details: {
            message: gmailError.message,
            code: gmailError.code,
            suggestion: 'Check Gmail API permissions and scopes'
          }
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

    } catch (tokenError) {
      console.error('Token error:', tokenError)
      return new Response(JSON.stringify({
        success: false,
        error: 'OAuth token error',
        details: {
          message: tokenError.message,
          code: tokenError.code,
          suggestion: 'Refresh token may be expired - regenerate it'
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error) {
    console.error('Gmail auth test error:', error)
    
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
