# 🚀 Deployment Guide - BlockSwap Platform

## Step-by-Step Deployment Process

### ✅ **Step 1: Run SQL Migrations in Supabase**

1. Go to your Supabase project
2. Click on **SQL Editor** in the left sidebar
3. Open the file `SUPABASE_MIGRATIONS_TO_RUN.sql` (in this repo)
4. **Copy the ENTIRE contents** of that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected Result**: You should see "Success. No rows returned" - this is GOOD!

**What This Creates**:
- ✅ 20+ database tables
- ✅ All Row Level Security (RLS) policies
- ✅ Database functions and triggers
- ✅ Indexes for performance
- ✅ Comments for documentation

**⚠️ If You Get Errors**:
- If you see "already exists" errors, that's OK! It means some tables are already there
- If you see "column already exists", that's also OK!
- Only worry about errors like "syntax error" or "permission denied"

---

### ✅ **Step 2: Set Environment Variables in Vercel**

Go to your Vercel project → **Settings** → **Environment Variables**

**Required Variables:**

```bash
# Supabase (should already be set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-your-openai-key

# Cron Jobs Security
CRON_SECRET=your-random-secret-string

# Stripe (if using credit card payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key

# Email (optional, for now)
# SENDGRID_API_KEY=your-sendgrid-key
# or
# AWS_SES_KEY=your-aws-ses-key
```

**How to Generate CRON_SECRET:**
```bash
# Run this in your terminal:
openssl rand -base64 32
```

**Where to Get Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Stripe**: https://dashboard.stripe.com/test/apikeys
- **Supabase**: Already in your project settings

---

### ✅ **Step 3: Enable Vercel Cron Jobs**

Your `vercel.json` already has cron jobs configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/collection-reminders",
      "schedule": "0 9 * * *"  // Daily at 9 AM
    },
    {
      "path": "/api/cron/cleanup-expired-reservations",
      "schedule": "* * * * *"  // Every minute
    },
    {
      "path": "/api/cron/process-wish-list-matches",
      "schedule": "0 * * * *"  // Every hour
    },
    {
      "path": "/api/cron/expire-trades",
      "schedule": "0 0 * * *"  // Daily at midnight
    }
  ]
}
```

**To Enable:**
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Cron Jobs**
3. Verify all 4 cron jobs are listed and enabled
4. If not, they'll auto-enable on your next deployment

**⚠️ Important**: Make sure `CRON_SECRET` is set, or the cron jobs will fail!

---

### ✅ **Step 4: Deploy to Vercel**

**Option A: Automatic (Recommended)**
```bash
git add -A
git commit -m "feat: Production deployment"
git push origin main
```
Vercel will automatically detect the push and deploy.

**Option B: Manual Deploy**
```bash
npm run build
vercel --prod
```

---

### ✅ **Step 5: Test Core Features**

After deployment, test these critical flows:

#### **1. User Registration & Login**
- [ ] Sign up as new user
- [ ] Select account type (Individual / Seller)
- [ ] Complete onboarding
- [ ] Log out and log back in

#### **2. Item Listing**
- [ ] Create a new item listing
- [ ] Upload images (test both mobile camera and library)
- [ ] Set collection date (test both specific and flexible)
- [ ] Enable AI agent with minimum price
- [ ] Save and verify item appears in "My Items"

#### **3. AI Negotiation**
- [ ] View an item with AI agent enabled
- [ ] Make an offer below asking price
- [ ] Verify agent counters
- [ ] Test multiple rounds of negotiation
- [ ] Accept a counter-offer
- [ ] Verify purchase modal opens

#### **4. Purchase Flow**
- [ ] Click "Buy Now" on an item
- [ ] Acknowledge collection details
- [ ] Select payment method (test all 3):
  - **Bank Transfer**: Verify seller details shown
  - **Credit Card**: Test Stripe integration (use test card: 4242 4242 4242 4242)
  - **Crypto**: Verify QR code and address display
- [ ] Complete purchase
- [ ] Verify item marked as sold

#### **5. Messaging System**
- [ ] Send a message to seller
- [ ] Verify real-time delivery
- [ ] Check conversation list
- [ ] Test unread indicators

#### **6. Wish List Matching** (Wait ~1 hour for cron)
- [ ] Create a wish list item
- [ ] Add a listing that matches
- [ ] Wait for hourly cron job
- [ ] Verify seller receives notification

#### **7. Trading System**
- [ ] Enable "Open to Trades" in settings
- [ ] Click "Propose Trade" on an item
- [ ] Select your items + optional cash
- [ ] Send trade offer
- [ ] Go to Trade Offers page
- [ ] Accept/reject a trade

#### **8. Promoted Listings**
- [ ] Go to "Promote Items" page
- [ ] Select an item to promote
- [ ] Enter bid amount
- [ ] Verify balance deduction
- [ ] Check item appears promoted

---

### ⚠️ **Common Issues & Solutions**

#### **Issue 1: "Table does not exist"**
**Solution**: Run the SQL migrations in Step 1 again

#### **Issue 2: Cron jobs not running**
**Solution**: 
1. Check `CRON_SECRET` is set in Vercel
2. Go to Vercel → Functions → Check for errors
3. Trigger manually: `https://your-domain.vercel.app/api/cron/process-wish-list-matches?secret=YOUR_CRON_SECRET`

#### **Issue 3: AI negotiation not working**
**Solution**: 
1. Verify `OPENAI_API_KEY` is set in Vercel
2. Check OpenAI account has credits
3. Look at Vercel function logs for errors

#### **Issue 4: Images not uploading**
**Solution**:
1. Check Supabase Storage is enabled
2. Verify RLS policies on `storage.objects`
3. Test image upload directly in Supabase dashboard

#### **Issue 5: Stripe payment failing**
**Solution**:
1. Verify both Stripe keys are set (secret + publishable)
2. Use test card: `4242 4242 4242 4242`
3. Check Stripe dashboard for webhook errors

#### **Issue 6: Real-time messaging not working**
**Solution**:
1. Check Supabase Realtime is enabled
2. Verify browser supports WebSockets
3. Check browser console for connection errors

---

### 📊 **Monitoring & Analytics**

#### **Supabase Dashboard**
- **Tables**: Verify data is being created
- **Auth**: Monitor user signups
- **Storage**: Check image uploads
- **Database** → **Functions**: Review function logs

#### **Vercel Dashboard**
- **Functions**: Check for errors in serverless functions
- **Analytics**: Track page views and performance
- **Logs**: Real-time log streaming for debugging

#### **OpenAI Dashboard**
- **Usage**: Monitor API calls and costs
- **Rate Limits**: Check if hitting limits

---

### 🔒 **Security Checklist**

- [ ] RLS policies enabled on ALL tables (done by SQL migration)
- [ ] Environment variables are set and NOT exposed to frontend (except `VITE_` prefixed)
- [ ] CORS is configured properly in Supabase
- [ ] Stripe webhook secret is set (if using webhooks)
- [ ] `CRON_SECRET` is random and secure
- [ ] OpenAI API key has spending limits set
- [ ] Supabase service role key is NEVER exposed to frontend

---

### 🎯 **Performance Optimization**

#### **After Launch:**
1. **Enable Supabase Connection Pooling** (Settings → Database)
2. **Add CDN for images** (Already using Supabase storage CDN)
3. **Monitor slow queries** (Supabase → Database → Query Performance)
4. **Set up error tracking** (Recommended: Sentry.io)
5. **Configure caching** (Vercel Edge Config if needed)

---

### 📈 **What to Monitor**

#### **Week 1:**
- User registration rate
- Item listing creation rate
- AI negotiation usage (check `agent_conversations` table)
- Error rates (Vercel Functions logs)
- Page load times (Vercel Analytics)

#### **Week 2-4:**
- Wish list adoption (check `wishlists` table)
- Wish list match rate (check `wishlist_matches` table)
- Trade offer volume (check `trade_offers` table)
- Promoted listing adoption (check `promotions` table)
- Platform GMV (total transaction value)

---

### 🚨 **Emergency Rollback**

If something goes wrong:

```bash
# Rollback to previous deployment in Vercel dashboard
# Or via CLI:
vercel rollback
```

**OR** rollback specific Git commit:
```bash
git revert HEAD
git push origin main
```

---

### 🎉 **You're Ready to Launch!**

**Final Checklist:**
- [ ] SQL migrations run successfully
- [ ] All environment variables set in Vercel
- [ ] Cron jobs enabled
- [ ] Test purchases completed
- [ ] AI features working
- [ ] Messaging tested
- [ ] Mobile responsive verified
- [ ] Error monitoring set up

**Next Steps:**
1. Announce launch on social media
2. Onboard first 10 test users
3. Monitor for bugs in first 48 hours
4. Gather user feedback
5. Iterate quickly

---

### 📞 **Need Help?**

- **Vercel Issues**: https://vercel.com/support
- **Supabase Issues**: https://supabase.com/support
- **OpenAI Issues**: https://help.openai.com
- **Stripe Issues**: https://support.stripe.com

---

**🚀 Good luck with your launch! You've built something amazing!** 🎉

