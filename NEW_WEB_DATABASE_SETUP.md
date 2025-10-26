# 🎉 NEW WEB DATABASE - READY TO SETUP

## ✅ **Good News!**

I can see your Supabase projects:

1. **BlockSwap** (Mobile) - `biwuxtvgvkkltrdpuptl` - US East 1
2. **BlockSwap Web** (NEW!) - `uounrdaescblpgwkgbdq` - AP Southeast 1

The web database is **completely empty** and ready for setup! ✅

---

## 🚀 **Two Options to Set It Up**

### **Option 1: Use My Clone Script (EASIEST)**

```bash
./scripts/clone-database-schema.sh
```

When prompted:
- **Mobile Project ID**: `biwuxtvgvkkltrdpuptl`
- **Web Project ID**: `uounrdaescblpgwkgbdq`

This will automatically clone all 39 tables from mobile to web! 🎉

---

### **Option 2: Manual Migration (If Script Fails)**

If the script doesn't work, you can manually apply migrations:

1. **Link to web project:**
```bash
supabase link --project-ref uounrdaescblpgwkgbdq
```

2. **Push all migrations:**
```bash
supabase db push
```

This will run all migrations in `supabase/migrations/` folder.

---

## 🔧 **After Schema is Cloned**

### **Step 1: Update .env**

Update your `.env` file with the NEW web project:

```bash
# OLD (remove or comment out)
# VITE_SUPABASE_URL=https://biwuxtvgvkkltrdpuptl.supabase.co
# VITE_SUPABASE_ANON_KEY=old_key

# NEW Web Project
VITE_SUPABASE_URL=https://uounrdaescblpgwkgbdq.supabase.co
VITE_SUPABASE_ANON_KEY=<your_web_anon_key>

# Stripe (keep existing)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

**Where to get the anon key:**
1. Go to https://supabase.com/dashboard/project/uounrdaescblpgwkgbdq
2. Settings → API
3. Copy "anon" key

---

### **Step 2: Deploy Stripe Edge Function**

```bash
./scripts/deploy-stripe-system.sh
```

When prompted:
- **Project ID**: `uounrdaescblpgwkgbdq` (web project)
- **Stripe Secret**: Your Stripe test secret key

This will:
- Deploy `create-payment-intent` Edge Function
- Set Stripe secret key
- Run Stripe-specific migrations

---

### **Step 3: Test**

```bash
# Restart dev server
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

## 📊 **What Will Be Different**

### **Mobile App (UNCHANGED)**
- Uses: `biwuxtvgvkkltrdpuptl`
- Database: All existing data preserved
- Edge Functions: Unchanged
- Users: Existing users unchanged

### **Web App (NEW)**
- Uses: `uounrdaescblpgwkgbdq`
- Database: Fresh, empty tables
- Edge Functions: Will deploy Stripe function
- Users: Separate from mobile (fresh start)

---

## ✅ **Ready?**

Run this command to get started:

```bash
./scripts/clone-database-schema.sh
```

Mobile IDs: `biwuxtvgvkkltrdpuptl`  
Web Project ID: `uounrdaescblpgwkgbdq`

Let me know if you need help! 🚀

