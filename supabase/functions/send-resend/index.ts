import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}

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
    console.log('Resend email function called')

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed' 
      }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Get request body
    const { to, subject, html, text, from }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: to and subject are required' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = from || Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@garagesale.com'

    console.log('Environment check:', {
      hasResendApiKey: !!resendApiKey,
      fromEmail: fromEmail
    })

    if (!resendApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Resend API key not configured',
        details: 'RESEND_API_KEY environment variable is missing'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    // Create email payload
    const emailPayload = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html || text,
      text: text
    }

    console.log('Sending email via Resend:', {
      to: to,
      subject: subject,
      from: fromEmail
    })

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', result)
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send email via Resend',
        details: result
      }), {
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }

    console.log('Email sent successfully via Resend:', result)

    return new Response(JSON.stringify({
      success: true,
      messageId: result.id,
      message: 'Email sent successfully via Resend'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Resend send error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
