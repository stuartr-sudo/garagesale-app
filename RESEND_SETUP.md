# Resend Email Setup Guide

## 🚀 Why Resend?

Resend is much simpler than Gmail OAuth:
- ✅ **No OAuth complexity** - Just an API key
- ✅ **Reliable delivery** - Professional email service
- ✅ **Easy setup** - 5 minutes vs hours for Gmail
- ✅ **Better deliverability** - Designed for transactional emails

## 📋 Setup Steps

### Step 1: Create Resend Account

1. **Go to:** [https://resend.com](https://resend.com)
2. **Sign up** with your email
3. **Verify your email** address

### Step 2: Get API Key

1. **Go to:** Resend Dashboard → API Keys
2. **Click:** "Create API Key"
3. **Name it:** "GarageSale Production"
4. **Copy the API key** (starts with `re_`)

### Step 3: Add Domain (Optional but Recommended)

1. **Go to:** Resend Dashboard → Domains
2. **Click:** "Add Domain"
3. **Enter:** Your domain (e.g., `garagesale.com`)
4. **Follow DNS setup** instructions
5. **Verify domain** (takes 5-10 minutes)

### Step 4: Configure Supabase Environment Variables

1. **Go to:** Supabase Dashboard → Settings → Edge Functions → Environment Variables
2. **Add these variables:**

```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Note:** If you don't have a custom domain, you can use Resend's default domain:
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Step 5: Test the Integration

1. **Go to:** Your test page (`/EmailTest`)
2. **Click:** "Test Resend Email" (orange button)
3. **Enter:** Your email address
4. **Click:** "Test Resend Email"
5. **Check:** Your inbox for the test email

## 🎯 Expected Results

**✅ Success:**
- Email sent successfully
- Check your inbox for test message
- No more 500 errors!

**❌ If you get "Resend API key not configured":**
- Check that `RESEND_API_KEY` is set in Supabase
- Make sure you copied the full API key

**❌ If you get "Failed to send email via Resend":**
- Check your Resend dashboard for error details
- Verify your domain is set up correctly
- Try using `onboarding@resend.dev` as from email

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Double-check you copied the full API key
   - Make sure it starts with `re_`

2. **"Domain not verified"**
   - Use `onboarding@resend.dev` as from email
   - Or set up your custom domain properly

3. **"Rate limit exceeded"**
   - Resend has generous free limits
   - Check if you're sending too many test emails

### Free Tier Limits:

- **3,000 emails/month** (free)
- **100 emails/day** (free)
- **Perfect for development and small production**

## 🚀 Next Steps

Once Resend is working:

1. **Update your email service** to use Resend instead of Gmail
2. **Replace Gmail functions** with Resend functions
3. **Remove Gmail OAuth** complexity
4. **Enjoy reliable email delivery!**

## 📞 Support

- **Resend Docs:** [https://resend.com/docs](https://resend.com/docs)
- **Resend Support:** Available in their dashboard
- **Much simpler** than Gmail OAuth setup!
