# Cart and Upsell Logic for Mobile App

This document provides comprehensive information about the shopping cart and upsell recommendation system in the garage sale app, designed for mobile app implementation.

## Overview

The cart and upsell system provides:
- **Smart Cart Management**: 10-minute item reservations to prevent double-selling
- **Dynamic Button States**: "Add to Cart" → "Go to Cart" → "Added" states
- **Intelligent Upsells**: 6 different recommendation algorithms
- **Special Offers**: BOGO, percentage discounts, bulk discounts, bundle deals
- **Real-time Updates**: Live cart count and availability tracking
## Core Components

### 1. Database Schema

#### Tables Required:
```sql
-- Cart items with reservations
cart_items (
  id, item_id, buyer_id, quantity, negotiated_price, 
  price_source, reserved_until, reservation_status, added_at
)

-- Special offers and discounts
special_offers (
  id, title, description, offer_type, config, 
  item_ids, is_active, starts_at, ends_at
)

-- Items for recommendations
items (
  id, title, description, price, image_urls, 
  category, condition, seller_id, views_count, 
  is_sold, sold_at, status
)

-- Orders for "recently sold" recommendations
orders (
  id, item_id, buyer_id, status, created_at
)
```

### 2. Cart State Management

#### Button State Flow:
```javascript
// Initial State
<Button>Add to Cart</Button>

// After Adding (with reservation)
<Button disabled>
  <Check className="w-4 h-4 mr-1" />
  Added
</Button>

// Cart Icon Updates
<CartIcon count={cartCount} />
```

#### Reservation System:
```javascript
const RESERVATION_DURATION_MINUTES = 10;

// Add to cart with reservation
const reservedUntil = new Date();
reservedUntil.setMinutes(reservedUntil.getMinutes() + RESERVATION_DURATION_MINUTES);

// Check availability before adding
const { data: available } = await supabase
  .rpc('check_item_availability', {
    p_item_id: itemId,
    p_buyer_id: buyerId
  });
```

### 3. Cart Operations

#### Add to Cart Logic:
```javascript
export async function addToCart({
  itemId,
  buyerId,
  quantity = 1,
  negotiatedPrice = null,
  priceSource = 'original'
}) {
  // Step 1: Check availability
  const { data: available } = await supabase
    .rpc('check_item_availability', {
      p_item_id: itemId,
      p_buyer_id: buyerId
    });

  if (!available) {
    return { success: false, error: 'Item not available' };
  }

  // Step 2: Calculate reservation expiry
  const reservedUntil = new Date();
  reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);

  // Step 3: Add to cart with reservation
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      item_id: itemId,
      buyer_id: buyerId,
      quantity,
      negotiated_price: negotiatedPrice,
      price_source: priceSource,
      reserved_until: reservedUntil.toISOString(),
      reservation_status: 'active'
    });

  return { success: true, data, reservedUntil };
}
```

#### Cart Loading with Validation:
```javascript
const loadCart = async () => {
  // Load cart items with item details
  const { data: items } = await supabase
    .from('cart_items')
    .select(`
      id, quantity, negotiated_price, price_source, reserved_until,
      item:items(
        id, title, description, price, image_urls, 
        condition, category, seller_id, is_sold, sold_at
      )
    `)
    .eq('buyer_id', userId);

  // Filter out sold items and expired reservations
  const availableItems = items.filter(cartItem => {
    const item = cartItem.item;
    const isExpired = cartItem.reserved_until && 
                     new Date(cartItem.reserved_until) < new Date();
    const isSold = item.is_sold;
    
    return !isSold && !isExpired;
  });

  setCartItems(availableItems);
};
```

## Upsell Recommendation System

### 1. Recommendation Algorithms

#### 6 Different Algorithms:

**1. Similar Items** (`algorithm: 'similar'`)
```javascript
const getSimilarItems = async () => {
  const priceMin = parseFloat(currentItem.price) * 0.5;
  const priceMax = parseFloat(currentItem.price) * 1.5;

  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .eq('category', currentItem.category)
    .neq('id', currentItemId)
    .gte('price', priceMin)
    .lte('price', priceMax)
    .limit(limit);

  return data || [];
};
```

**2. Trending Items** (`algorithm: 'trending'`)
```javascript
const getTrendingItems = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .neq('id', currentItemId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('views_count', { ascending: false })
    .limit(limit);

  return data || [];
};
```

**3. History-Based** (`algorithm: 'history'`)
```javascript
const getHistoryBasedItems = async () => {
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .eq('category', currentItem.category)
    .neq('id', currentItemId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
};
```

**4. Price-Based** (`algorithm: 'price'`)
```javascript
const getPriceBasedItems = async () => {
  const priceMin = parseFloat(currentItem.price) * 0.7;
  const priceMax = parseFloat(currentItem.price) * 1.3;

  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .neq('id', currentItemId)
    .gte('price', priceMin)
    .lte('price', priceMax)
    .order('views_count', { ascending: false })
    .limit(limit);

  return data || [];
};
```

**5. Seller Items** (`algorithm: 'seller'`)
```javascript
const getSellerItems = async () => {
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .eq('seller_id', currentItem.seller_id)
    .neq('id', currentItemId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
};
```

**6. Recently Sold** (`algorithm: 'sold'`)
```javascript
const getRecentlySoldItems = async () => {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      item:items (
        id, title, image_urls, category, price, 
        description, condition, location
      )
    `)
    .in('status', ['completed', 'payment_confirmed', 'shipped'])
    .order('created_at', { ascending: false })
    .limit(limit);

  return orders.map(order => order.item).filter(item => item);
};
```

### 2. Recommendation UI Components

#### Smart Recommendations Component:
```javascript
<SmartRecommendations 
  currentItemId={itemId}
  currentItem={item}
  algorithm="similar" // or 'trending', 'history', 'price', 'seller', 'sold'
  limit={6}
  title="You Might Also Like"
  showViewAll={true}
/>
```

#### Algorithm-Specific UI:
```javascript
const getAlgorithmTitle = () => {
  switch (algorithm) {
    case 'trending': return 'Trending Now';
    case 'history': return 'You Might Also Like';
    case 'price': return 'Similar Price Range';
    case 'seller': return 'More from this Seller';
    case 'sold': return 'Recently Sold';
    default: return 'Similar Items';
  }
};

const getAlgorithmDescription = () => {
  switch (algorithm) {
    case 'trending': return 'Most popular items this week';
    case 'history': return 'Based on what you\'ve been viewing';
    case 'price': return 'Items in your price range';
    case 'seller': return 'Other items from this seller';
    case 'sold': return 'Real purchases from our community';
    default: return 'Items you might be interested in';
  }
};
```

## Special Offers System

### 1. Offer Types

#### BOGO (Buy One Get One Free):
```javascript
if (offer.offer_type === 'bogo') {
  const buyQty = config.buy_quantity || 1;
  const getQty = config.get_quantity || 1;
  
  applicableItems.forEach(ci => {
    const sets = Math.floor(ci.quantity / (buyQty + getQty));
    const freeItems = sets * getQty;
    const itemDiscount = parseFloat(ci.item.price) * freeItems;
    discountAmount += itemDiscount;
  });
}
```

#### Percentage Discount:
```javascript
if (offer.offer_type === 'percentage_off') {
  const percentage = config.percentage || 0;
  
  applicableItems.forEach(ci => {
    const itemTotal = parseFloat(ci.item.price) * ci.quantity;
    const itemDiscount = itemTotal * (percentage / 100);
    discountAmount += itemDiscount;
  });
}
```

#### Bulk Discount:
```javascript
if (offer.offer_type === 'bulk_discount') {
  const minQty = config.min_quantity || 2;
  const percentage = config.percentage || 0;
  
  applicableItems.forEach(ci => {
    if (ci.quantity >= minQty) {
      const itemTotal = parseFloat(ci.item.price) * ci.quantity;
      const itemDiscount = itemTotal * (percentage / 100);
      discountAmount += itemDiscount;
    }
  });
}
```

#### Bundle Discount:
```javascript
if (offer.offer_type === 'bundle') {
  const allItemsInCart = offer.item_ids.every(itemId =>
    cartItems.some(ci => ci.item.id === itemId)
  );
  
  if (allItemsInCart) {
    applicableItems.forEach(ci => {
      const itemTotal = parseFloat(ci.item.price) * ci.quantity;
      const itemDiscount = itemTotal * (percentage / 100);
      discountAmount += itemDiscount;
    });
  }
}
```

### 2. Offer Application Logic

#### Check Applicable Offers:
```javascript
const checkApplicableOffers = async (items, userId) => {
  const itemIds = items.map(ci => ci.item.id);
  
  // Get all active special offers
  const { data: allOffers } = await supabase
    .from('special_offers')
    .select('*')
    .eq('is_active', true);

  // Filter offers that apply to cart items
  const now = new Date();
  const applicableOffers = allOffers.filter(offer => {
    const notExpired = !offer.ends_at || new Date(offer.ends_at) > now;
    const hasMatchingItems = offer.item_ids && 
                           itemIds.some(itemId => offer.item_ids.includes(itemId));
    
    return notExpired && hasMatchingItems;
  });

  setAppliedOffers(applicableOffers);
};
```

#### Price Source Restrictions:
```javascript
// Only apply discounts to 'original' price_source (not negotiated/agent rates)
const applicableItems = cartItems.filter(ci => 
  offer.item_ids && 
  offer.item_ids.includes(ci.item.id) &&
  (!ci.price_source || ci.price_source === 'original')
);
```

## Mobile App Implementation

### 1. Cart Icon Component

#### Real-time Cart Count:
```javascript
export default function CartIcon() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();
    
    // Subscribe to cart changes
    const channel = supabase
      .channel('cart_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items'
      }, () => {
        loadCartCount();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const loadCartCount = async () => {
    const user = await UserEntity.me();
    const { data } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('buyer_id', user.id);

    const total = data.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(total);
  };
}
```

### 2. Cart Page Features

#### Reservation Timer:
```javascript
const getTimeRemainingForItem = (reservedUntil) => {
  const now = new Date();
  const expiry = new Date(reservedUntil);
  const diff = expiry - now;
  
  if (diff <= 0) {
    return { expired: true, minutes: 0, seconds: 0 };
  }
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return { expired: false, minutes, seconds };
};

// UI Component
{timeRemaining && !timeRemaining.expired && (
  <div className="flex items-center gap-2 text-sm">
    <Clock className="w-4 h-4 text-amber-400" />
    <span className={`font-medium ${timeRemaining.minutes < 2 ? 'text-red-400' : 'text-amber-400'}`}>
      Reserved for {timeRemaining.minutes}m {timeRemaining.seconds}s
    </span>
  </div>
)}
```

#### Pricing Calculation:
```javascript
const calculatePricing = () => {
  let subtotal = 0;
  let discountAmount = 0;
  const discountedItems = new Set();
  const appliedOffersList = [];

  // Calculate subtotal using effective price
  cartItems.forEach(ci => {
    const effectivePrice = ci.negotiated_price ? 
                          parseFloat(ci.negotiated_price) : 
                          parseFloat(ci.item.price);
    subtotal += effectivePrice * ci.quantity;
  });

  // Apply special offers
  appliedOffers.forEach(offer => {
    // Apply discount logic based on offer type
    // ... (BOGO, percentage, bulk, bundle logic)
  });

  return {
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    total: (subtotal - discountAmount).toFixed(2),
    discountedItems,
    appliedOffersList
  };
};
```

### 3. Real-time Updates

#### Expiration Checking:
```javascript
useEffect(() => {
  // Set up periodic expiration check
  const interval = setInterval(() => {
    checkExpiredReservations();
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
}, []);

const checkExpiredReservations = () => {
  const now = new Date();
  const expiredItems = cartItems.filter(ci => {
    if (!ci.reserved_until) return false;
    return new Date(ci.reserved_until) < now;
  });

  if (expiredItems.length > 0) {
    loadCart(); // Reload to remove expired items
  }
};
```

#### Real-time Item Updates:
```javascript
const setupRealtimeSubscription = (userId) => {
  const subscription = supabase
    .channel('cart-items-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'items',
      filter: `id=in.(${cartItems.map(ci => ci.item.id).join(',')})`
    }, (payload) => {
      loadCart(); // Reload to check availability
    })
    .subscribe();

  return subscription;
};
```

## Mobile-Specific Considerations

### 1. Performance Optimizations
- **Debounced Updates**: Prevent excessive API calls
- **Efficient Queries**: Use specific field selection
- **Caching**: Store cart state locally
- **Background Sync**: Handle offline scenarios

### 2. UX Enhancements
- **Smooth Animations**: Button state transitions
- **Loading States**: Spinner indicators
- **Error Handling**: Graceful failure recovery
- **Offline Support**: Queue operations when offline

### 3. Security
- **Reservation Validation**: Server-side availability checks
- **Price Verification**: Validate negotiated prices
- **User Authentication**: Secure cart operations
- **Rate Limiting**: Prevent abuse

## Configuration

### Environment Variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Cart Settings:
```javascript
const RESERVATION_DURATION_MINUTES = 10;
const EXPIRATION_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_CART_ITEMS = 50;
```

### Recommendation Settings:
```javascript
const RECOMMENDATION_LIMITS = {
  similar: 6,
  trending: 8,
  history: 4,
  price: 6,
  seller: 4,
  sold: 6
};
```

This system provides a complete, intelligent cart and upsell experience that can be seamlessly integrated into a mobile app environment, with real-time updates, smart recommendations, and comprehensive offer management.
