# Gmail OAuth Setup Guide

## 🔧 Environment Variables Required

Add these environment variables to your Supabase project:

### **Supabase Edge Functions Environment Variables**
Go to your Supabase Dashboard → Settings → Edge Functions → Environment Variables

```bash
# Gmail OAuth Credentials
GMAIL_CLIENT_ID=your_google_client_id_here
GMAIL_CLIENT_SECRET=your_google_client_secret_here
GMAIL_REFRESH_TOKEN=your_google_refresh_token_here
GMAIL_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
VITE_APP_URL=https://yourdomain.com
```

## 📋 Gmail OAuth Setup Steps

### **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "GarageSale Email Service"
   - Authorized redirect URIs: `https://yourdomain.com/auth/callback`

4. **Download Credentials**
   - Download the JSON file
   - Note down `client_id` and `client_secret`

### **Step 2: Get Refresh Token**

1. **Use OAuth 2.0 Playground**
   - Go to: https://developers.google.com/oauthplayground/
   - Click the gear icon (Settings)
   - Check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret

2. **Authorize APIs**
   - In the left panel, find "Gmail API v1"
   - Check: `https://mail.google.com/`
   - Click "Authorize APIs"
   - Sign in with your Gmail account
   - Click "Allow"

3. **Exchange for Tokens**
   - Click "Exchange authorization code for tokens"
   - Copy the `refresh_token` value

### **Step 3: Deploy Supabase Edge Function**

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Deploy the Edge Function**
   ```bash
   supabase functions deploy send-gmail
   ```

3. **Set Environment Variables in Supabase**
   ```bash
   supabase secrets set GMAIL_CLIENT_ID=your_client_id
   supabase secrets set GMAIL_CLIENT_SECRET=your_client_secret
   supabase secrets set GMAIL_REFRESH_TOKEN=your_refresh_token
   supabase secrets set GMAIL_FROM_EMAIL=noreply@yourdomain.com
   ```

### **Step 4: Test Email Functionality**

1. **Test the Edge Function**
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/send-gmail' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "html": "<h1>Test Email</h1>",
       "text": "Test Email"
     }'
   ```

2. **Test from Frontend**
   ```javascript
   import { sendTestEmail } from '@/lib/emailService'
   
   // Test email
   const result = await sendTestEmail('your-email@example.com')
   console.log(result)
   ```

## 🎯 Email Templates Available

The email service includes these templates:

- **Welcome Email**: Sent to new users
- **Payment Confirmation**: Sent to sellers when payment is confirmed
- **Order Confirmation**: Sent to buyers when order is placed
- **Account Restriction**: Sent when account is restricted

## 🔧 Usage Examples

### **Send Welcome Email**
```javascript
import { sendWelcomeEmail } from '@/lib/emailService'

await sendWelcomeEmail('user@example.com', 'John Doe')
```

### **Send Payment Confirmation**
```javascript
import { sendPaymentConfirmationEmail } from '@/lib/emailService'

await sendPaymentConfirmationEmail(
  'seller@example.com',
  'Jane Seller',
  'John Buyer',
  'Vintage Camera',
  150.00,
  '2024-01-15T10:00:00Z'
)
```

### **Send Custom Email**
```javascript
import { sendEmail } from '@/lib/emailService'

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML</h1>',
  text: 'Custom text content'
})
```

## 🚨 Troubleshooting

### **Common Issues**

1. **"Invalid credentials" error**
   - Check that Gmail API is enabled
   - Verify client ID and secret are correct
   - Ensure refresh token is valid

2. **"Access denied" error**
   - Check OAuth consent screen is configured
   - Verify redirect URIs are correct
   - Ensure Gmail account has proper permissions

3. **"Quota exceeded" error**
   - Gmail API has daily limits
   - Check quota usage in Google Cloud Console
   - Consider implementing rate limiting

### **Testing Checklist**

- [ ] Gmail API enabled in Google Cloud Console
- [ ] OAuth 2.0 credentials created
- [ ] Refresh token obtained from OAuth playground
- [ ] Environment variables set in Supabase
- [ ] Edge function deployed successfully
- [ ] Test email sent successfully
- [ ] Email templates working correctly

## 📞 Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify Gmail API quota and limits
3. Test with OAuth playground first
4. Contact support if needed
