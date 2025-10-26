# Storefront Products Source - Complete Explanation

## 🏪 How the Storefront Works

### **Overview**

The **Storefront** (Store page) is a **premium shopping experience** that displays a **curated selection of items** that are **Stripe-integrated for instant checkout**. It's different from the regular Marketplace.

---

## 🔍 Where Do Storefront Products Come From?

### **Source: Regular Items Table**

**IMPORTANT:** Storefront products come from the **SAME `items` table** as the regular marketplace, but with a **special filter**.

### **The Filter Criteria:**

```javascript
// From src/pages/Store.jsx (lines 16-21)
const loadItems = async () => {
  try {
    // 1. Fetch all 'active' items
    const allItems = await Item.filter({ status: "active" });
    
    // 2. Filter for items that have a stripe_price_id
    const stripeItems = allItems.filter(item => item.stripe_price_id);
    
    setItems(stripeItems);
  } catch (error) {
    console.error("Failed to load items:", error);
  }
};
```

### **Two Requirements for an Item to Appear in Storefront:**

1. ✅ `status = 'active'` (item is available)
2. ✅ `stripe_price_id IS NOT NULL` (item is Stripe-integrated)

---

## 📊 Database Schema

### **Items Table Structure**

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_urls TEXT[],
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'reserved'
  
  -- THESE FIELDS DETERMINE STOREFRONT INCLUSION:
  stripe_product_id TEXT, -- Stripe product ID (optional)
  stripe_price_id TEXT,   -- Stripe price ID (REQUIRED for storefront)
  
  -- Location & metadata
  location TEXT,
  postcode TEXT,
  category TEXT,
  condition TEXT,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient storefront queries
CREATE INDEX idx_items_stripe_price_id 
ON items(stripe_price_id) 
WHERE stripe_price_id IS NOT NULL;
```

---

## 🔄 How Items Get Added to Storefront

### **Option 1: Manual Stripe Integration (Current System)**

An item appears in the storefront when:

1. **Item is created** (via AddItem page or API)
2. **Admin/seller manually adds Stripe integration:**
   - Creates Stripe Product in Stripe Dashboard
   - Creates Stripe Price for that product
   - **Updates the item record** with `stripe_price_id`

```sql
-- Example: Manually adding Stripe integration to an item
UPDATE items 
SET 
  stripe_product_id = 'prod_ABC123',
  stripe_price_id = 'price_XYZ789'
WHERE id = 'item_uuid_here';
```

After this update, the item will **automatically appear** in the storefront.

### **Option 2: Automatic Stripe Integration (Recommended)**

Implement automatic Stripe product creation when an item is listed:

```javascript
// In AddItem.jsx or create-listing.js
const handleSubmit = async () => {
  // 1. Create item in database
  const { data: newItem } = await supabase
    .from('items')
    .insert([itemPayload])
    .select()
    .single();

  // 2. Create Stripe Product and Price
  const stripeProduct = await createStripeProduct({
    name: itemPayload.title,
    description: itemPayload.description,
    images: itemPayload.image_urls,
    metadata: {
      item_id: newItem.id,
      seller_id: currentUser.id
    }
  });

  const stripePrice = await createStripePrice({
    product: stripeProduct.id,
    unit_amount: Math.round(itemPayload.price * 100), // Convert to cents
    currency: 'aud'
  });

  // 3. Update item with Stripe IDs
  await supabase
    .from('items')
    .update({
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id
    })
    .eq('id', newItem.id);

  // Now the item will appear in the storefront!
};
```

---

## 🎯 Marketplace vs Storefront

### **Regular Marketplace**

- **All active items** regardless of Stripe integration
- Supports multiple payment methods (Bank Transfer, Crypto, Stripe)
- Supports negotiation, cart, bundles
- Complex purchase flow with payment wizard

**Query:**
```javascript
const marketplaceItems = await Item.filter({ status: "active" });
// Returns ALL active items
```

### **Storefront**

- **Only items with `stripe_price_id`**
- Stripe payments ONLY
- No negotiation - instant buy at listed price
- Streamlined checkout (Stripe Checkout hosted page)
- Premium visual design

**Query:**
```javascript
const allItems = await Item.filter({ status: "active" });
const storefrontItems = allItems.filter(item => item.stripe_price_id);
// Returns ONLY Stripe-integrated items
```

---

## 🚀 Purchase Flow Difference

### **Marketplace Purchase:**

```
1. User clicks "Buy Now" or "Add to Cart"
2. Opens PaymentWizard modal
3. User selects payment method:
   - Stripe (credit card)
   - Bank Transfer
   - Cryptocurrency
4. Payment details collected
5. Order created
6. Payment confirmation required (for bank/crypto)
```

### **Storefront Purchase:**

```
1. User clicks "Buy Now"
2. Item reserved for 10 minutes
3. Creates Stripe Checkout Session
4. Redirects to Stripe-hosted checkout page
5. User completes payment on Stripe
6. Webhook updates order status
7. Instant confirmation
```

**Code:**
```javascript
// From Store.jsx (lines 32-43)
const handlePurchase = async (priceId) => {
  setIsRedirecting(priceId);
  try {
    // Create Stripe Checkout session
    const { data } = await createStripeCheckoutSession({ 
      price_id: priceId 
    });
    
    // Redirect to Stripe checkout
    window.location.href = data.checkout_url;
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    alert("Error: Could not initiate purchase.");
  }
};
```

---

## 🛠️ Implementation for Mobile App

### **Step 1: Query Storefront Items**

```javascript
// MarketplaceService.js or StoreService.js
export const getStorefrontItems = async () => {
  try {
    // Fetch all active items
    const { data: allItems, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter for Stripe-integrated items
    const storefrontItems = allItems.filter(item => 
      item.stripe_price_id !== null && 
      item.stripe_price_id !== undefined
    );

    return storefrontItems;
  } catch (error) {
    console.error('Error fetching storefront items:', error);
    throw error;
  }
};
```

### **Step 2: Display Storefront Items**

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { supabase } from './supabase';
import StoreItemCard from './StoreItemCard';

export default function StorefrontScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorefrontItems();
  }, []);

  const loadStorefrontItems = async () => {
    setLoading(true);
    try {
      // Query items table
      const { data: allItems, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // CRITICAL FILTER: Only items with stripe_price_id
      const storefrontItems = allItems.filter(item => 
        item.stripe_price_id !== null
      );

      setItems(storefrontItems);
    } catch (error) {
      console.error('Error loading storefront:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    // Create Stripe Checkout session
    // Use item.stripe_price_id
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        price_id: item.stripe_price_id 
      })
    });

    const { checkout_url } = await response.json();
    
    // Open Stripe Checkout in webview or browser
    Linking.openURL(checkout_url);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No products available in the storefront
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Storefront</Text>
      <Text style={styles.subheader}>
        Exclusive products, ready for purchase
      </Text>
      
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <StoreItemCard 
            item={item} 
            onPurchase={() => handlePurchase(item)}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0F172A',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
```

---

## 📝 SQL Query Examples

### **Get All Storefront Items**

```sql
-- Simple query
SELECT * FROM items 
WHERE status = 'active' 
  AND stripe_price_id IS NOT NULL
ORDER BY created_at DESC;
```

### **Get Storefront Items with Seller Info**

```sql
SELECT 
  items.*,
  profiles.full_name as seller_name,
  profiles.email as seller_email
FROM items
INNER JOIN profiles ON items.seller_id = profiles.id
WHERE items.status = 'active' 
  AND items.stripe_price_id IS NOT NULL
ORDER BY items.created_at DESC;
```

### **Count Storefront vs Marketplace Items**

```sql
-- Total active items
SELECT COUNT(*) as marketplace_items
FROM items 
WHERE status = 'active';

-- Storefront items (subset of marketplace)
SELECT COUNT(*) as storefront_items
FROM items 
WHERE status = 'active' 
  AND stripe_price_id IS NOT NULL;
```

---

## 🔑 Key Differences Summary

| Feature | Marketplace | Storefront |
|---------|-------------|-----------|
| **Data Source** | `items` table | `items` table (filtered) |
| **Filter** | `status = 'active'` | `status = 'active' AND stripe_price_id IS NOT NULL` |
| **Payment Methods** | Bank Transfer, Crypto, Stripe | Stripe ONLY |
| **Checkout** | Payment Wizard (custom) | Stripe Checkout (hosted) |
| **Negotiation** | Supported | NOT supported |
| **Cart** | Supported | NOT supported (instant buy) |
| **Bundles** | Supported | NOT supported |
| **Reservation** | 10 minutes | 10 minutes |
| **Purchase Flow** | Complex (multiple steps) | Streamlined (redirect to Stripe) |

---

## 🎨 Visual Design Differences

### **Marketplace Items:**

- Standard card design
- "Add to Cart" + "Buy Now" buttons
- Price with negotiation indicator
- Multiple action options

### **Storefront Items:**

- Premium gradient design
- **Single "Buy Now" button**
- Clean, streamlined layout
- Reservation countdown timers
- No negotiation clutter

---

## ⚠️ Important Notes

1. **Same Database Table**: Storefront and Marketplace both use the `items` table
2. **Filter is Critical**: Only items with `stripe_price_id` appear in storefront
3. **No Manual Curation**: It's automatic based on `stripe_price_id` field
4. **Stripe Required**: Items MUST be integrated with Stripe to appear
5. **Status Matters**: Item must be `active`, not `sold` or `reserved`

---

## 🧪 Testing Scenarios

### **Test 1: Item WITHOUT Stripe Integration**

```javascript
const testItem = {
  id: 'item_123',
  title: 'Test Item',
  price: 100.00,
  status: 'active',
  stripe_price_id: null // NOT integrated
};

// Result: Appears in MARKETPLACE, NOT in STOREFRONT
```

### **Test 2: Item WITH Stripe Integration**

```javascript
const testItem = {
  id: 'item_456',
  title: 'Premium Item',
  price: 150.00,
  status: 'active',
  stripe_price_id: 'price_ABC123' // IS integrated
};

// Result: Appears in BOTH MARKETPLACE and STOREFRONT
```

### **Test 3: Sold Item**

```javascript
const testItem = {
  id: 'item_789',
  title: 'Sold Item',
  price: 200.00,
  status: 'sold', // Already sold
  stripe_price_id: 'price_XYZ789'
};

// Result: Appears in NEITHER (status is not 'active')
```

---

## 🚀 Future Enhancements

### **Automatic Stripe Integration**

Add a checkbox in the "Add Item" form:

```javascript
<Checkbox 
  label="Enable instant checkout (Storefront)"
  checked={enableStorefront}
  onChange={setEnableStorefront}
/>

// If checked, automatically:
// 1. Create Stripe Product
// 2. Create Stripe Price
// 3. Update item with stripe_price_id
```

### **Bulk Stripe Integration**

Admin tool to add Stripe integration to existing items:

```javascript
const bulkAddStripeIntegration = async (itemIds) => {
  for (const itemId of itemIds) {
    const item = await Item.get(itemId);
    
    // Create Stripe Product & Price
    const stripeProduct = await stripe.products.create({...});
    const stripePrice = await stripe.prices.create({...});
    
    // Update item
    await Item.update(itemId, {
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id
    });
  }
};
```

---

## 📖 Summary

**Where Storefront Products Come From:**
- ✅ Same `items` table as marketplace
- ✅ Filtered by `status = 'active'` AND `stripe_price_id IS NOT NULL`
- ✅ NOT a separate table or manual curation
- ✅ Automatic based on Stripe integration status

**To Make an Item Appear in Storefront:**
1. Create item in `items` table
2. Create Stripe Product and Price in Stripe
3. Update item record with `stripe_price_id`
4. Item automatically appears in storefront!

**Mobile App Query:**
```javascript
const storefrontItems = await supabase
  .from('items')
  .select('*')
  .eq('status', 'active')
  .not('stripe_price_id', 'is', null);
```

Simple! 🎯

