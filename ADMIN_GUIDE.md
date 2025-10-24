# 🔧 BlockSwap Admin Guide

## 🏆 **Promoted Listings & Auctions** - How to Access

### **As Super Admin:**

1. **Navigate to:** `/PromoteItem` page
   - Direct URL: `https://www.blockswap.club/PromoteItem`
   - OR: Click "Promote Items" in the sidebar navigation (📈 icon)

2. **What You'll See:**
   - **Active Promotions**: Currently running promotions across all categories
   - **Auction Bidding Interface**: Place bids for top spots
   - **Category Tabs**: Electronics, Furniture, Clothing, etc.
   - **Your Balance**: Available funds for bidding
   - **Bid History**: Transaction log of all bids

### **How Auctions Work:**

```
┌─────────────────────────────────────────────┐
│ PROMOTION AUCTION SYSTEM                    │
├─────────────────────────────────────────────┤
│ 1. Seller selects category (e.g., "Electronics") │
│ 2. Seller places bid (minimum $1.00)       │
│ 3. Highest bidder gets top spot             │
│ 4. Promotion runs for 7 days                │
│ 5. Funds deducted from seller balance       │
│ 6. Real-time bid tracking & notifications   │
└─────────────────────────────────────────────┘
```

### **Features:**
- ✅ Auction-based bidding for top spots
- ✅ Category-specific competitions  
- ✅ 7-day promotion duration
- ✅ Minimum bid: $1.00
- ✅ Real-time top bid tracking
- ✅ Balance validation
- ✅ Active promotion management
- ✅ Transaction logging

### **Database Tables:**
- `promotions` - Active and past promotions
- `promotion_bids` - All bids placed
- `seller_balances` - Seller funds available
- `balance_transactions` - Financial activity log

---

## 🎯 **Wish List System** - Location & How It Works

### **Access Points:**

#### **For Buyers:**
1. **Navigate to:** `/WishLists` page
   - Direct URL: `https://www.blockswap.club/WishLists`
   - OR: Click "Wish Lists" in sidebar navigation (⭐ icon)

2. **Create Wish List:**
   - Click "Create Wish List" button
   - Add item name, description, max price
   - Set acceptable conditions (New, Like New, Good, Fair, Poor)
   - Set location radius (5-100km)
   - AI automatically searches for matches!

#### **For Sellers:**
1. **Navigate to:** `/WishLists` page (same page!)
   - Sellers see a different view: **"AI Matches"** section
   - Shows buyers looking for items YOU'RE selling
   - **Price Locked** at current listing price (protection!)

### **How AI Matching Works:**

```
┌─────────────────────────────────────────────┐
│ AI WISH LIST MATCHING FLOW                  │
├─────────────────────────────────────────────┤
│ 1. Buyer creates wish list                  │
│    - Item name: "iPhone 14 Pro"             │
│    - Max price: $800                         │
│    - Condition: Good or better               │
│    - Location: 20km radius                   │
│                                              │
│ 2. AI Matching (Hourly Cron Job)            │
│    - Uses OpenAI GPT-4 mini                  │
│    - Semantic similarity matching            │
│    - Match scores: 0.70-1.00                 │
│    - Good (0.70-0.79)                        │
│    - Great (0.80-0.89)                       │
│    - Perfect (0.90-1.00)                     │
│                                              │
│ 3. Price Lock Protection 🔒                 │
│    - Seller lists "iPhone 14 Pro" for $750  │
│    - AI matches to buyer's wish list         │
│    - Price LOCKED at $750                    │
│    - Seller CANNOT increase price for buyer  │
│                                              │
│ 4. Seller Notification                       │
│    - In-platform message sent                │
│    - Shows match confidence (95%)            │
│    - Shows locked price ($750)               │
│    - Provides buyer contact link             │
│                                              │
│ 5. Buyer-Seller Connection                   │
│    - Direct messaging integrated             │
│    - Buyer contacts seller                   │
│    - Price guaranteed at locked rate         │
│    - Platform takes $0 commission!           │
└─────────────────────────────────────────────┘
```

### **🔒 Price Lock Protection - UNIQUE TO BLOCKSWAP!**

**Purpose:** Prevents seller price gouging after AI notification

**Example:**
```
1. Seller lists "Gaming Laptop" for $500
2. Buyer wish list: "Gaming laptop, max $600"
3. AI matches them (score: 0.92 - Perfect!)
4. Price LOCKED at $500 ✅
5. Seller gets notification
6. Seller tries to change price to $599 ❌
7. System blocks price increase for this buyer
8. Buyer contacts seller, guaranteed $500 price!
```

**Why This Matters:**
- ✅ Builds buyer trust
- ✅ Prevents manipulation
- ✅ **NO OTHER PLATFORM HAS THIS**
- ✅ Creates competitive moat

### **Technical Implementation:**

**Files:**
- `src/pages/WishLists.jsx` - Main UI (buyer view + seller matches)
- `api/ai/match-wish-lists.js` - AI matching logic
- `api/cron/process-wish-list-matches.js` - Hourly cron job
- Migration 043: Database schema

**Database Tables:**
- `wishlists` - Buyer's public wish lists
- `wishlist_items` - Individual items on wish lists
- `wishlist_matches` - AI-identified matches with PRICE LOCK

**Cron Job:**
- Runs every hour via Vercel Cron
- Processes all active wish lists
- Uses OpenAI for semantic matching
- Prevents duplicate notifications
- Sends in-platform messages to sellers

### **AI Matching Algorithm:**

```javascript
// OpenAI GPT-4 mini semantic matching
const matchScore = await openai.chat.completions.create({
  model: "gpt-4-mini",
  messages: [{
    role: "system",
    content: "You are a marketplace matching expert..."
  }, {
    role: "user",
    content: `
      Buyer wants: "${wishListItem.item_name}"
      Seller has: "${item.title}"
      
      Match score 0.70-1.00?
      Reasoning?
    `
  }]
});

// Score thresholds:
// 0.90-1.00 = Perfect match
// 0.80-0.89 = Great match
// 0.70-0.79 = Good match
// Below 0.70 = No match
```

---

## 📱 **Mobile App Development**

### **How Hard Would It Be?**

**Good News:** Your app is already well-structured for mobile!

### **Option 1: React Native (Recommended)**

**Effort:** ~2-4 weeks for MVP
**Cost:** $5,000-$15,000 (if outsourcing)

**Why React Native:**
- ✅ You're already using React
- ✅ 80%+ code reuse from web app
- ✅ Both iOS & Android from one codebase
- ✅ Supabase works great with React Native
- ✅ Stripe has React Native SDK
- ✅ OpenAI API works identically

**What Needs Changing:**
```
Component Mapping:
- Web: <div> → Mobile: <View>
- Web: <span> → Mobile: <Text>
- Web: <button> → Mobile: <TouchableOpacity>
- Web: CSS → Mobile: StyleSheet

Libraries to Replace:
- react-router-dom → @react-navigation/native
- CSS modules → StyleSheet API
- Web forms → React Native TextInput
- lucide-react → react-native-vector-icons

New Mobile Features:
- Push notifications (Expo)
- Camera integration (expo-camera)
- Location services (expo-location)
- Offline support (AsyncStorage)
```

**Recommended Stack:**
```
- React Native (0.73+)
- Expo (managed workflow)
- Supabase (same as web!)
- Stripe React Native SDK
- React Navigation
- React Native Reanimated
```

### **Option 2: Progressive Web App (PWA)**

**Effort:** ~1-2 days
**Cost:** FREE (you basically have it!)

**What You Get:**
- ✅ Add to home screen (iOS & Android)
- ✅ Offline support
- ✅ Push notifications (Android)
- ✅ App-like experience
- ❌ Not in App Store / Play Store
- ❌ Limited iOS features

**To Enable PWA:**
```javascript
// Add to vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BlockSwap',
        short_name: 'BlockSwap',
        description: 'Trade, Swap, Sell Locally',
        theme_color: '#ec4899',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
```

### **Option 3: Capacitor (Hybrid)**

**Effort:** ~1 week
**Cost:** $1,000-$3,000

**What It Is:**
- Take your existing web app
- Wrap it in a native shell
- Deploy to App Stores
- Full native API access

**Benefits:**
- ✅ 95% code reuse
- ✅ Real App Store presence
- ✅ Native features (camera, push, etc.)
- ✅ Faster than React Native conversion

### **Recommendation:**

**Phase 1 (NOW - Free):**
→ Enable PWA for instant mobile experience

**Phase 2 (2-3 months):**
→ Build React Native app for App Stores

**Phase 3 (6 months):**
→ Add mobile-specific features (AR for item preview, etc.)

---

## 🔐 **Environment Variables Checklist**

### **Vercel Environment Variables Needed:**

```bash
# OpenAI (AI Features)
OPENAI_API_KEY=sk-...

# Supabase (Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Resend (Emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@blockswap.club

# Cron Jobs (Security)
CRON_SECRET=<generated-secret>

# App Configuration
VITE_APP_URL=https://www.blockswap.club
```

### **How to Add to Vercel:**

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - **Key:** Variable name (e.g., `OPENAI_API_KEY`)
   - **Value:** The actual value
   - **Environments:** Production, Preview, Development
3. Click "Save"
4. **Redeploy** your app for changes to take effect

---

## 📧 **Contact/Support Page**

✅ **Already Created!**

**Access:**
- URL: `https://www.blockswap.club/Contact`
- Navigation: Click "Contact Us" in sidebar (✉️ icon)

**Features:**
- 📧 Email: support@blockswap.club
- 📞 Support hours (Mon-Sat)
- 📍 Location info
- 📝 Contact form
- 💬 FAQ section

**Form Sends To:** `support@blockswap.club` (via Resend)

---

## 🚀 **Next Steps:**

1. ✅ Add CRON_SECRET to Vercel (use generated value above)
2. ✅ Verify Resend is configured (check Supabase env vars)
3. ✅ Test Contact page (`/Contact`)
4. ✅ Test Promoted Listings (`/PromoteItem`)
5. ✅ Test Wish Lists (`/WishLists`)
6. ⏳ Consider PWA for quick mobile experience
7. ⏳ Plan React Native app for Q2 2025

---

## 📞 **Questions?**

Visit: https://www.blockswap.club/Contact
Email: support@blockswap.club

**Happy Selling! 🎉**

