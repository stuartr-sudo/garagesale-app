# Webhook Setup Guide

## Quick Start

Your webhook is ready to use! Just follow these steps:

## Step 1: Add Service Key to Vercel

The webhook needs a Supabase Service Role key for full database access.

### Get Your Service Key:
1. Go to: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/settings/api
2. Copy the **`service_role`** key (NOT the anon key)
3. This key is secret - never expose it in client-side code!

### Add to Vercel:
```bash
# Run this command (I'll do it for you):
vercel env add SUPABASE_SERVICE_KEY
```

When prompted:
- **Environment variable name:** Already filled: `SUPABASE_SERVICE_KEY`
- **Value:** Paste your service_role key
- **Environments:** Select `Production`, `Preview`, and `Development`

---

## Step 2: Your Webhook URL

Once deployed, your webhook will be available at:

```
https://garage-sale-40afc1f5.vercel.app/api/create-listing
```

---

## Step 3: Test It

```bash
curl -X POST https://garage-sale-40afc1f5.vercel.app/api/create-listing \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Item",
    "description": "Testing the webhook",
    "price": 10,
    "category": "other",
    "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"]
  }'
```

---

## What's Included

✅ **Image Upload Support:**
- Accept image URLs (HTTP/HTTPS)
- Accept base64 data URIs
- Multiple images per listing
- Automatic upload to Supabase Storage

✅ **Full Validation:**
- Required field checking
- Category validation
- Condition validation
- Price validation

✅ **Error Handling:**
- Detailed error messages
- Proper HTTP status codes
- Fallback mechanisms

✅ **Automatic Processing:**
- Creates database entry
- Uploads all images
- Sets listing to active status
- Returns complete item data

---

## Full Documentation

See `WEBHOOK_DOCUMENTATION.md` for:
- Complete API reference
- All request/response examples
- Error codes and handling
- Rate limiting guidelines
- Security best practices

---

## Deployment

Changes are auto-deployed via GitHub → Vercel integration.

After adding the service key, redeploy:
1. Go to: https://vercel.com/doubleclicks/garage-sale-40afc1f5
2. Click "Redeploy" on the latest deployment

---

## Support

Check Vercel logs for any issues:
https://vercel.com/doubleclicks/garage-sale-40afc1f5/logs

