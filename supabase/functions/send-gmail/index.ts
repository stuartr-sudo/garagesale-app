import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Gmail API types
interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

interface GmailMessage {
  to: string
  subject: string
  html?: string
  text?: string
  from: string
  replyTo?: string
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get request body
    const { to, subject, html, text, from, replyTo }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: to and subject are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get Gmail OAuth credentials from environment
    const clientId = Deno.env.get('GMAIL_CLIENT_ID')
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')
    const refreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')
    const fromEmail = from || Deno.env.get('GMAIL_FROM_EMAIL') || 'noreply@garagesale.com'

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(JSON.stringify({ 
        error: 'Gmail OAuth credentials not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create Gmail message
    const message: GmailMessage = {
      to,
      subject,
      from: fromEmail,
      replyTo: replyTo || fromEmail,
      html: html || '',
      text: text || ''
    }

    // Send email via Gmail API
    const result = await sendGmailMessage(message, {
      clientId,
      clientSecret,
      refreshToken
    })

    if (result.success) {
      return new Response(JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Gmail send error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Gmail API helper function
async function sendGmailMessage(message: GmailMessage, credentials: {
  clientId: string
  clientSecret: string
  refreshToken: string
}) {
  try {
    // Get access token using refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh Gmail access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Create email message in Gmail format
    const emailContent = createEmailContent(message)
    const encodedMessage = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    // Send email via Gmail API
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      }),
    })

    if (!gmailResponse.ok) {
      const errorData = await gmailResponse.json()
      throw new Error(`Gmail API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await gmailResponse.json()
    return {
      success: true,
      messageId: result.id
    }

  } catch (error) {
    console.error('Gmail send error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create email content in proper format
function createEmailContent(message: GmailMessage): string {
  const boundary = 'boundary_' + Math.random().toString(36).substring(2, 15)
  
  let email = `To: ${message.to}\r\n`
  email += `From: ${message.from}\r\n`
  email += `Subject: ${message.subject}\r\n`
  email += `Reply-To: ${message.replyTo || message.from}\r\n`
  email += `MIME-Version: 1.0\r\n`
  email += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`

  // Add text part
  if (message.text) {
    email += `--${boundary}\r\n`
    email += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`
    email += `${message.text}\r\n\r\n`
  }

  // Add HTML part
  if (message.html) {
    email += `--${boundary}\r\n`
    email += `Content-Type: text/html; charset=UTF-8\r\n\r\n`
    email += `${message.html}\r\n\r\n`
  }

  email += `--${boundary}--\r\n`

  return email
}
