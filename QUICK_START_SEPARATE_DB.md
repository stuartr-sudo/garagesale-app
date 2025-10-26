# 🚀 QUICK START: Separate Database Setup

## TL;DR - What You Need to Do

### 1️⃣ Create New Supabase Project (2 minutes)
- Go to https://supabase.com/dashboard
- Click "New Project"
- Name: `garagesale-web`
- Save: Project ID, URL, Anon Key

### 2️⃣ Clone Database Schema (1 minute)
```bash
./scripts/clone-database-schema.sh
```
Enter:
- Mobile Project ID (existing)
- Web Project ID (new)

### 3️⃣ Update .env (30 seconds)
```bash
VITE_SUPABASE_URL=https://YOUR_NEW_WEB_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key
```

### 4️⃣ Deploy Stripe (2 minutes)
```bash
./scripts/deploy-stripe-system.sh
```
Enter:
- Web Project ID (new)
- Stripe Secret Key (sk_test_...)

### 5️⃣ Test (1 minute)
```bash
npm run dev
```
- Buy item
- Pay with 4242 4242 4242 4242
- Check "My Orders"

---

## ✅ Result

**Mobile App**: Unchanged, untouched, working perfectly ✅  
**Web App**: New database, isolated, ready to go ✅

---

## 📚 Detailed Guides

- **Full Setup**: See `SEPARATE_DATABASE_SETUP.md`
- **Stripe Deployment**: See `DEPLOYMENT_INSTRUCTIONS.md`
- **Implementation Details**: See `STRIPE_SETUP_COMPLETE.md`

---

## 🆘 Troubleshooting

**Script fails?**
- Check: `supabase login` (logged in?)
- Check: Project IDs are correct
- Check: Both projects exist in dashboard

**Web app can't connect?**
- Check: `.env` file has correct URL
- Restart: `pkill -f vite && npm run dev`

**Need help?**
- Check script output for errors
- Verify credentials in Supabase dashboard
- Review `SEPARATE_DATABASE_SETUP.md`

---

**Total Time**: ~7 minutes  
**Mobile Impact**: ZERO ✅  
**Web Result**: Fully working Stripe payments ✅

