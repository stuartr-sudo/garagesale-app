# 🚨 URGENT: Run This SQL Migration

## ❌ Current Error:
```
PGRST205: Could not find the table 'public.orders' in the schema cache
```

## ✅ Solution:
Run the SQL migration to create the `orders` table in your Supabase database.

---

## 📋 Steps to Fix:

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New query"

### 3. Copy & Paste This SQL
Copy the entire contents of this file:
```
supabase/migrations/009_orders_and_payment_tracking.sql
```

### 4. Run the Migration
- Paste the SQL into the editor
- Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### 5. Verify Success
You should see:
```
Success. No rows returned
```

---

## 🔍 What This Creates:

### `orders` Table:
- `id` - Unique order identifier
- `item_id` - Reference to the item being purchased
- `buyer_id` - Who is buying
- `seller_id` - Who is selling
- `total_amount` - Total price including shipping
- `delivery_method` - 'collect' or 'ship'
- `status` - Current order status
- `payment_deadline` - 10-minute timer deadline
- `tracking_number` - For shipped orders
- `collection_address` - For collected orders
- And more...

### RLS Policies:
- Buyers can view their orders
- Sellers can view their orders
- Buyers can create orders
- Both can update their orders

### Functions:
- `update_orders_updated_at()` - Auto-updates timestamp
- `handle_expired_orders()` - Expires unpaid orders

---

## ⚡ Quick Copy-Paste:

Open this file and copy all contents:
```bash
cat supabase/migrations/009_orders_and_payment_tracking.sql
```

Or view it in your editor at:
`/Users/stuarta/garage-sale-40afc1f5/supabase/migrations/009_orders_and_payment_tracking.sql`

---

## ✅ After Running:

1. Refresh your app
2. Try clicking "Continue to Payment" again
3. The error should be gone!

---

## 🆘 If You Get An Error:

**Error: "relation already exists"**
- This is OK! It means the table was already created
- The migration uses `IF NOT EXISTS` so it's safe to run multiple times

**Error: "permission denied"**
- Make sure you're using the correct Supabase project
- Check you have admin access to the database

**Other errors:**
- Copy the error message
- Let me know and I'll help fix it

