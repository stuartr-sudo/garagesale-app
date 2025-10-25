# Marketplace Page Configuration for Mobile App

This document provides comprehensive information about the Marketplace page functionality, including all unique features like promoted cards, advertisement cards, bundles, recently sold items, trending items, and special offers.

## Overview

The Marketplace page is the central discovery hub where users browse items, view advertisements, discover bundles, and see social proof through recently sold items and trending content. It features advanced filtering, smart recommendations, and integrated advertising.

## Core Features

### 1. Page Structure & Layout

#### Main Layout Components
```javascript
const marketplaceLayout = {
  // Header Section
  header: {
    title: "Local Marketplace",
    subtitle: "Discover unique items from your community",
    theme: "dark gradient background"
  },
  
  // Top Banner Advertisement
  topBanner: {
    component: "AdBanner",
    placement: "top_banner",
    position: "below header",
    size: "full width"
  },
  
  // Trending Items Section
  trending: {
    component: "SmartRecommendations",
    algorithm: "trending",
    title: "🔥 Trending Now",
    limit: 6,
    showViewAll: false
  },
  
  // Search and Filters
  searchFilters: {
    component: "SearchFilters",
    features: ["search", "category", "condition", "price", "location", "sort"]
  },
  
  // Main Items Grid
  itemsGrid: {
    layout: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    spacing: "gap-6",
    features: ["item cards", "advertisements", "bundle cards"]
  },
  
  // Bundle Deals Section
  bundles: {
    component: "BundleCard",
    title: "Bundle Deals",
    layout: "horizontal scroll or grid"
  },
  
  // Recently Sold Section
  recentlySold: {
    component: "RecentlySold",
    title: "Recently Sold",
    limit: 10,
    showLocation: true
  }
};
```

### 2. Advertisement System

#### Advertisement Placements
```javascript
const advertisementPlacements = {
  // Top Banner Ad
  topBanner: {
    position: "below header",
    size: "full width",
    style: "banner with image and text",
    features: ["click tracking", "impression tracking", "theme integration"]
  },
  
  // Local Deals Ad (Position 3)
  localDeals: {
    position: "item position 3",
    size: "regular item card",
    style: "item card with sponsored badge",
    features: ["orange theme", "local focus", "community emphasis"]
  },
  
  // Between Items Ad (Every 6 items)
  betweenItems: {
    position: "after every 6 items",
    size: "spans 2-4 columns",
    style: "wide banner",
    features: ["full width", "prominent placement", "service focus"]
  },
  
  // Featured Ad (Position 8)
  bottomBanner: {
    position: "item position 8",
    size: "regular item card",
    style: "item card with sponsored badge",
    features: ["cyan theme", "premium placement", "featured content"]
  }
};
```

#### Advertisement Configuration
```javascript
const advertisementConfig = {
  // Demo Advertisements
  demoAds: {
    topBanner: {
      title: "🎉 Welcome to Our Marketplace!",
      description: "Discover amazing local deals and connect with sellers in your community.",
      image: "marketplace welcome image",
      placement: "top_banner",
      priority: 1,
      impression_count: 1250,
      click_count: 87
    },
    localDeals: {
      title: "Local Artisan Market",
      description: "Handcrafted goods from local makers. Support your community!",
      image: "artisan market image",
      placement: "local_deals",
      priority: 2,
      impression_count: 890,
      click_count: 65
    },
    bottomBanner: {
      title: "Premium Featured Listing",
      description: "Get your items seen by more buyers with featured placement",
      image: "featured listing image",
      placement: "bottom_banner",
      priority: 3,
      impression_count: 567,
      click_count: 43
    },
    betweenItems: {
      title: "📦 Safe Shipping Available",
      description: "Shop with confidence - secure shipping on all items",
      image: "shipping image",
      placement: "between_items",
      priority: 4,
      impression_count: 1456,
      click_count: 92
    }
  },
  
  // Advertisement Features
  features: {
    clickTracking: "increment click_count on click",
    impressionTracking: "increment impression_count on view",
    themeIntegration: "dynamic colors based on placement",
    fallbackAds: "demo ads when no real ads available",
    dateValidation: "check start_date and end_date",
    prioritySorting: "sort by priority field"
  }
};
```

### 3. Trending Items System

#### Trending Algorithm
```javascript
const trendingAlgorithm = {
  // Trending Criteria
  criteria: {
    timeWindow: "last 7 days",
    viewCount: "items with highest views_count",
    recency: "recently created items",
    status: "active items only"
  },
  
  // Trending Query
  query: {
    table: "items",
    filters: {
      status: "active",
      created_at: ">= 7 days ago",
      views_count: "> 0"
    },
    sorting: "views_count DESC, created_at DESC",
    limit: 6
  },
  
  // Trending Display
  display: {
    title: "🔥 Trending Now",
    layout: "horizontal scroll or grid",
    features: ["trending badge", "view count", "recent indicator"],
    showViewAll: false
  }
};
```

#### Trending Item Card
```javascript
const trendingItemCard = {
  // Visual Elements
  trendingBadge: {
    icon: "TrendingUp",
    text: "Trending",
    color: "bg-pink-500/90 text-white",
    position: "top-left"
  },
  
  viewCount: {
    icon: "TrendingUp",
    text: "{views_count}",
    color: "bg-pink-500/90 text-white",
    position: "top-left"
  },
  
  // Content
  title: "item title",
  description: "item description",
  price: "formatted price",
  image: "primary image with fallback",
  tags: "item tags",
  condition: "condition badge"
};
```

### 4. Recently Sold System

#### Recently Sold Configuration
```javascript
const recentlySoldConfig = {
  // Data Source
  dataSource: {
    table: "orders",
    status: ["completed", "payment_confirmed", "shipped", "collection_arranged"],
    sorting: "created_at DESC",
    limit: 10
  },
  
  // Privacy Features
  privacy: {
    sellerNames: "hidden for privacy",
    sellerLocation: "anonymized (city, postcode)",
    sellerLabel: "A Seller from [Location]",
    itemDetails: "title, image, price only"
  },
  
  // Display Features
  display: {
    title: "Recently Sold",
    subtitle: "Real purchases from our community in the last 24 hours",
    icon: "CheckCircle2",
    color: "green theme",
    badge: "count of recent sales",
    animation: "pulsing trending icon"
  },
  
  // Auto-refresh
  refresh: {
    interval: "30 seconds",
    purpose: "show new sales in real-time",
    maxHeight: "max-h-96 with scroll"
  }
};
```

#### Recently Sold Item Display
```javascript
const recentlySoldItem = {
  // Item Information
  item: {
    title: "item title",
    image: "primary image",
    price: "sale price",
    category: "item category"
  },
  
  // Sale Information
  sale: {
    timeAgo: "formatDistanceToNow(created_at)",
    totalAmount: "order total",
    status: "completed/payment_confirmed"
  },
  
  // Seller Information (Anonymized)
  seller: {
    location: "city, country",
    label: "A Seller from [Location]",
    privacy: "no personal information"
  },
  
  // Visual Elements
  visual: {
    checkIcon: "CheckCircle2",
    timeIcon: "Clock",
    locationIcon: "MapPin",
    trendingIcon: "TrendingUp"
  }
};
```

### 5. Bundle System

#### Bundle Display Configuration
```javascript
const bundleConfig = {
  // Bundle Card Features
  bundleCard: {
    // Visual Design
    theme: "green gradient theme",
    border: "border-green-500/30",
    shadow: "shadow-green-500/20",
    hover: "hover:scale-[1.02]",
    
    // Badges
    bundleBadge: {
      icon: "ShoppingBag",
      text: "Bundle",
      color: "bg-green-500 text-white",
      position: "top-left"
    },
    
    savingsBadge: {
      icon: "Percent",
      text: "{savingsPercentage}% OFF",
      color: "bg-emerald-500 text-white",
      position: "top-right"
    },
    
    // Content
    title: "bundle title",
    description: "bundle description",
    price: "bundle price",
    savings: "individual total - bundle price",
    itemCount: "number of items in bundle",
    collectionDate: "formatted collection date"
  },
  
  // Bundle Image Collage
  imageCollage: {
    component: "BundleImageCollage",
    maxImages: 4,
    layout: "2x2 grid or overlapping",
    fallback: "default image if no items"
  },
  
  // Bundle Actions
  actions: {
    viewDetails: "open bundle details modal",
    buyNow: "open purchase modal",
    addToCart: "add bundle to cart"
  }
};
```

#### Bundle Purchase Modal
```javascript
const bundlePurchaseModal = {
  // Modal Content
  content: {
    bundleTitle: "bundle title",
    bundleDescription: "bundle description",
    bundlePrice: "formatted bundle price",
    savings: "savings amount and percentage",
    collectionInfo: "date and address"
  },
  
  // Items in Bundle
  itemsList: {
    title: "Items in this Bundle ({count})",
    layout: "scrollable list",
    itemDisplay: {
      image: "item image",
      title: "item title",
      description: "item description",
      condition: "condition badge",
      quantity: "quantity badge if > 1"
    }
  },
  
  // Purchase Actions
  actions: {
    buyNow: "open payment wizard",
    close: "close modal",
    paymentWizard: "integrated payment flow"
  }
};
```

### 6. Search and Filter System

#### Search Filters Configuration
```javascript
const searchFiltersConfig = {
  // Filter Options
  filters: {
    searchTerm: {
      type: "text input",
      placeholder: "Search items...",
      icon: "Search",
      searchFields: ["title", "description", "tags"]
    },
    
    category: {
      type: "select dropdown",
      options: ["all", "electronics", "furniture", "clothing", "books", "toys", "sports", "other"],
      default: "all"
    },
    
    condition: {
      type: "select dropdown",
      options: ["all", "new", "like_new", "good", "fair", "poor"],
      default: "all"
    },
    
    priceRange: {
      type: "range slider",
      min: 0,
      max: 10000,
      step: 10,
      default: [0, 10000]
    },
    
    location: {
      type: "text input",
      placeholder: "Enter location...",
      icon: "MapPin",
      radius: "25 miles default"
    },
    
    sortBy: {
      type: "select dropdown",
      options: [
        { value: "date_desc", label: "Newest First" },
        { value: "date_asc", label: "Oldest First" },
        { value: "price_asc", label: "Price: Low to High" },
        { value: "price_desc", label: "Price: High to Low" },
        { value: "views_desc", label: "Most Popular" }
      ],
      default: "date_desc"
    }
  },
  
  // Filter Logic
  filterLogic: {
    searchTerm: "includes in title, description, or tags",
    category: "exact match",
    condition: "exact match",
    priceRange: "between min and max",
    location: "within radius of location",
    sortBy: "order by specified field"
  }
};
```

### 7. Special Offers Integration

#### Special Offers Display
```javascript
const specialOffersConfig = {
  // Offer Types
  offerTypes: {
    bogo: {
      icon: "Gift",
      color: "green theme",
      description: "Buy One Get One Free"
    },
    bulkDiscount: {
      icon: "Package",
      color: "blue theme",
      description: "Bulk quantity discounts"
    },
    percentageOff: {
      icon: "TrendingDown",
      color: "red theme",
      description: "Percentage off items"
    },
    bundle: {
      icon: "Sparkles",
      color: "purple theme",
      description: "Bundle deal discounts"
    }
  },
  
  // Offer Display
  display: {
    badge: "offer type badge",
    description: "formatted offer text",
    items: "related items in offer",
    expiration: "offer end date if applicable"
  },
  
  // Offer Integration
  integration: {
    itemCards: "show offers on item cards",
    cart: "apply offers in cart",
    checkout: "calculate discounts at checkout"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const marketplaceState = {
  // Data State
  items: "array of marketplace items",
  bundles: "array of available bundles",
  recentlySoldItems: "array of recently sold items",
  advertisements: "array of active advertisements",
  
  // Filter State
  filters: {
    searchTerm: "string",
    category: "string or null",
    condition: "string or null",
    minPrice: "number",
    maxPrice: "number",
    sortBy: "string",
    location: "string or null"
  },
  
  // UI State
  loading: "boolean",
  selectedItem: "selected item for modal",
  selectedBundle: "selected bundle for modal",
  selectedAd: "selected advertisement for modal",
  showOnboarding: "boolean for tour"
};
```

### 2. Data Loading

#### API Endpoints
```javascript
const dataLoading = {
  // Load Items
  loadItems: async () => {
    const items = await Item.filter({ status: "active" }, "-created_at");
    return items;
  },
  
  // Load Bundles
  loadBundles: async () => {
    const response = await fetch('/api/bundles?status=active&limit=20');
    return response.json();
  },
  
  // Load Recently Sold
  loadRecentlySold: async () => {
    const response = await fetch('/api/recently-sold?limit=10');
    return response.json();
  },
  
  // Load Advertisements
  loadAdvertisements: async (placement) => {
    const ads = await Advertisement.filter({ 
      placement, 
      status: "active" 
    }, "-priority");
    return ads;
  }
};
```

### 3. Filter System

#### Filter Application
```javascript
const applyFilters = (items, filters) => {
  let filtered = [...items];
  
  // Search term filter
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(item => item.category === filters.category);
  }
  
  // Condition filter
  if (filters.condition && filters.condition !== 'all') {
    filtered = filtered.filter(item => item.condition === filters.condition);
  }
  
  // Price range filter
  filtered = filtered.filter(item => 
    item.price >= filters.minPrice && item.price <= filters.maxPrice
  );
  
  // Location filter (if implemented)
  if (filters.location) {
    // Apply location-based filtering
    filtered = filtered.filter(item => 
      isWithinRadius(item.location, filters.location, 25) // 25 miles
    );
  }
  
  // Sort items
  switch (filters.sortBy) {
    case 'date_desc':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'date_asc':
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'price_asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'views_desc':
      filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      break;
  }
  
  return filtered;
};
```

### 4. Advertisement Integration

#### Advertisement Placement Logic
```javascript
const advertisementPlacement = {
  // Insert advertisements in item grid
  insertAdvertisements: (items) => {
    const itemsWithAds = [];
    
    items.forEach((item, index) => {
      itemsWithAds.push(item);
      
      // Insert local deals ad at position 3
      if (index === 2) {
        itemsWithAds.push({
          type: 'advertisement',
          placement: 'local_deals',
          component: 'AdBanner'
        });
      }
      
      // Insert between items ad every 6 items
      if ((index + 1) % 6 === 0) {
        itemsWithAds.push({
          type: 'advertisement',
          placement: 'between_items',
          component: 'AdBanner',
          span: 'md:col-span-2 lg:col-span-3 xl:col-span-4'
        });
      }
      
      // Insert featured ad at position 8
      if (index === 7) {
        itemsWithAds.push({
          type: 'advertisement',
          placement: 'bottom_banner',
          component: 'AdBanner'
        });
      }
    });
    
    return itemsWithAds;
  }
};
```

### 5. Mobile-Specific Features

#### Touch Interactions
```javascript
const touchInteractions = {
  // Item Card Interactions
  itemCard: {
    tap: "open item detail",
    longPress: "quick actions menu",
    swipe: "favorite or share (future)"
  },
  
  // Advertisement Interactions
  advertisement: {
    tap: "open ad modal or external link",
    longPress: "ad details",
    swipe: "dismiss ad"
  },
  
  // Bundle Interactions
  bundle: {
    tap: "open bundle details",
    longPress: "quick add to cart",
    swipe: "favorite bundle"
  }
};
```

#### Performance Optimizations
```javascript
const performanceOptimizations = {
  // Image Lazy Loading
  imageLazyLoading: {
    threshold: 0.1,
    placeholder: "blur placeholder",
    errorFallback: "default image"
  },
  
  // Virtual Scrolling
  virtualScrolling: {
    enabled: "for large item lists",
    itemHeight: 300,
    bufferSize: 10
  },
  
  // Advertisement Loading
  advertisementLoading: {
    lazyLoad: true,
    intersectionObserver: true,
    impressionTracking: "on 50% visibility"
  },
  
  // Data Pagination
  pagination: {
    pageSize: 20,
    loadMore: "infinite scroll",
    caching: "local storage cache"
  }
};
```

### 6. Onboarding Tour

#### Tour Configuration
```javascript
const onboardingTour = {
  // Tour Steps
  steps: [
    {
      target: "filters",
      content: "Use these filters to find exactly what you're looking for",
      placement: "bottom"
    },
    {
      target: "item-card",
      content: "Click on any item to view details and start shopping",
      placement: "right"
    },
    {
      target: "trending",
      content: "Check out what's trending in your community",
      placement: "bottom"
    }
  ],
  
  // Tour Settings
  settings: {
    showOnFirstVisit: true,
    skipOption: true,
    completionStorage: "garagesale-tour-completed",
    delay: 1000 // milliseconds
  }
};
```

## Configuration Options

### 1. Display Settings

#### Grid Configuration
```javascript
const gridConfig = {
  // Responsive Grid
  responsive: {
    mobile: "grid-cols-1",
    tablet: "md:grid-cols-2",
    desktop: "lg:grid-cols-3",
    large: "xl:grid-cols-4"
  },
  
  // Spacing
  spacing: "gap-6",
  
  // Item Card Size
  cardSize: "aspect-square images",
  cardHeight: "flex flex-col h-full"
};
```

#### Advertisement Settings
```javascript
const advertisementSettings = {
  // Advertisement Limits
  limits: {
    maxAdsPerPage: 4,
    minItemsBetweenAds: 2,
    maxAdFrequency: "every 6 items"
  },
  
  // Advertisement Types
  types: {
    topBanner: "full width banner",
    localDeals: "item card size",
    betweenItems: "span multiple columns",
    bottomBanner: "item card size"
  },
  
  // Advertisement Tracking
  tracking: {
    impressions: "intersection observer",
    clicks: "click event tracking",
    conversions: "purchase tracking"
  }
};
```

### 2. Bundle Settings

#### Bundle Display Configuration
```javascript
const bundleDisplaySettings = {
  // Bundle Limits
  limits: {
    maxBundlesPerPage: 10,
    minItemsInBundle: 2,
    maxItemsInBundle: 10
  },
  
  // Bundle Features
  features: {
    imageCollage: true,
    savingsDisplay: true,
    collectionInfo: true,
    quickPurchase: true
  },
  
  // Bundle Sorting
  sorting: {
    default: "created_at DESC",
    options: ["newest", "savings", "price", "items"]
  }
};
```

### 3. Trending Settings

#### Trending Configuration
```javascript
const trendingSettings = {
  // Trending Criteria
  criteria: {
    timeWindow: 7, // days
    minViews: 1,
    maxAge: 30 // days
  },
  
  // Trending Display
  display: {
    limit: 6,
    showViewCount: true,
    showTrendingBadge: true,
    autoRefresh: false
  },
  
  // Trending Algorithm
  algorithm: {
    weightViews: 0.6,
    weightRecency: 0.4,
    boostNewItems: true,
    categoryBoost: false
  }
};
```

This comprehensive Marketplace page configuration provides all the functionality needed for a complete mobile app implementation, including advanced features like advertisements, trending items, bundles, recently sold items, and sophisticated filtering systems! 🚀
