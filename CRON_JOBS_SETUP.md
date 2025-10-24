# ⏰ BlockSwap Cron Jobs - Complete Setup Guide

## ✅ Current Status

Your cron jobs are **fully configured and protected**!

### 🔒 Security
- ✅ CRON_SECRET added to Vercel
- ✅ All endpoints protected with 3-way auth:
  1. Authorization header: `Bearer ${CRON_SECRET}`
  2. Query parameter: `?secret=${CRON_SECRET}`
  3. Vercel built-in: `x-vercel-cron-id` header (automatic)

### 📋 Active Cron Jobs

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| **Cleanup Reservations** | Every minute | `/api/cron/cleanup-expired-reservations` | Releases expired cart reservations |
| **Wish List Matching** | Every hour | `/api/cron/process-wish-list-matches` | AI matches wish lists to items |
| **Collection Reminders** | Daily at 9am | `/api/cron/collection-reminders` | Emails buyers 24hrs before pickup |
| **Expire Trades** | Daily at midnight | `/api/cron/expire-trades` | Expires old trade offers |

---

## 🚀 How Vercel Cron Works

### **Automatic Setup:**

When you deploy to Vercel with `vercel.json` containing cron jobs:
1. ✅ Vercel automatically registers the cron schedules
2. ✅ Vercel calls your endpoints at the specified times
3. ✅ Vercel includes `x-vercel-cron-id` header for auth
4. ✅ **No additional setup needed!**

### **Your `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/collection-reminders",
      "schedule": "0 9 * * *"  // Daily at 9am UTC
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
      "schedule": "0 0 * * *"  // Daily at midnight UTC
    }
  ]
}
```

---

## 📅 Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 = Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### **Examples:**
```bash
"* * * * *"       # Every minute
"0 * * * *"       # Every hour (on the hour)
"0 9 * * *"       # Every day at 9:00 AM UTC
"0 0 * * *"       # Every day at midnight UTC
"0 0 * * 0"       # Every Sunday at midnight UTC
"*/5 * * * *"     # Every 5 minutes
"0 */2 * * *"     # Every 2 hours
```

---

## 🔍 How to Monitor Cron Jobs

### **Method 1: Vercel Dashboard**

1. Go to: **Vercel Dashboard** → Your Project → **Functions**
2. Click on any cron function
3. See **Execution logs** and **Invocation history**
4. Check for errors or successful runs

### **Method 2: Check Logs in Real-Time**

```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Login to Vercel
vercel login

# View logs in real-time
vercel logs --follow
```

### **Method 3: Manual Testing**

Test any cron job manually:

```bash
# Test with query parameter
curl "https://www.blockswap.club/api/cron/cleanup-expired-reservations?secret=YOUR_CRON_SECRET"

# Or with Authorization header
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://www.blockswap.club/api/cron/cleanup-expired-reservations
```

---

## 🛠️ Troubleshooting

### **Problem: Cron job returns 401 Unauthorized**

**Cause:** CRON_SECRET mismatch or not set

**Solution:**
1. Check Vercel environment variables: `CRON_SECRET` is set
2. **Redeploy** after adding environment variables
3. Test with: `curl "https://your-domain.com/api/cron/YOUR-ENDPOINT?secret=YOUR_SECRET"`

### **Problem: Cron job not running**

**Cause:** Vercel cron not enabled or `vercel.json` not deployed

**Solution:**
1. Ensure `vercel.json` is in your **root directory**
2. **Commit and push** `vercel.json` to GitHub
3. Check Vercel Dashboard → Settings → **Cron Jobs** tab
4. Verify cron jobs are listed there

### **Problem: Cron runs but does nothing**

**Cause:** Logic error or missing environment variables

**Solution:**
1. Check **Function logs** in Vercel Dashboard
2. Verify all environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `OPENAI_API_KEY` (for wish list matching)
   - `RESEND_API_KEY` (for email reminders)
3. Test the endpoint manually with curl

---

## 📊 What Each Cron Job Does

### 1. **Cleanup Expired Reservations** (Every Minute)

**Purpose:** Releases items that were added to cart but not purchased

**How it works:**
```
1. Finds all cart items older than 10 minutes
2. Calls Supabase function: release_expired_reservations
3. Sets item status back to 'active'
4. Removes from cart
5. Makes item available for others
```

**Why important:** Prevents items being "stuck" in abandoned carts

**Database function:**
```sql
release_expired_reservations()
```

---

### 2. **Wish List Matching** (Every Hour)

**Purpose:** AI matches buyer wish lists to available items

**How it works:**
```
1. Fetches all active wish lists
2. Fetches all active items
3. Calls OpenAI GPT-4 mini for semantic matching
4. Match scores: 0.70-1.00
5. Creates wishlist_matches records
6. Locks price at current value
7. Sends in-platform message to seller
8. Prevents duplicate notifications
```

**Why important:** 
- **UNIQUE TO BLOCKSWAP**
- Creates seller opportunities
- Builds buyer satisfaction
- Network effects

**API endpoint:**
```
/api/ai/match-wish-lists
```

**OpenAI Model:**
```javascript
model: "gpt-4-mini"
```

**Cost:** ~$0.01 per 100 matches

---

### 3. **Collection Reminders** (Daily at 9am)

**Purpose:** Emails buyers 24 hours before collection date

**How it works:**
```
1. Gets tomorrow's date range
2. Finds all orders with collection_date = tomorrow
3. Fetches buyer email addresses
4. Sends reminder emails via Resend
5. Includes:
   - Item details
   - Collection address (revealed 24hrs before!)
   - Collection time
   - Seller contact
```

**Why important:**
- Reduces no-shows
- Professional experience
- Privacy protection (address only revealed 24hrs before)

**Email service:** Resend API

**Template:** Collection reminder with item details

---

### 4. **Expire Trades** (Daily at Midnight)

**Purpose:** Closes expired trade offers

**How it works:**
```
1. Finds all 'pending' trade offers
2. Checks if expires_at < now
3. Updates status to 'expired'
4. Sends notifications to both parties
5. Releases any reserved items
```

**Why important:**
- Keeps trade offers fresh
- Prevents stale listings
- Cleans up database

**Trade expiration:** 7 days after creation

---

## 🎯 Best Practices

### **1. Monitor Regularly**
- Check Vercel logs weekly
- Look for 500 errors
- Ensure all jobs are running

### **2. Keep CRON_SECRET Secure**
- Never commit to Git
- Never share publicly
- Rotate every 6 months

### **3. Test After Changes**
- Test manually before deploying
- Check logs after deployment
- Monitor for 24 hours after changes

### **4. Optimize Frequency**
- Don't run too frequently (costs money)
- Don't run too infrequently (bad UX)
- Current schedule is optimal for BlockSwap

---

## 💰 Costs

### **Vercel Cron:**
- **Hobby Plan:** FREE (100,000 executions/month)
- **Pro Plan:** FREE (1,000,000 executions/month)

Your usage:
```
Cleanup: 1,440 calls/day (every minute)
Wish List: 24 calls/day (every hour)
Reminders: 1 call/day (9am)
Expire Trades: 1 call/day (midnight)
────────────────────────────
Total: ~45,000 calls/month
```

✅ **Well within free tier!**

### **OpenAI API (Wish List Matching):**
- Model: GPT-4 mini
- Cost: ~$0.01 per 100 matches
- Expected: ~$5-10/month at scale

### **Resend Email:**
- Free tier: 3,000 emails/month
- Your usage: ~30-100 emails/month
- ✅ **FREE!**

---

## 🚨 Emergency Procedures

### **To Disable All Cron Jobs:**

1. **Quick disable:**
   ```bash
   # Edit vercel.json
   {
     "crons": []
   }
   
   # Commit and push
   git add vercel.json
   git commit -m "Disable cron jobs"
   git push
   ```

2. **Temporary disable (no deploy):**
   - Vercel Dashboard → Settings → Cron Jobs
   - Toggle off individual jobs

### **To Disable One Job:**

```json
{
  "crons": [
    // Comment out the job you want to disable
    // {
    //   "path": "/api/cron/cleanup-expired-reservations",
    //   "schedule": "* * * * *"
    // },
    {
      "path": "/api/cron/process-wish-list-matches",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] CRON_SECRET is set in Vercel environment variables
- [ ] Vercel Dashboard shows cron jobs listed
- [ ] Test each endpoint manually with curl
- [ ] Check Function logs for successful execution
- [ ] Monitor for 24 hours
- [ ] Check database for:
  - [ ] Expired reservations being cleaned
  - [ ] Wish list matches being created
  - [ ] Trade offers being expired
  - [ ] Collection reminder emails being sent (check Resend dashboard)

---

## 🎉 You're All Set!

Your cron jobs are **fully configured, protected, and ready to run!**

### **What Happens Next:**

1. ✅ Vercel automatically calls your cron endpoints
2. ✅ Auth is handled via `x-vercel-cron-id` header
3. ✅ Logs are available in Vercel Dashboard
4. ✅ **No additional action needed!**

### **To Monitor:**

- **Vercel Dashboard** → Functions → View Logs
- **Supabase Dashboard** → Database → Check tables

---

## 📞 Support

**Questions?** Contact: support@blockswap.club

**Happy Automating! 🎉**

