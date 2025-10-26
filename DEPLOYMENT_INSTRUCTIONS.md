# 🚀 STRIPE PAYMENT SYSTEM - DEPLOYMENT INSTRUCTIONS

## ⚡ Quick Start (Automated)

```bash
# Make script executable
chmod +x scripts/deploy-stripe-system.sh

# Run deployment script
./scripts/deploy-stripe-system.sh
```

The script will:
1. ✅ Check Supabase CLI installation
2. ✅ Verify login status
3. ✅ Deploy Edge Function
4. ✅ Set Stripe Secret Key
5. ✅ Run database migration
6. ✅ Verify deployment

---

## 📋 Manual Deployment (If Needed)

### Step 1: Deploy Supabase Edge Function

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project ID)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy Edge Function
supabase functions deploy create-payment-intent

# Expected output:
# Deploying function create-payment-intent...
# Function URL: https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-payment-intent
```

### Step 2: Set Stripe Secret Key

```bash
# Set the secret (use sk_test_ for testing, sk_live_ for production)
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE --project-ref YOUR_PROJECT_ID

# Verify it was set (won't show the actual value)
supabase secrets list --project-ref YOUR_PROJECT_ID

# Expected output:
# STRIPE_SECRET_KEY
```

### Step 3: Run Database Migration

```bash
# Push database migrations
supabase db push --project-ref YOUR_PROJECT_ID

# Or manually in Supabase Dashboard → SQL Editor:
# Copy and run contents of: supabase/migrations/046_stripe_payment_system.sql
```

### Step 4: Update Environment Variables

Ensure your `.env` file has:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe (Publishable Key ONLY - frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

**IMPORTANT**: 
- ❌ DO NOT put `STRIPE_SECRET_KEY` in `.env`
- ✅ Secret key is stored securely in Supabase secrets

### Step 5: Restart Development Server

```bash
# Kill existing process
pkill -f "vite"

# Restart
npm run dev
```

---

## 🧪 Testing

### Test Card Numbers

| Card Number         | Scenario          |
|---------------------|-------------------|
| `4242 4242 4242 4242` | ✅ Success       |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

**Expiry**: Any future date (e.g., `12/34`)  
**CVC**: Any 3 digits (e.g., `123`)  
**ZIP**: Any 5 digits (e.g., `12345`)

### Test Flow

1. Open your app in the browser
2. Navigate to **Marketplace**
3. Click **"Buy Now"** on any item
4. Verify you're on the **Cart** page
5. Click **"Pay with Credit Card (Stripe)"**
6. Verify you're on the **Stripe Checkout** page
7. Enter test card: `4242 4242 4242 4242`
8. Enter any future expiry, any CVC, any ZIP
9. Click **"Pay $X.XX"**
10. Verify **"Processing Your Order..."** overlay appears
11. Wait for redirect to **"My Orders"** page
12. Verify:
    - Order appears with status **"payment_confirmed"**
    - Item shows as **"Sold"** on detail page
    - Seller balance increased (if applicable)

---

## 🔍 Troubleshooting

### Error: "STRIPE_SECRET_KEY not configured"

**Cause**: Stripe secret not set in Supabase

**Solution**:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx --project-ref YOUR_PROJECT_ID
```

### Error: "Failed to create payment intent"

**Cause**: Edge Function not deployed or Stripe API issue

**Solution**:
```bash
# Check if function exists
supabase functions list

# View logs
supabase functions logs create-payment-intent

# Test manually
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"amount": 5000, "currency": "aud", "itemId": "test"}'
```

Expected response:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx"
}
```

### Error: "Could not find the function process_purchase"

**Cause**: Database migration not run

**Solution**:
```bash
supabase db push --project-ref YOUR_PROJECT_ID
```

Or manually in Supabase SQL Editor:
```sql
-- Copy and run: supabase/migrations/046_stripe_payment_system.sql
```

### Error: Payment succeeds but order not created

**Cause**: RPC function error

**Solution**:
1. Open browser console (F12)
2. Look for `❌ RPC process_purchase error:`
3. Check if items are already sold
4. Verify user permissions
5. Test RPC manually in Supabase SQL Editor:

```sql
SELECT * FROM process_purchase(
  'YOUR_BUYER_ID'::uuid,
  ARRAY['ITEM_ID']::uuid[],
  'collect',
  'Australia/Sydney'
);
```

### Error: "Environment variables not loading"

**Cause**: `.env` file not read or dev server not restarted

**Solution**:
```bash
# Verify .env file exists and has correct values
cat .env

# Kill all vite processes
pkill -f "vite"

# Restart dev server
npm run dev
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER FLOW                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  Marketplace   │
                     │  Click "Buy"   │
                     └────────┬───────┘
                              │
                              ▼
                     ┌────────────────┐
                     │   Cart Page    │
                     │ Select Payment │
                     └────────┬───────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  StripeCheckout.jsx     │
                │  Call Edge Function     │
                └───────────┬─────────────┘
                            │
                            ▼
          ┌──────────────────────────────────┐
          │  Supabase Edge Function          │
          │  create-payment-intent           │
          │  - Uses STRIPE_SECRET_KEY        │
          │  - Creates Payment Intent        │
          │  - Returns clientSecret          │
          └────────────┬─────────────────────┘
                       │
                       ▼
          ┌──────────────────────────────────┐
          │  Stripe Elements                 │
          │  User enters card details        │
          │  stripe.confirmCardPayment()     │
          └────────────┬─────────────────────┘
                       │
                       ▼
          ┌──────────────────────────────────┐
          │  Payment Success                 │
          │  Call process_purchase() RPC     │
          └────────────┬─────────────────────┘
                       │
                       ▼
          ┌──────────────────────────────────┐
          │  process_purchase() RPC          │
          │  - Mark items SOLD               │
          │  - Create orders                 │
          │  - Clear cart                    │
          │  - Drop reservations             │
          │  - Disable bundles               │
          │  ✅ ATOMIC TRANSACTION           │
          └────────────┬─────────────────────┘
                       │
                       ▼
          ┌──────────────────────────────────┐
          │  Navigate to "My Orders"         │
          │  Show success message            │
          └──────────────────────────────────┘
```

---

## 📁 Files Changed

### Created:
- ✅ `supabase/functions/create-payment-intent/index.ts`
- ✅ `supabase/migrations/046_stripe_payment_system.sql`
- ✅ `scripts/deploy-stripe-system.sh`
- ✅ `STRIPE_SETUP_COMPLETE.md`
- ✅ `DEPLOYMENT_INSTRUCTIONS.md`

### Modified:
- ✅ `src/pages/StripeCheckout.jsx` (Complete rewrite)
- ✅ `src/pages/Cart.jsx` (Already correct, no changes needed)

### Deleted:
- ❌ `api/stripe/create-payment-intent.js` (Old Vercel function)
- ❌ `api/stripe/create-payment-intent-with-fee.js` (Old Vercel function)
- ❌ `src/components/payment/StripePaymentForm.jsx` (Old form)

---

## ✅ Deployment Checklist

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link --project-ref YOUR_PROJECT_ID`)
- [ ] Edge Function deployed (`supabase functions deploy create-payment-intent`)
- [ ] Stripe secret set (`supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx`)
- [ ] Database migration run (`supabase db push`)
- [ ] `.env` file has `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Dev server restarted (`npm run dev`)
- [ ] Test payment successful (4242 4242 4242 4242)
- [ ] Order created in database
- [ ] Item marked as sold
- [ ] User navigated to "My Orders"

---

## 🎉 Success!

Once all steps are complete, your Stripe payment system is live and matches the proven mobile app implementation.

**Next Steps:**
1. Test thoroughly with test cards
2. Verify seller balance updates
3. Check order creation
4. Test error scenarios (declined cards, etc.)
5. Switch to production keys when ready (`sk_live_`, `pk_live_`)

For detailed documentation, see `STRIPE_SETUP_COMPLETE.md`.

Happy selling! 🚀

