# 🚀 Quick Start Guide

Get your GarageSale app running in 5 minutes!

## Step 1: Get Your API Keys (3 minutes)

### Supabase (Already Created!)
1. Go to: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/settings/api
2. Copy your **anon/public** key

### OpenAI
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### Stripe
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)

## Step 2: Configure Environment (1 minute)

Create a file named `.env.local` in the project root:

```bash
# Run this command to create the file
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://biwuxtvgvkkltrdpuptl.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_supabase_key_here
VITE_OPENAI_API_KEY=paste_your_openai_key_here
VITE_STRIPE_PUBLIC_KEY=paste_your_stripe_key_here
VITE_APP_URL=http://localhost:5173
EOF
```

Then edit the file and replace the placeholder values with your actual keys:
```bash
nano .env.local
```

## Step 3: Run the App (1 minute)

```bash
# Dependencies are already installed!
npm run dev
```

Open http://localhost:5173 in your browser 🎉

## Step 4: Test It Out

### Create Your First Listing
1. Click "Get Started Free"
2. Sign in with Google (or create account)
3. Complete onboarding
4. Click "Add Item"
5. Upload a photo
6. Click "Generate Listing Details" (AI magic! ✨)
7. Save your listing

### Browse the Marketplace
1. Go to "Marketplace"
2. Search for items
3. Try the filters
4. Click on an item to view details

## That's It! 🎉

Your app is now running locally. 

### Next Steps

- **Deploy**: See [SETUP.md](./SETUP.md) for deployment instructions
- **Customize**: Edit `src/pages/Home.jsx` to customize branding
- **Learn More**: Read [README.md](./README.md) for full documentation

## Need Help?

### Common Issues

**"Missing Supabase environment variables"**
- Make sure `.env.local` exists in the project root
- Restart the dev server after creating it: `Ctrl+C` then `npm run dev`

**Can't sign in?**
- Enable Google OAuth in [Supabase Dashboard](https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/auth/providers)
- Follow the OAuth setup in [SETUP.md](./SETUP.md#configure-authentication)

**AI not working?**
- Check your OpenAI API key is correct
- Make sure you have credits: https://platform.openai.com/usage

### Still Stuck?

Check the detailed guides:
- [SETUP.md](./SETUP.md) - Full setup instructions
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - What's been done
- [README.md](./README.md) - Project overview

---

**Happy Selling!** 🛍️

