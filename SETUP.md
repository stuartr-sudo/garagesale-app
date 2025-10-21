# GarageSale Setup Guide

This guide will walk you through setting up your GarageSale marketplace app from scratch.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- An OpenAI API key
- A Stripe account (for payments)
- A Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

### Get Your Supabase Credentials

Your Supabase project has already been created:
- **Project ID**: `biwuxtvgvkkltrdpuptl`
- **URL**: `https://biwuxtvgvkkltrdpuptl.supabase.co`
- **Anon Key**: Check your project settings in the Supabase dashboard

### Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new secret key
4. Copy the key (you won't be able to see it again!)

### Get Your Stripe Public Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → API Keys
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)

### Create Your .env.local File

Create a file named `.env.local` in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://biwuxtvgvkkltrdpuptl.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key_here

# App Configuration
VITE_APP_URL=http://localhost:5173
```

## Step 3: Verify Database Setup

Your database schema has already been created with the following tables:
- `profiles` - User profiles
- `items` - Marketplace listings
- `transactions` - Purchase records
- `advertisements` - Business ads
- `announcements` - System announcements
- `requests` - Item requests
- `ratings` - User reviews
- `businesses` - Business accounts
- `trade_proposals` - Trade offers
- `contact_requests` - User messages

You can view and manage your database in the [Supabase Dashboard](https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl).

## Step 4: Configure Authentication

### Enable Google OAuth (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/auth/providers)
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://biwuxtvgvkkltrdpuptl.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### Enable Email/Password (Optional)

Email/password authentication is enabled by default in Supabase.

## Step 5: Configure Storage

Storage buckets have already been created:
- `items` - Item images (public)
- `avatars` - User avatars (public)
- `advertisements` - Ad images (public)
- `business-logos` - Business logos (public)

Check the [Storage section](https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/storage/buckets) to verify.

## Step 6: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app!

## Step 7: Test Core Features

### Test Item Listing
1. Sign up/login with Google
2. Navigate to "Add Item"
3. Upload a photo
4. Try the AI assistant to generate description
5. Save the listing

### Test Marketplace
1. View items in the Marketplace
2. Use filters and search
3. Try purchasing an item (test mode)

### Test User Profile
1. Go to Settings
2. Update your profile information
3. Upload an avatar

## Step 8: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`
   - `VITE_APP_URL` (your Vercel URL)
6. Deploy!

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_OPENAI_API_KEY
vercel env add VITE_STRIPE_PUBLIC_KEY

# Deploy to production
vercel --prod
```

## Step 9: Update Redirect URLs

After deploying, update your OAuth redirect URLs:

### Supabase
1. Go to Authentication → URL Configuration
2. Add your production URL to:
   - Site URL
   - Redirect URLs

### Google OAuth
1. Go to Google Cloud Console
2. Add your production URL to authorized redirect URIs:
   - `https://your-app.vercel.app`

## Step 10: Set Up Stripe Webhooks (Production)

For production, you'll need to set up Stripe webhooks:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint
3. Use URL: `https://your-app.vercel.app/api/stripe-webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has all required variables
- Restart your development server after creating the file

### "Not authenticated" errors
- Check that your Supabase URL and anon key are correct
- Verify Google OAuth is properly configured
- Check browser console for more details

### AI features not working
- Verify your OpenAI API key is valid
- Check you have credits in your OpenAI account
- Look for API errors in the browser console

### Images not uploading
- Check Storage policies in Supabase dashboard
- Verify bucket names match the code
- Check browser console for CORS errors

### Deployment issues
- Ensure all environment variables are set in Vercel
- Check build logs for errors
- Verify Node.js version compatibility

## Next Steps

### Customize Your App
- Update branding in `/src/pages/Home.jsx`
- Modify color scheme in `tailwind.config.js`
- Add your own logo and favicon

### Add Features
- Implement Stripe Connected Accounts for seller payouts
- Add real-time chat with Supabase Realtime
- Implement push notifications
- Add email notifications using Supabase Edge Functions

### Configure for Production
- Set up proper domain and SSL
- Configure CDN for images
- Implement analytics
- Add monitoring and error tracking
- Set up backup and recovery procedures

## Support

If you encounter issues:
1. Check the Supabase logs
2. Review browser console errors
3. Check network tab in DevTools
4. Review the README.md for additional info

## Security Best Practices

1. **Never commit `.env.local`** - it's in `.gitignore` for a reason
2. **Use Row Level Security** - already enabled on all tables
3. **Validate inputs** - always validate user input on both client and server
4. **Keep dependencies updated** - run `npm audit` regularly
5. **Use environment variables** - never hardcode secrets
6. **Enable HTTPS** - Vercel provides this automatically
7. **Implement rate limiting** - use Supabase auth rate limits

## Performance Tips

1. **Optimize images** - use WebP format where possible
2. **Enable caching** - configure CDN properly
3. **Lazy load components** - use React.lazy() for large components
4. **Database indexes** - already created for common queries
5. **Connection pooling** - Supabase handles this automatically

---

Built with ❤️ for local communities

