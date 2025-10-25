# Store (Storefront) Page Configuration for Mobile App

This document provides comprehensive information about the "Store" (Storefront) page functionality, including all features, Stripe integration, item reservation system, purchase flow, and mobile-specific optimizations for the storefront system.

## Overview

The Store (Storefront) page is a premium shopping experience that displays exclusive products integrated with Stripe for direct purchase. Unlike the regular marketplace which supports various payment methods and negotiation, the Store focuses on instant purchases with Stripe-integrated items, featuring item reservation, countdown timers, and streamlined checkout.

## Core Features

### 1. Storefront Interface

#### Page Layout
```javascript
const storefrontPageLayout = {
  // Header Section
  header: {
    title: "Storefront",
    description: "Exclusive products, ready for purchase",
    icon: "Building"
  },
  
  // Main Content
  content: {
    itemGrid: "Responsive grid of store items",
    emptyState: "Empty store message when no items",
    loadingState: "Skeleton loaders while fetching"
  }
};
```

#### Visual Design
```javascript
const visualDesign = {
  // Color Scheme
  colors: {
    primary: "Pink to Fuchsia gradient",
    accent: "Lime-400 for prices",
    background: "Slate-950",
    text: "White",
    cards: "Slate-700 to Slate-600 gradient with pink borders"
  },
  
  // Card Styling
  cardStyling: {
    border: "2px border with pink-500/30",
    shadow: "2xl shadow with pink-500/20",
    hover: "Scale to 1.02 with enhanced shadow",
    ring: "ring-1 ring-pink-400/20"
  }
};
```

### 2. Store Item Filtering System

#### Item Selection Logic
```javascript
const itemSelectionLogic = {
  // Filtering Criteria
  filteringCriteria: {
    status: "active",
    stripeIntegration: "has stripe_price_id",
    availability: "not reserved by others"
  },
  
  // Load Items
  loadItems: async () => {
    // Fetch all active items
    const allItems = await Item.filter({ status: "active" });
    
    // Filter for Stripe-integrated items only
    const stripeItems = allItems.filter(item => item.stripe_price_id);
    
    return stripeItems;
  }
};
```

#### Difference from Marketplace
```javascript
const storefrontVsMarketplace = {
  // Storefront
  storefront: {
    items: "Only Stripe-integrated items",
    purchase: "Instant buy now with Stripe",
    payment: "Stripe checkout only",
    negotiation: "No negotiation available",
    reservation: "10-minute reservation system",
    experience: "Premium shopping experience"
  },
  
  // Marketplace
  marketplace: {
    items: "All active items",
    purchase: "Cart system with multiple payment methods",
    payment: "Stripe, bank transfer, crypto",
    negotiation: "AI agent negotiation available",
    reservation: "30-minute cart reservation",
    experience: "Standard marketplace with filters"
  }
};
```

### 3. Item Reservation System

#### Reservation Configuration
```javascript
const reservationConfiguration = {
  // Reservation Settings
  reservationSettings: {
    duration: "10 minutes for buy now",
    cartDuration: "30 minutes for cart items",
    autoRelease: "Automatic release on expiration",
    userLimit: "One reservation per user per item"
  },
  
  // Reservation States
  reservationStates: {
    available: "Item available for purchase",
    reservedByOther: "Reserved by another user",
    reservedBySelf: "Reserved by current user",
    expired: "Reservation expired"
  }
};
```

#### Reservation Logic
```javascript
const reservationLogic = {
  // Check Reservation
  checkReservation: async (itemId) => {
    const reservation = await getItemReservation(itemId);
    
    return {
      is_reserved: reservation.is_reserved,
      reserved_by_current_user: reservation.reserved_by_current_user,
      reserved_until: reservation.reserved_until,
      time_remaining: calculateTimeRemaining(reservation.reserved_until)
    };
  },
  
  // Reserve Item
  reserveItem: async (itemId, reservationType, durationMinutes) => {
    try {
      const reserved = await reserveItem(itemId, reservationType, durationMinutes);
      
      if (reserved) {
        return {
          success: true,
          expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000)
        };
      }
      
      return { success: false, reason: 'Already reserved by another user' };
    } catch (error) {
      console.error('Reservation error:', error);
      return { success: false, reason: error.message };
    }
  },
  
  // Auto-Release on Expiration
  handleExpiration: (reservationTimeRemaining, setIsReserved, setIsReservedByCurrentUser) => {
    const timer = setInterval(() => {
      setReservationTimeRemaining(prev => {
        if (prev <= 1000) {
          setIsReserved(false);
          setIsReservedByCurrentUser(false);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }
};
```

### 4. Store Item Card Component

#### Card Structure
```javascript
const storeItemCardStructure = {
  // Card Layout
  cardLayout: {
    imageSection: "Aspect-square image with hover scale",
    contentSection: "Title, description, price, action button",
    reservationBadges: "Status badges for reservations"
  },
  
  // Card Content
  cardContent: {
    image: "Primary image with fallback",
    title: "Item title (line-clamp-2)",
    description: "Item description (line-clamp-3)",
    price: "Formatted price in lime-400",
    button: "Buy Now button or Reserved status"
  }
};
```

#### Card States
```javascript
const cardStates = {
  // Available State
  available: {
    button: "Buy Now button enabled",
    badge: "No badge",
    hover: "Scale and shadow effects",
    interaction: "Full interactivity"
  },
  
  // Reserved by Other
  reservedByOther: {
    button: "Disabled with Reserved text",
    badge: "Orange badge with Lock icon",
    hover: "No scale effect",
    interaction: "Limited interactivity"
  },
  
  // Reserved by Self
  reservedBySelf: {
    button: "Buy Now with countdown timer",
    badge: "Blue badge with Clock icon",
    hover: "Scale and shadow effects",
    interaction: "Full interactivity"
  },
  
  // Processing
  processing: {
    button: "Disabled with spinner",
    badge: "No change",
    hover: "No effects",
    interaction: "Disabled"
  }
};
```

### 5. Purchase Flow

#### Buy Now Process
```javascript
const buyNowProcess = {
  // Step 1: Validation
  validation: {
    checkReservation: "Ensure item not reserved by others",
    checkAvailability: "Verify item still available",
    checkUserAuth: "Confirm user is authenticated"
  },
  
  // Step 2: Reservation
  reservation: {
    reserveItem: "Reserve item for 10 minutes",
    updateState: "Update local reservation state",
    startTimer: "Begin countdown timer",
    showToast: "Notify user of reservation"
  },
  
  // Step 3: Stripe Checkout
  stripeCheckout: {
    createSession: "Create Stripe checkout session",
    redirectToStripe: "Redirect to Stripe hosted checkout",
    handleCallback: "Process return from Stripe",
    updateOrder: "Update order status"
  },
  
  // Step 4: Completion
  completion: {
    releaseReservation: "Release reservation on completion",
    updateInventory: "Update item availability",
    sendConfirmation: "Send email confirmation",
    redirectToSuccess: "Show success page"
  }
};
```

#### Error Handling
```javascript
const errorHandling = {
  // Reservation Errors
  reservationErrors: {
    alreadyReserved: {
      message: "This item is currently reserved by another user. Please try again later.",
      action: "Show toast notification",
      fallback: "Return to storefront"
    },
    
    reservationFailed: {
      message: "Failed to reserve item for purchase",
      action: "Show error toast",
      fallback: "Allow retry"
    }
  },
  
  // Stripe Errors
  stripeErrors: {
    sessionCreationFailed: {
      message: "Error: Could not initiate purchase.",
      action: "Show alert dialog",
      fallback: "Reset button state"
    },
    
    checkoutCancelled: {
      message: "Checkout was cancelled",
      action: "Release reservation",
      fallback: "Return to storefront"
    }
  },
  
  // Network Errors
  networkErrors: {
    connectionLost: {
      message: "Network connection lost",
      action: "Show error message",
      fallback: "Allow retry"
    }
  }
};
```

### 6. Countdown Timer System

#### Timer Implementation
```javascript
const timerImplementation = {
  // Timer State
  timerState: {
    reservationTimeRemaining: "milliseconds remaining",
    isExpired: "boolean expiration status",
    timerInterval: "interval reference"
  },
  
  // Timer Logic
  timerLogic: {
    startTimer: (expirationTime) => {
      const now = new Date();
      const timeRemaining = Math.max(0, expirationTime - now);
      setReservationTimeRemaining(timeRemaining);
      
      // Start countdown
      const timer = setInterval(() => {
        setReservationTimeRemaining(prev => {
          if (prev <= 1000) {
            // Timer expired
            handleExpiration();
            clearInterval(timer);
            return null;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return timer;
    },
    
    formatTime: (milliseconds) => {
      const minutes = Math.ceil(milliseconds / 60000);
      return `${minutes}m`;
    },
    
    stopTimer: (timerInterval) => {
      clearInterval(timerInterval);
    }
  }
};
```

#### Timer Display
```javascript
const timerDisplay = {
  // Display Format
  displayFormat: {
    minutes: "Show minutes remaining (e.g., '7m')",
    seconds: "Optional seconds display for final minute",
    badge: "Display in badge for reserved items",
    button: "Display in button text for user's reservations"
  },
  
  // Visual Feedback
  visualFeedback: {
    lowTime: "Change color when < 2 minutes remaining",
    expired: "Remove badge and enable for others",
    updating: "Smooth transitions between states"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const storefrontPageState = {
  // Data State
  dataState: {
    items: "array of store items",
    loading: "boolean loading state",
    isRedirecting: "string (item ID being processed)"
  },
  
  // UI State
  uiState: {
    selectedItem: "currently selected item",
    showModal: "modal visibility",
    error: "error message"
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Load Items
  loadItems: async () => {
    setLoading(true);
    try {
      const allItems = await Item.filter({ status: "active" });
      const stripeItems = allItems.filter(item => item.stripe_price_id);
      setItems(stripeItems);
    } catch (error) {
      console.error("Failed to load items:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },
  
  // Handle Purchase
  handlePurchase: async (priceId) => {
    setIsRedirecting(priceId);
    try {
      const { data } = await createStripeCheckoutSession({ price_id: priceId });
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      setIsRedirecting(null);
      alert("Error: Could not initiate purchase.");
    }
  }
};
```

### 2. Item Card Implementation

#### Card Component
```javascript
const itemCardComponent = {
  // Card Structure
  cardStructure: {
    imageContainer: "Aspect-square with hover effects",
    contentContainer: "Title, description, price",
    actionContainer: "Buy button or reserved status",
    badgeContainer: "Reservation status badges"
  },
  
  // Card Features
  cardFeatures: {
    imageGallery: "Primary image with fallback",
    reservationBadges: "Status indicators",
    countdownTimer: "Time remaining display",
    buyButton: "Purchase action button"
  }
};
```

#### Card Interactions
```javascript
const cardInteractions = {
  // Touch Interactions
  touchInteractions: {
    tap: "Navigate to item detail or purchase",
    longPress: "Show item quick actions",
    swipe: "No swipe actions on store cards"
  },
  
  // Button Interactions
  buttonInteractions: {
    buyNow: "Reserve and redirect to Stripe",
    disabled: "Show reservation status",
    loading: "Show spinner during processing"
  }
};
```

### 3. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    cardTap: "Touch-friendly card interactions",
    buttonTap: "Large, accessible buy buttons",
    gestureSupport: "Native gesture support"
  },
  
  // Performance
  performance: {
    imageOptimization: "Optimize images for mobile",
    lazyLoading: "Load images on demand",
    caching: "Cache store data locally",
    prefetching: "Prefetch Stripe session data"
  },
  
  // Mobile Features
  mobileFeatures: {
    pushNotifications: "Notify when reservation expires",
    backgroundRefresh: "Refresh store data in background",
    deeplinking: "Handle Stripe return URLs",
    nativeCheckout: "Use Stripe native SDK"
  }
};
```

#### Mobile UI/UX
```javascript
const mobileUIUX = {
  // Responsive Design
  responsiveDesign: {
    gridLayout: "1 column on small, 2 on medium, 3 on large",
    cardSize: "Optimized for mobile screens",
    touchTargets: "Minimum 44x44 touch targets",
    readableText: "Readable text sizes"
  },
  
  // Navigation
  navigation: {
    backButton: "Native back button support",
    stripeReturn: "Handle Stripe checkout return",
    deeplinks: "Support deep linking to items"
  }
};
```

### 4. Stripe Integration

#### Stripe Setup
```javascript
const stripeSetup = {
  // Environment Configuration
  environmentConfiguration: {
    testMode: {
      publishableKey: "pk_test_...",
      secretKey: "sk_test_...",
      webhookSecret: "whsec_..."
    },
    productionMode: {
      publishableKey: "pk_live_...",
      secretKey: "sk_live_...",
      webhookSecret: "whsec_..."
    }
  },
  
  // Item Integration
  itemIntegration: {
    stripeProductId: "product_id from Stripe",
    stripePriceId: "price_id from Stripe",
    webhookEvents: ["checkout.session.completed", "payment_intent.succeeded"]
  }
};
```

#### Checkout Session Creation
```javascript
const checkoutSessionCreation = {
  // Create Session
  createSession: async (priceId) => {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/store`
      })
    });
    
    const data = await response.json();
    return data;
  },
  
  // Handle Redirect
  handleRedirect: (checkoutUrl) => {
    window.location.href = checkoutUrl;
  }
};
```

### 5. Reservation Management

#### Reservation Operations
```javascript
const reservationOperations = {
  // Check Reservation
  checkReservation: async (itemId) => {
    try {
      const reservation = await getItemReservation(itemId);
      return {
        isReserved: reservation.is_reserved,
        reservedByCurrentUser: reservation.reserved_by_current_user,
        reservedUntil: reservation.reserved_until,
        timeRemaining: calculateTimeRemaining(reservation.reserved_until)
      };
    } catch (error) {
      console.error('Error checking reservation:', error);
      return { isReserved: false };
    }
  },
  
  // Reserve Item
  reserveItem: async (itemId, durationMinutes) => {
    try {
      const reserved = await reserveItem(itemId, 'buy_now', durationMinutes);
      
      if (reserved) {
        return {
          success: true,
          expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000)
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error reserving item:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Release Reservation
  releaseReservation: async (itemId) => {
    try {
      await releaseItemReservation(itemId);
      return { success: true };
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return { success: false, error: error.message };
    }
  }
};
```

#### Reservation State Management
```javascript
const reservationStateManagement = {
  // State Updates
  stateUpdates: {
    onReserve: (itemId, expiresAt) => {
      setIsReserved(true);
      setIsReservedByCurrentUser(true);
      setReservationTimeRemaining(calculateTimeRemaining(expiresAt));
      startCountdownTimer(expiresAt);
    },
    
    onExpire: () => {
      setIsReserved(false);
      setIsReservedByCurrentUser(false);
      setReservationTimeRemaining(null);
      stopCountdownTimer();
    },
    
    onRelease: () => {
      setIsReserved(false);
      setIsReservedByCurrentUser(false);
      setReservationTimeRemaining(null);
      stopCountdownTimer();
    }
  }
};
```

## Configuration Options

### 1. Storefront Configuration

#### Display Settings
```javascript
const displaySettings = {
  // Grid Configuration
  gridConfiguration: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      largeDesktop: 4
    },
    gap: 24,
    padding: { horizontal: 24, vertical: 32 }
  },
  
  // Item Card Settings
  itemCardSettings: {
    imageAspectRatio: "1:1",
    titleMaxLines: 2,
    descriptionMaxLines: 3,
    showDescription: true,
    showReservationStatus: true
  }
};
```

#### Filtering Options
```javascript
const filteringOptions = {
  // Item Filters
  itemFilters: {
    status: "active",
    stripeIntegrated: true,
    minPrice: 0,
    maxPrice: null,
    categories: "all"
  },
  
  // Display Filters
  displayFilters: {
    showReservedItems: true,
    showOutOfStock: false,
    sortBy: "newest"
  }
};
```

### 2. Reservation Configuration

#### Reservation Settings
```javascript
const reservationSettings = {
  // Duration Settings
  durationSettings: {
    buyNow: 10, // minutes
    addToCart: 30, // minutes
    autoRelease: true
  },
  
  // User Limits
  userLimits: {
    maxSimultaneousReservations: 3,
    cooldownPeriod: 60, // seconds after expiration
    allowMultipleSameItem: false
  }
};
```

#### Timer Configuration
```javascript
const timerConfiguration = {
  // Display Settings
  displaySettings: {
    showMinutes: true,
    showSeconds: false,
    showBadge: true,
    showInButton: true
  },
  
  // Warning Settings
  warningSettings: {
    lowTimeThreshold: 120, // seconds
    showWarningColor: true,
    warningColor: "orange-500"
  }
};
```

### 3. Mobile Configuration

#### Mobile Settings
```javascript
const mobileSettings = {
  // Touch Settings
  touchSettings: {
    touchFriendly: true,
    gestureSupport: true,
    hapticFeedback: true,
    longPressDelay: 500 // milliseconds
  },
  
  // Performance Settings
  performanceSettings: {
    imageOptimization: true,
    lazyLoading: true,
    caching: true,
    prefetching: true
  }
};
```

#### Mobile Features
```javascript
const mobileFeatures = {
  // Native Features
  nativeFeatures: {
    stripeNativeSDK: true,
    pushNotifications: true,
    biometricAuth: true,
    nativeSharing: true
  },
  
  // Mobile UI
  mobileUI: {
    responsiveGrid: true,
    touchOptimized: true,
    gestureNavigation: true,
    accessibility: true
  }
};
```

### 4. Stripe Configuration

#### Stripe Settings
```javascript
const stripeSettings = {
  // API Configuration
  apiConfiguration: {
    testMode: true,
    publishableKey: "pk_test_...",
    secretKey: "sk_test_...",
    webhookSecret: "whsec_..."
  },
  
  // Checkout Configuration
  checkoutConfiguration: {
    paymentMethods: ["card"],
    mode: "payment",
    allowPromotion: false,
    successUrl: "/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "/store"
  }
};
```

#### Webhook Configuration
```javascript
const webhookConfiguration = {
  // Webhook Events
  webhookEvents: [
    "checkout.session.completed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed"
  ],
  
  // Event Handlers
  eventHandlers: {
    onCheckoutCompleted: "Release reservation, update inventory",
    onPaymentSucceeded: "Send confirmation email, create order",
    onPaymentFailed: "Release reservation, notify user"
  }
};
```

## Database Schema

### Store Items Table
```sql
-- Items table with Stripe integration
CREATE TABLE items (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_urls TEXT[],
  status TEXT DEFAULT 'active',
  stripe_product_id TEXT, -- Stripe product ID
  stripe_price_id TEXT, -- Stripe price ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for Stripe-integrated items
CREATE INDEX idx_items_stripe_price_id ON items(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
```

### Reservations Table
```sql
-- Item reservations table
CREATE TABLE item_reservations (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reservation_type TEXT NOT NULL, -- 'buy_now' or 'cart'
  reserved_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(item_id, user_id)
);

-- Index for active reservations
CREATE INDEX idx_active_reservations ON item_reservations(item_id, is_active, expires_at);
```

## Unique Storefront Features

### 1. Premium Shopping Experience
- ✅ Curated selection of Stripe-integrated items
- ✅ Streamlined instant purchase flow
- ✅ No negotiation or cart complexity
- ✅ Premium visual design with gradients and effects

### 2. Reservation System
- ✅ 10-minute item reservation on buy now
- ✅ Real-time countdown timers
- ✅ Visual reservation status badges
- ✅ Automatic release on expiration

### 3. Stripe Integration
- ✅ Direct Stripe checkout integration
- ✅ Hosted checkout page
- ✅ Secure payment processing
- ✅ Webhook-driven order updates

### 4. Mobile Optimizations
- ✅ Touch-friendly card interactions
- ✅ Native Stripe SDK integration
- ✅ Deep linking support
- ✅ Push notifications for reservations

This comprehensive Store (Storefront) page configuration provides everything needed for a complete mobile app implementation, including item filtering, reservation system, Stripe integration, countdown timers, mobile optimizations, and all the technical details required for the mobile app builder! 🚀
