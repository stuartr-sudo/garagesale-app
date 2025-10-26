# 🔄 SEPARATE DATABASE SETUP GUIDE

## Overview

This guide will help you create a **completely separate Supabase database** for your web app while keeping the mobile app database untouched.

---

## 📋 Prerequisites

- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Logged in to Supabase (`supabase login`)
- ✅ Access to your mobile app's Supabase project
- ✅ Access to Supabase dashboard (https://supabase.com/dashboard)

---

## 🚀 Step-by-Step Process

### **Step 1: Create New Supabase Project (Manual)**

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `garagesale-web` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier works fine for testing
4. Click **"Create new project"**
5. Wait 2-3 minutes while Supabase provisions your database

### **Step 2: Save New Project Credentials**

Once created, go to **Settings → API** and save:

```bash
# New WEB project credentials
Project ID: abc123xyz (example)
Project URL: https://abc123xyz.supabase.co
Anon Key: eyJhbGc...
Service Role Key: eyJhbGc...
```

You'll need these for your `.env` file later.

---

## 🔄 **Step 3: Clone Database Schema (Automated)**

I've created a script that will:
1. Connect to your **mobile** project
2. Pull the entire database schema
3. Connect to your **new web** project
4. Push the schema to the new database

**Run this:**

```bash
# Make script executable (if not already)
chmod +x scripts/clone-database-schema.sh

# Run the clone script
./scripts/clone-database-schema.sh
```

**You'll be prompted for:**
1. Mobile Project ID (your existing mobile app's project)
2. Web Project ID (your new web app's project)

**The script will clone:**
- ✅ All table structures
- ✅ All columns and constraints
- ✅ All indexes
- ✅ All RLS policies
- ✅ All functions (RPC)
- ✅ All triggers

**The script will NOT clone:**
- ❌ Data (rows) - tables will be empty
- ❌ Storage buckets
- ❌ Edge Functions
- ❌ Secrets

---

## 🔧 **Step 4: Update Environment Variables**

Update your `.env` file with the **NEW web project** credentials:

```bash
# OLD (remove or comment out)
# VITE_SUPABASE_URL=https://OLD_PROJECT_ID.supabase.co
# VITE_SUPABASE_ANON_KEY=old_anon_key

# NEW (from Step 2)
VITE_SUPABASE_URL=https://YOUR_NEW_WEB_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here

# Stripe (keep existing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

---

## 🎯 **Step 5: Deploy Stripe System to NEW Web Database**

Now that you have a **separate** database, you can safely deploy the Stripe system:

```bash
./scripts/deploy-stripe-system.sh
```

**When prompted:**
- **Project ID**: Enter your **NEW web project ID** (NOT mobile!)
- **Stripe Secret Key**: Enter your Stripe test key (`sk_test_...`)

This will:
1. Deploy `create-payment-intent` Edge Function to **web project only**
2. Set Stripe secret for **web project only**
3. Run database migration for **web project only**

---

## ✅ **Step 6: Verify Separation**

### Check Mobile App (Should be UNCHANGED):
```bash
# Link to mobile project
supabase link --project-ref YOUR_MOBILE_PROJECT_ID

# Check functions
supabase functions list
# Mobile functions should be unchanged

# Check database
supabase db pull
# Mobile database should be unchanged
```

### Check Web App (Should have NEW setup):
```bash
# Link to web project
supabase link --project-ref YOUR_NEW_WEB_PROJECT_ID

# Check functions
supabase functions list
# Should show: create-payment-intent

# Check database
supabase db pull
# Should show: process_purchase function + new columns
```

---

## 🧪 **Step 7: Test Web App**

```bash
# Restart dev server with new .env
npm run dev

# Test:
1. Navigate to Marketplace
2. Click "Buy Now"
3. Go to Cart
4. Click "Pay with Credit Card (Stripe)"
5. Enter test card: 4242 4242 4242 4242
6. Complete payment
7. Verify order in "My Orders"
```

---

## 📊 **What You'll Have After This**

### Mobile App (UNCHANGED):
- ✅ Uses original Supabase project
- ✅ Original database untouched
- ✅ Original Edge Functions untouched
- ✅ All mobile data preserved

### Web App (NEW):
- ✅ Uses new Supabase project
- ✅ Fresh database with cloned schema
- ✅ New Stripe Edge Function
- ✅ Completely isolated from mobile

---

## ⚠️ **Important Notes**

### Data Separation
- **Web and Mobile will NOT share data**
- Users, items, orders will be separate
- This is a **completely isolated environment**

### If You Want Shared Data Later
If you later decide you want web and mobile to share data:
1. Pick one project (probably mobile's existing one)
2. Deploy web's Stripe changes to that project
3. Update web's `.env` to point back to mobile's project
4. Test thoroughly before switching

### Authentication
- Web users and mobile users will be **separate**
- Same email can register on both (different accounts)
- Consider this when planning user experience

### Storage Buckets
The clone script doesn't copy storage buckets. To set them up:

```sql
-- Run in your NEW web project's SQL Editor
-- Copy from: supabase/migrations/004_create_storage_buckets.sql
-- or run:
```
```bash
# Find storage bucket migrations
grep -r "storage.buckets" supabase/migrations/
```

---

## 🎉 **Success Checklist**

- [ ] New Supabase project created
- [ ] New project credentials saved
- [ ] Clone script run successfully
- [ ] `.env` updated with new project URL and keys
- [ ] Stripe deployment script run on NEW project
- [ ] Mobile app still works (verify unchanged)
- [ ] Web app works with test payment (4242 4242 4242 4242)
- [ ] Order created in NEW web database
- [ ] Mobile and web are completely separate

---

## 🆘 **Troubleshooting**

### "Could not connect to project"
- Verify you're logged in: `supabase login`
- Verify project ID is correct
- Check Supabase dashboard that project exists

### "Schema pull failed"
- Check your mobile project is accessible
- Verify you have proper permissions
- Try manually: `supabase link --project-ref MOBILE_ID && supabase db pull`

### "Schema push failed"
- Check new web project exists
- Verify database is provisioned (wait 2-3 mins after creation)
- Check for SQL syntax errors in migrations

### "Web app can't connect to database"
- Double-check `.env` file has correct URL and anon key
- Restart dev server: `pkill -f vite && npm run dev`
- Check browser console for connection errors

---

## 📞 **Need Help?**

If you run into issues:
1. Check the script output for specific errors
2. Verify both project IDs are correct
3. Ensure you've saved the correct credentials
4. Make sure you're logged in to Supabase CLI

---

## 🚀 **Ready?**

Once you've completed these steps, you'll have:
- ✅ Mobile app: Unchanged, working as before
- ✅ Web app: New database, new Stripe setup, completely separate

Let's do this! 🎉

