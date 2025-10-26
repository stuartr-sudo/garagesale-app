# Trade Offer 500 Error - Troubleshooting Guide

## Error
```
POST /api/trading/propose-trade 500 (Internal Server Error)
```

## Likely Causes

### 1. Missing Environment Variables (Most Likely)
The API requires these variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

**Check Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Ensure these are set:
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_KEY` = Your Supabase service role key (not anon key!)

### 2. Database Schema Issues

**Required Tables:**
- `trade_offers`
- `trade_items`
- `items` (with `status` and `reserved_until` columns)
- `profiles` (with `open_to_trades` column)
- `conversations`
- `messages`

**Check if tables exist:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trade_offers', 'trade_items', 'conversations', 'messages');
```

**Check if columns exist:**
```sql
-- Check items table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('status', 'reserved_until');

-- Check profiles table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'open_to_trades';
```

### 3. RLS Policies

The API uses `SUPABASE_SERVICE_KEY` which bypasses RLS, but check if tables exist:

```sql
-- Check if trade_offers table exists
SELECT * FROM trade_offers LIMIT 1;

-- Check if trade_items table exists
SELECT * FROM trade_items LIMIT 1;
```

## Required Migrations

If tables are missing, run these migrations:

### Migration: 043_messaging_trading_wishlist.sql
Should create:
- `trade_offers` table
- `trade_items` table
- `conversations` table
- `messages` table

### Check Migration Status
```sql
-- See which migrations have run
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC;
```

## API Endpoint Requirements

**Input (req.body):**
```javascript
{
  target_item_id: "uuid",          // REQUIRED
  target_seller_id: "uuid",        // REQUIRED
  offeror_id: "uuid",              // REQUIRED
  offered_item_ids: ["uuid"],      // REQUIRED (array, at least 1)
  cash_adjustment: 0,              // OPTIONAL (0-500)
  message: "text"                  // OPTIONAL
}
```

**Validation Checks:**
1. All required fields present
2. At least 1 offered item
3. Cash adjustment 0-500
4. Not trading with self
5. Both users have `open_to_trades = true`
6. Target item exists and is active
7. Offered items exist, active, belong to offeror
8. No existing pending trade for target item

## How to Debug

### 1. Check Vercel Function Logs
```bash
vercel logs
# or in Vercel dashboard → Deployments → [your deployment] → Functions
```

### 2. Check Browser Console
Look for the actual request payload:
```javascript
// In browser console
// Network tab → propose-trade request → Payload
```

### 3. Test API Directly
```bash
curl -X POST https://www.blockswap.club/api/trading/propose-trade \
  -H "Content-Type: application/json" \
  -d '{
    "target_item_id": "YOUR_ITEM_ID",
    "target_seller_id": "SELLER_ID",
    "offeror_id": "YOUR_USER_ID",
    "offered_item_ids": ["YOUR_OFFERED_ITEM_ID"],
    "cash_adjustment": 0,
    "message": "Test trade"
  }'
```

## Quick Fixes

### Fix 1: Add Missing Environment Variables
In Vercel:
1. Settings → Environment Variables
2. Add `SUPABASE_URL`
3. Add `SUPABASE_SERVICE_KEY`
4. Redeploy

### Fix 2: Enable Trading for User
```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET open_to_trades = true 
WHERE id = 'YOUR_USER_ID';
```

### Fix 3: Check Item Status
```sql
-- Ensure item is active
UPDATE items 
SET status = 'active' 
WHERE id = 'TARGET_ITEM_ID';
```

## Expected Flow

1. User clicks "Propose Trade" button
2. TradeModal opens
3. User selects items to offer
4. User adds optional cash adjustment
5. User clicks "Send Trade Offer"
6. Frontend calls `/api/trading/propose-trade`
7. API validates everything
8. API creates trade_offer record
9. API creates trade_items records
10. API reserves offered items
11. API sends notification message
12. Returns success

## Common Errors

### "Trading is not enabled"
```sql
UPDATE profiles SET open_to_trades = true WHERE id = 'user_id';
```

### "Target item not found"
- Item doesn't exist
- Item status is not 'active'
- Item is sold/deleted

### "Some offered items not available"
- Items don't belong to offeror
- Items are not active
- Items don't exist

### "Already a pending trade offer"
```sql
-- Find and cancel/reject pending offer
UPDATE trade_offers 
SET status = 'rejected' 
WHERE item_id_requested = 'target_item_id' 
AND status = 'pending';
```

## Frontend Component

Check if `TradeModal` is sending correct data:
```javascript
// src/components/trading/TradeModal.jsx
// Should send:
{
  target_item_id: item.id,
  target_seller_id: item.seller_id,
  offeror_id: currentUser.id,
  offered_item_ids: selectedItems.map(i => i.id),
  cash_adjustment: cashAdjustment,
  message: message
}
```

## Next Steps

1. ✅ Check Vercel environment variables
2. ✅ Check Vercel function logs for actual error
3. ✅ Verify `open_to_trades` is true for both users
4. ✅ Verify all required tables exist
5. ✅ Test API directly with curl
6. ✅ Check frontend is sending correct payload

## Need More Help?

**Check these logs:**
1. Vercel function logs (most important!)
2. Browser console network tab
3. Supabase logs
4. Database table existence

**The 500 error means something failed server-side. The Vercel logs will show the exact error message.**

