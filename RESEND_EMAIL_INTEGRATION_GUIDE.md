# Resend Email Integration Guide for Mobile App

This document provides comprehensive information about integrating **Resend** email service for your marketplace platform. Resend is a modern, developer-friendly email API that's **much simpler than Gmail OAuth** and provides **reliable transactional email delivery**.

---

## 1. Overview

### Why Resend?

```javascript
const resendBenefits = {
  simplicityVsGmail: {
    resend: "Just an API key - 5 minute setup",
    gmail: "Complex OAuth flow - hours of setup"
  },
  
  reliability: {
    delivery: "Professional email infrastructure",
    uptime: "99.9% SLA",
    performance: "Fast, reliable delivery"
  },
  
  features: {
    api: "Simple REST API",
    tracking: "Open and click tracking",
    analytics: "Real-time delivery stats",
    domains: "Custom domain support",
    templates: "React email templates (optional)"
  },
  
  pricing: {
    free: "3,000 emails/month + 100/day",
    perfect: "Ideal for development and small production",
    scalable: "Pay-as-you-grow pricing"
  }
};
```

### What You'll Learn
- ✅ Complete Resend setup (5 minutes!)
- ✅ Supabase Edge Function integration
- ✅ Custom domain configuration
- ✅ Email template system
- ✅ Testing and troubleshooting
- ✅ Mobile app integration
- ✅ Best practices for deliverability

---

## 2. Quick Start (5 Minutes)

### Step 1: Create Resend Account
```javascript
const resendSignup = {
  step1: "Go to https://resend.com",
  step2: "Click 'Sign Up'",
  step3: "Enter your email address",
  step4: "Verify your email",
  step5: "Complete onboarding",
  timeRequired: "2 minutes"
};
```

### Step 2: Get API Key
```javascript
const getApiKey = {
  step1: "Login to Resend Dashboard",
  step2: "Navigate to 'API Keys' in sidebar",
  step3: "Click 'Create API Key'",
  step4: "Name it: 'GarageSale Production' (or 'Development')",
  step5: "Select permissions: 'Sending access' (default)",
  step6: "Click 'Create'",
  step7: "COPY THE API KEY (starts with 're_')",
  warning: "⚠️ Save it now! You can't see it again.",
  format: "re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  timeRequired: "1 minute"
};
```

### Step 3: Add to Environment Variables
```bash
# Supabase Dashboard → Settings → Edge Functions → Environment Variables

# Required
RESEND_API_KEY=re_your_actual_api_key_here

# Optional (use Resend default if not set)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# If you don't have a custom domain yet, use:
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Step 4: Deploy Edge Function
```bash
# If not already deployed
cd supabase/functions/send-resend
supabase functions deploy send-resend

# Verify deployment
curl https://your-project.supabase.co/functions/v1/send-resend \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Step 5: Test Integration
```javascript
// In your app, call the test endpoint
const testResendIntegration = async () => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: 'your-email@example.com',
      subject: 'Test Email from Resend',
      html: '<h1>Hello from Resend!</h1><p>Email system is working!</p>'
    })
  });
  
  const result = await response.json();
  console.log('Email sent:', result);
};
```

**Expected Result:** ✅ Email delivered to your inbox within seconds!

---

## 3. Custom Domain Setup (Optional but Recommended)

### Why Use a Custom Domain?

```javascript
const customDomainBenefits = {
  branding: "Emails from your@yourdomain.com instead of onboarding@resend.dev",
  deliverability: "Better inbox placement and trust",
  professionalism: "Looks more legitimate to users",
  noLimits: "No restrictions on sending volume",
  dkim: "Proper email authentication"
};
```

### Domain Setup Steps

#### Step 1: Add Domain to Resend
```javascript
const addDomainSteps = {
  step1: "Resend Dashboard → Domains",
  step2: "Click 'Add Domain'",
  step3: "Enter your domain: garagesale.com (or subdomain: mail.garagesale.com)",
  step4: "Click 'Add Domain'",
  note: "Resend will generate DNS records for you"
};
```

#### Step 2: Configure DNS Records
```javascript
const dnsRecordsRequired = {
  spf: {
    type: "TXT",
    name: "@",
    value: "v=spf1 include:_spf.resend.com ~all",
    purpose: "Authorize Resend to send emails"
  },
  
  dkim: {
    type: "TXT",
    name: "resend._domainkey",
    value: "[Provided by Resend - unique for your domain]",
    purpose: "Email signature verification"
  },
  
  dmarc: {
    type: "TXT",
    name: "_dmarc",
    value: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com",
    purpose: "Email authentication policy"
  }
};
```

**Example DNS Configuration:**
```dns
# Add these records to your DNS provider (Cloudflare, Namecheap, etc.)

Type    Name                    Value                                           TTL
TXT     @                       v=spf1 include:_spf.resend.com ~all            3600
TXT     resend._domainkey       k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...      3600
TXT     _dmarc                  v=DMARC1; p=none; rua=mailto:dmarc@...         3600
```

#### Step 3: Verify Domain
```javascript
const verifyDomain = {
  step1: "Wait 5-10 minutes for DNS propagation",
  step2: "Resend Dashboard → Domains → Your Domain",
  step3: "Click 'Verify'",
  success: "✅ Status: Verified",
  failure: "❌ Status: Pending - Check DNS records",
  tip: "Use https://mxtoolbox.com to verify DNS records"
};
```

#### Step 4: Update Environment Variable
```bash
# After domain verification
RESEND_FROM_EMAIL=noreply@yourdomain.com
# OR
RESEND_FROM_EMAIL=hello@yourdomain.com
# OR
RESEND_FROM_EMAIL=support@yourdomain.com
```

---

## 4. Supabase Edge Function Integration

### Edge Function Code
```typescript
// supabase/functions/send-resend/index.ts
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
    const fromEmail = from || Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'

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
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
```

### Deployment Commands
```bash
# Deploy Edge Function
supabase functions deploy send-resend

# Set environment variables
supabase secrets set RESEND_API_KEY=re_your_api_key
supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com

# Test the function
supabase functions invoke send-resend \
  --data '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

---

## 5. Email Template System

### Base Template Structure
```javascript
// src/lib/emailTemplates.js

const baseEmailTemplate = (content, actionButton = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          background: #06b6d4;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        .info-box {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        ${actionButton ? `
          <div style="text-align: center; padding: 20px;">
            ${actionButton}
          </div>
        ` : ''}
        <div class="footer">
          <p>© ${new Date().getFullYear()} GarageSale. All rights reserved.</p>
          <p style="margin-top: 10px;">
            <a href="https://garagesale.com/settings" style="color: #06b6d4;">Manage Preferences</a> |
            <a href="https://garagesale.com/support" style="color: #06b6d4;">Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
```

### Email Template Examples

#### Welcome Email
```javascript
export const welcomeEmailTemplate = (userName, userEmail) => {
  const content = `
    <div class="header">
      <h1>🎉 Welcome to GarageSale!</h1>
      <p>Start turning your unwanted items into cash</p>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Welcome to GarageSale! We're excited to have you join our community of smart sellers and savvy buyers.</p>
      
      <h3>🚀 Get Started:</h3>
      <ul>
        <li>📸 Take photos of items you want to sell</li>
        <li>🤖 Let our AI write compelling descriptions</li>
        <li>💰 Set your price and start selling</li>
        <li>🔒 Secure payments with Stripe</li>
      </ul>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e40af;">💡 Pro Tips:</h3>
        <ul>
          <li>Use good lighting for photos</li>
          <li>Be honest about item condition</li>
          <li>Set competitive prices</li>
          <li>Respond quickly to buyers</li>
        </ul>
      </div>
      
      <p>Happy selling!</p>
      <p><strong>The GarageSale Team</strong></p>
    </div>
  `;
  
  const actionButton = `
    <a href="https://garagesale.com/marketplace" class="button">
      Browse Marketplace
    </a>
  `;
  
  return {
    subject: `Welcome to GarageSale, ${userName}!`,
    html: baseEmailTemplate(content, actionButton),
    text: `Welcome to GarageSale, ${userName}! Start selling your items today.`
  };
};
```

#### Payment Confirmation Email
```javascript
export const paymentConfirmationTemplate = (sellerName, itemTitle, amount, buyerName, orderId) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #10b981, #059669);">
      <h1>⏰ Payment Confirmation Required</h1>
      <p>A buyer has paid for your item</p>
    </div>
    <div class="content">
      <p>Hi ${sellerName},</p>
      
      <p>Good news! <strong>${buyerName}</strong> has completed payment for your item.</p>
      
      <div class="info-box" style="background: #fef3c7; border-color: #f59e0b;">
        <h3 style="margin-top: 0; color: #92400e;">Order Details</h3>
        <p><strong>Item:</strong> ${itemTitle}</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Buyer:</strong> ${buyerName}</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
      </div>
      
      <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">⚠️ Action Required</h3>
        <p><strong>You must confirm payment receipt within 12-24 hours</strong></p>
        <p>Failure to confirm may result in account restrictions.</p>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Check your bank account/wallet for the payment</li>
        <li>Verify the amount matches: $${amount}</li>
        <li>Click the button below to confirm</li>
        <li>Arrange collection with the buyer</li>
      </ol>
      
      <p>If you have any issues, contact support immediately.</p>
    </div>
  `;
  
  const actionButton = `
    <a href="https://garagesale.com/paymentconfirmations" class="button" style="background: #10b981;">
      Confirm Payment Received
    </a>
  `;
  
  return {
    subject: `⏰ Payment Confirmation Required - ${itemTitle}`,
    html: baseEmailTemplate(content, actionButton),
    text: `Payment confirmation required for ${itemTitle}. Amount: $${amount}. Buyer: ${buyerName}. Confirm within 12-24 hours.`
  };
};
```

#### Account Restricted Email
```javascript
export const accountRestrictedTemplate = (userName, reason, pendingCount) => {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
      <h1>⚠️ Account Restricted</h1>
      <p>Immediate action required</p>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      
      <p>Your account has been temporarily restricted due to:</p>
      <p style="font-size: 18px; font-weight: bold; color: #dc2626;">${reason}</p>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #92400e;">Pending Confirmations</h3>
        <p>You have <strong>${pendingCount}</strong> pending payment confirmation${pendingCount > 1 ? 's' : ''} that need your immediate attention.</p>
      </div>
      
      <h3>To Restore Your Account:</h3>
      <ol>
        <li>Click the button below to view pending confirmations</li>
        <li>Confirm all pending payments</li>
        <li>Your account will be automatically restored</li>
      </ol>
      
      <p>If you believe this is an error, please contact support immediately.</p>
    </div>
  `;
  
  const actionButton = `
    <a href="https://garagesale.com/paymentconfirmations" class="button" style="background: #ef4444;">
      View Pending Confirmations
    </a>
  `;
  
  return {
    subject: `⚠️ Account Restricted - Action Required`,
    html: baseEmailTemplate(content, actionButton),
    text: `Your account has been restricted: ${reason}. You have ${pendingCount} pending confirmations. Visit garagesale.com/paymentconfirmations to resolve.`
  };
};
```

---

## 6. Mobile App Integration

### Send Email Function
```javascript
// src/api/email.js
import { supabase } from '@/lib/supabase';

/**
 * Send email via Resend through Supabase Edge Function
 */
export async function sendEmail({ to, subject, html, text, from }) {
  try {
    const response = await supabase.functions.invoke('send-resend', {
      body: {
        to,
        subject,
        html,
        text,
        from
      }
    });

    if (response.error) {
      console.error('Email send error:', response.error);
      return {
        success: false,
        error: response.error.message
      };
    }

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userName, userEmail) {
  const template = welcomeEmailTemplate(userName, userEmail);
  
  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(sellerEmail, sellerName, itemTitle, amount, buyerName, orderId) {
  const template = paymentConfirmationTemplate(sellerName, itemTitle, amount, buyerName, orderId);
  
  return await sendEmail({
    to: sellerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * Send account restricted email
 */
export async function sendAccountRestrictedEmail(userEmail, userName, reason, pendingCount) {
  const template = accountRestrictedTemplate(userName, reason, pendingCount);
  
  return await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}
```

### Usage in Your App
```javascript
// After user registration
import { sendWelcomeEmail } from '@/api/email';

const handleUserSignup = async (userName, userEmail) => {
  // ... create user account
  
  // Send welcome email
  const emailResult = await sendWelcomeEmail(userName, userEmail);
  
  if (emailResult.success) {
    console.log('Welcome email sent!');
  } else {
    console.error('Failed to send welcome email:', emailResult.error);
  }
};

// After payment received
import { sendPaymentConfirmationEmail } from '@/api/email';

const handlePaymentReceived = async (order) => {
  const emailResult = await sendPaymentConfirmationEmail(
    order.seller.email,
    order.seller.name,
    order.item.title,
    order.amount,
    order.buyer.name,
    order.id
  );
  
  if (!emailResult.success) {
    console.error('Failed to send payment confirmation:', emailResult.error);
  }
};
```

---

## 7. Testing

### Test Component for React Native
```javascript
// TestEmailButton.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { sendEmail } from '@/api/email';

export default function TestEmailButton() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      const result = await sendEmail({
        to: email,
        subject: '🧪 Test Email from GarageSale',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email sent to <strong>${email}</strong> from GarageSale.</p>
          <p>✅ Email system is working correctly!</p>
        `,
        text: `Test email sent to ${email} from GarageSale. Email system is working!`
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          `Test email sent to ${email}. Check your inbox!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Test Email Integration
      </Text>
      
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="your-email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12
        }}
      />
      
      <TouchableOpacity
        onPress={handleTestEmail}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#06b6d4',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Sending...' : 'Send Test Email'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 8. Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Resend API key not configured"
```javascript
const solution1 = {
  problem: "RESEND_API_KEY environment variable not set",
  steps: [
    "1. Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables",
    "2. Add RESEND_API_KEY=re_your_api_key_here",
    "3. Redeploy edge function: supabase functions deploy send-resend",
    "4. Test again"
  ],
  verify: "Check that API key starts with 're_'"
};
```

#### Issue 2: "Domain not verified"
```javascript
const solution2 = {
  problem: "Custom domain DNS records not configured",
  options: {
    option1: {
      quick: "Use Resend default: RESEND_FROM_EMAIL=onboarding@resend.dev",
      works: "Immediately, no DNS needed"
    },
    option2: {
      proper: "Configure DNS records for your domain",
      steps: [
        "1. Add SPF record to DNS",
        "2. Add DKIM record to DNS",
        "3. Wait 5-10 minutes for propagation",
        "4. Verify in Resend dashboard"
      ]
    }
  }
};
```

#### Issue 3: "Emails going to spam"
```javascript
const solution3 = {
  problem: "Emails not reaching inbox",
  fixes: {
    domainVerification: "Properly verify your custom domain with SPF/DKIM",
    content: "Avoid spam trigger words (FREE, URGENT, CLICK HERE)",
    testing: "Use reputable test email addresses first",
    warmup: "Start with low volume, gradually increase",
    dmarc: "Add DMARC policy for better deliverability"
  }
};
```

#### Issue 4: "Rate limit exceeded"
```javascript
const solution4 = {
  problem: "Hitting Resend's free tier limits",
  limits: {
    free: "3,000 emails/month + 100 emails/day"
  },
  solutions: {
    checkUsage: "Resend Dashboard → Usage",
    upgrade: "Upgrade to paid plan for higher limits",
    optimize: "Batch emails, avoid unnecessary sends",
    testing: "Use test mode for development"
  }
};
```

#### Issue 5: "CORS errors"
```javascript
const solution5 = {
  problem: "CORS errors when calling Edge Function",
  fix: "Edge function already includes CORS headers",
  verify: {
    headers: `
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    `,
    options: "Function handles OPTIONS preflight requests"
  },
  ifStillFailing: "Check that you're using Supabase client correctly"
};
```

---

## 9. Best Practices

### Email Deliverability
```javascript
const deliverabilityBestPractices = {
  authentication: {
    spf: "Always configure SPF record",
    dkim: "Enable DKIM signing",
    dmarc: "Set DMARC policy",
    custom_domain: "Use verified custom domain"
  },
  
  content: {
    subject_lines: "Clear, descriptive, avoid spam words",
    text_version: "Always include plain text version",
    html_quality: "Valid HTML, mobile-responsive",
    images: "Don't rely solely on images for content"
  },
  
  sending_practices: {
    warmup: "Start with low volume, increase gradually",
    engagement: "Send to engaged users",
    list_hygiene: "Remove bounces and unsubscribes",
    throttling: "Don't send all at once"
  },
  
  monitoring: {
    bounce_rate: "Keep under 5%",
    complaint_rate: "Keep under 0.1%",
    open_rate: "Track and optimize",
    unsubscribes: "Respect opt-outs immediately"
  }
};
```

### Security
```javascript
const securityBestPractices = {
  apiKeys: {
    storage: "Store in environment variables only",
    rotation: "Rotate keys periodically",
    permissions: "Use least privilege (sending only)",
    never: "Never commit API keys to git"
  },
  
  validation: {
    email_format: "Validate email addresses before sending",
    rate_limiting: "Implement rate limiting on your endpoints",
    authentication: "Require auth for email sending endpoints",
    sanitization: "Sanitize user input in templates"
  }
};
```

### Performance
```javascript
const performanceBestPractices = {
  async: "Send emails asynchronously, don't block user actions",
  batch: "Batch multiple emails when possible",
  queue: "Use job queue for high-volume sending",
  retry: "Implement retry logic for failures",
  timeout: "Set reasonable timeouts",
  logging: "Log all email sends for debugging"
};
```

---

## 10. Analytics & Monitoring

### Resend Dashboard Metrics
```javascript
const availableMetrics = {
  delivery: {
    sent: "Total emails sent",
    delivered: "Successfully delivered",
    bounced: "Hard and soft bounces",
    failed: "Failed to send"
  },
  
  engagement: {
    opens: "Email opens (requires tracking pixel)",
    clicks: "Link clicks",
    complaints: "Spam complaints",
    unsubscribes: "Unsubscribe requests"
  },
  
  performance: {
    delivery_time: "Average delivery time",
    bounce_rate: "Percentage of bounces",
    complaint_rate: "Spam complaint rate"
  }
};
```

### Custom Tracking
```javascript
// Add to your database
const emailLogsSchema = {
  table: "email_logs",
  columns: {
    id: "UUID PRIMARY KEY",
    user_id: "UUID REFERENCES profiles(id)",
    email_type: "TEXT (welcome, payment_confirmation, etc.)",
    recipient_email: "TEXT",
    subject: "TEXT",
    sent_at: "TIMESTAMPTZ DEFAULT NOW()",
    resend_message_id: "TEXT",
    status: "TEXT (sent, delivered, bounced, failed)",
    opened_at: "TIMESTAMPTZ",
    clicked_at: "TIMESTAMPTZ"
  }
};

// Log email sends
export async function logEmailSend(emailData) {
  await supabase.from('email_logs').insert({
    user_id: emailData.userId,
    email_type: emailData.templateName,
    recipient_email: emailData.to,
    subject: emailData.subject,
    resend_message_id: emailData.messageId,
    status: 'sent'
  });
}
```

---

## 11. Cost Breakdown

### Resend Pricing
```javascript
const resendPricing = {
  free: {
    emails: "3,000/month",
    daily: "100/day",
    api_access: "Full API access",
    support: "Community support",
    domains: "Custom domains",
    perfect_for: "Development, small apps"
  },
  
  pro: {
    price: "$20/month",
    emails: "50,000/month",
    daily: "Unlimited",
    overage: "$1/1,000 emails",
    support: "Email support",
    analytics: "Advanced analytics",
    perfect_for: "Growing businesses"
  },
  
  business: {
    price: "$100/month",
    emails: "1,000,000/month",
    daily: "Unlimited",
    overage: "$0.50/1,000 emails",
    support: "Priority support",
    sla: "99.99% SLA",
    perfect_for: "Large scale applications"
  }
};

const costComparison = {
  resend_free: "3,000 emails/month = $0",
  sendgrid_free: "100 emails/day = $0 (3,000/month)",
  mailgun_free: "5,000 emails/month = $0",
  ses: "$0.10 per 1,000 emails",
  
  winner: "Resend offers best developer experience with generous free tier"
};
```

---

## Summary

✅ **Resend Integration Complete!**

**What You Learned:**
- ✅ 5-minute Resend setup (vs hours for Gmail OAuth)
- ✅ Supabase Edge Function integration
- ✅ Custom domain configuration
- ✅ Professional email templates
- ✅ Mobile app integration
- ✅ Testing & troubleshooting
- ✅ Best practices for deliverability

**Key Benefits:**
- 🚀 **Simple**: Just an API key
- 💪 **Reliable**: Professional email infrastructure
- 🎨 **Flexible**: Custom templates and domains
- 📊 **Analytics**: Track opens and clicks
- 💰 **Affordable**: 3,000 free emails/month
- 🛡️ **Secure**: Proper authentication (SPF/DKIM)

**Your Email System is Ready! 📧✨**
