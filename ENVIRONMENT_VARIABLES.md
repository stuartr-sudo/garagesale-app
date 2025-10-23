# Environment Variables for Vercel

Add these environment variables to your Vercel project settings:

## Stripe Configuration
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook verification)
```

## Email Service Configuration

### Option 1: SendGrid (Recommended)
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx...
SENDGRID_TEMPLATE_ID=d-1234567890abcdef (optional, uses default template)
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Garage Sale
```

### Option 2: AWS SES
```
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Garage Sale
```

## Cron Job Security
```
CRON_SECRET=your-secret-key-for-cron-authentication
```

## Database (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## How to Get Stripe Keys

1. **Create a Stripe Account**: Go to https://stripe.com and sign up
2. **Get Test Keys**: 
   - Go to Developers > API Keys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
3. **Get Webhook Secret**:
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Set URL to: `https://yourdomain.vercel.app/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the "Signing secret" (starts with `whsec_`)

## How to Get SendGrid API Key

1. **Create SendGrid Account**: Go to https://sendgrid.com
2. **Create API Key**:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Enable "Mail Send" permissions
   - Copy the API key (starts with `SG.`)

## Testing Email System

You can test the email system by making a POST request to `/api/test/email`:

```bash
curl -X POST https://yourdomain.vercel.app/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

## Production Setup

1. **Stripe**: Switch to live keys when ready for production
2. **Email**: Use a verified domain for FROM_EMAIL
3. **Cron**: Set CRON_SECRET to a strong random string
4. **Database**: Ensure Supabase is configured for production

## Security Notes

- Never commit these keys to version control
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage and set up alerts
