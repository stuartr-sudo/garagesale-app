# My Items Page Configuration for Mobile App

This document provides comprehensive information about the "My Items" page functionality, including all features, configurations, and management capabilities for the mobile app implementation.

## Overview

The My Items page is the central hub for sellers to manage their inventory, track performance, and handle bulk operations. It provides comprehensive item management with advanced features like bulk operations, bundle creation, and analytics.

## Core Features

### 1. Item Management Dashboard

#### Main Navigation Tabs
```javascript
const itemTabs = [
  { value: "all", label: "All Items", count: totalItems },
  { value: "active", label: "Active", count: activeItems },
  { value: "sold", label: "Sold", count: soldItems },
  { value: "inactive", label: "Inactive", count: inactiveItems }
];
```

#### Item Status System
```javascript
const statusConfig = {
  active: { 
    text: "Active", 
    color: "bg-lime-900/50 text-lime-300 border-lime-700",
    description: "Item is live and available for purchase"
  },
  sold: { 
    text: "Sold", 
    color: "bg-blue-900/50 text-blue-300 border-blue-700",
    description: "Item has been sold and is no longer available"
  },
  pending: { 
    text: "Pending", 
    color: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    description: "Item is awaiting approval or processing"
  },
  inactive: { 
    text: "Inactive", 
    color: "bg-gray-700 text-gray-300 border-gray-700",
    description: "Item is hidden from marketplace but not deleted"
  }
};
```

### 2. Item Card Configuration

#### Item Card Display
```javascript
const itemCardFeatures = {
  // Visual Elements
  primaryImage: "First image from image_urls array",
  fallbackImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
  
  // Status Badges
  statusBadge: {
    position: "top-left",
    dynamicColor: true,
    showText: true
  },
  
  // Condition Badge
  conditionBadge: {
    position: "top-left",
    colors: {
      new: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
      like_new: "bg-blue-900/50 text-blue-300 border-blue-700",
      good: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
      fair: "bg-orange-900/50 text-orange-300 border-orange-700",
      poor: "bg-red-900/50 text-red-300 border-red-700"
    }
  },
  
  // Content Display
  title: "Item title with line-clamp-1",
  description: "Item description with line-clamp-2",
  price: "Formatted price display",
  listingDate: "Formatted creation date",
  tags: "Up to 3 tags displayed, with +N more indicator"
};
```

#### Item Actions Menu
```javascript
const itemActions = {
  // Always Available
  editItem: {
    icon: "Edit",
    label: "Edit Item",
    action: "navigate to EditItem/{item.id}",
    available: "always"
  },
  
  // Status-Based Actions
  markInactive: {
    icon: "EyeOff",
    label: "Mark as Inactive",
    action: "change status to inactive",
    available: "when status === 'active'"
  },
  
  markActive: {
    icon: "Eye",
    label: "Mark as Active",
    action: "change status to active",
    available: "when status === 'inactive'"
  },
  
  markSold: {
    icon: "CheckCircle",
    label: "Mark as Sold",
    action: "change status to sold",
    available: "when status !== 'sold'"
  },
  
  // Destructive Action
  deleteItem: {
    icon: "Trash2",
    label: "Delete Item",
    action: "permanently delete item",
    available: "always",
    confirmation: "Are you sure you want to delete this item?",
    style: "text-red-400 hover:bg-gray-700 focus:bg-red-900/50"
  }
};
```

### 3. Statistics Dashboard

#### Stats Cards Configuration
```javascript
const statsCards = [
  {
    title: "Total Items",
    value: "totalItemsCount",
    description: "All items in your inventory",
    icon: "Package",
    bgColor: "bg-gradient-to-br from-blue-600 to-blue-700"
  },
  {
    title: "Active Items",
    value: "activeItemsCount",
    description: "Items currently for sale",
    icon: "Eye",
    bgColor: "bg-gradient-to-br from-green-600 to-green-700"
  },
  {
    title: "Items Sold",
    value: "soldItemsCount",
    description: "Successfully sold items",
    icon: "CheckCircle",
    bgColor: "bg-gradient-to-br from-purple-600 to-purple-700"
  },
  {
    title: "Total Revenue",
    value: "totalRevenue",
    description: "Total earnings from sales",
    icon: "DollarSign",
    bgColor: "bg-gradient-to-br from-yellow-600 to-yellow-700"
  }
];
```

#### Stats Calculation Logic
```javascript
const calculateStats = (items) => {
  const totalItems = items.length;
  const activeItems = items.filter(item => item.status === 'active').length;
  const soldItems = items.filter(item => item.status === 'sold').length;
  const inactiveItems = items.filter(item => item.status === 'inactive').length;
  
  // Calculate total revenue from sold items
  const totalRevenue = items
    .filter(item => item.status === 'sold')
    .reduce((sum, item) => sum + parseFloat(item.price), 0);
  
  return {
    totalItems,
    activeItems,
    soldItems,
    inactiveItems,
    totalRevenue: totalRevenue.toFixed(2)
  };
};
```

### 4. Bulk Operations System

#### Bulk Selection Mode
```javascript
const bulkOperations = {
  // Toggle Bulk Mode
  toggleBulkMode: {
    icon: "CheckSquare",
    label: "Select Items",
    action: "toggle bulk selection mode",
    state: "bulkSelectMode"
  },
  
  // Selection Controls
  selectAll: {
    label: "Select All",
    action: "select all items in current tab",
    available: "when bulkSelectMode === true"
  },
  
  deselectAll: {
    label: "Deselect All",
    action: "clear all selections",
    available: "when bulkSelectMode === true"
  },
  
  // Bulk Actions
  bulkDelete: {
    icon: "Trash2",
    label: "Delete Selected",
    action: "open bulk delete modal",
    available: "when selectedItems.length > 0",
    confirmation: "BulkDeleteModal"
  }
};
```

#### Bulk Delete Modal Configuration
```javascript
const bulkDeleteModal = {
  // Warning System
  warnings: [
    "This action cannot be undone",
    "All selected items will be permanently deleted",
    "Data associated with items will be lost"
  ],
  
  // Item Status Filtering
  canDelete: ["active", "inactive"],
  cannotDelete: ["reserved", "sold"],
  
  // Confirmation Requirements
  confirmationSteps: [
    {
      type: "checkbox",
      label: "I understand the risks",
      required: true
    },
    {
      type: "text_input",
      label: "Type 'DELETE' to confirm",
      placeholder: "Type DELETE here",
      required: true,
      validation: "must equal 'DELETE'"
    }
  ],
  
  // Summary Display
  summary: {
    itemsToDelete: "count of deletable items",
    itemsToSkip: "count of non-deletable items",
    itemList: "scrollable list of selected items"
  }
};
```

### 5. Bundle Management System

#### Bundle Creation
```javascript
const bundleCreation = {
  // Bundle Requirements
  requirements: {
    minItems: 2,
    maxItems: 10,
    allItemsActive: true,
    sameSeller: true
  },
  
  // Bundle Configuration
  bundleData: {
    title: "string (required)",
    description: "string (optional)",
    bundlePrice: "number (required, must be < sum of individual prices)",
    collectionDate: "date (optional)",
    collectionAddress: "string (optional)"
  },
  
  // Price Validation
  priceValidation: {
    bundlePrice: "must be > 0",
    individualTotal: "sum of selected item prices",
    savings: "individualTotal - bundlePrice",
    savingsPercentage: "Math.round((savings / individualTotal) * 100)"
  }
};
```

#### Bundle Display
```javascript
const bundleDisplay = {
  // Bundle Card Features
  bundleCard: {
    title: "Bundle title",
    description: "Bundle description",
    price: "Bundle price with savings indicator",
    itemCount: "Number of items in bundle",
    savings: "Amount and percentage saved",
    collectionInfo: "Date and address if provided"
  },
  
  // Bundle Actions
  bundleActions: {
    editBundle: "Modify bundle details",
    deleteBundle: "Remove bundle",
    viewBundle: "See bundle details",
    purchaseBundle: "Buy entire bundle"
  }
};
```

### 6. Rating System Integration

#### Rating Management
```javascript
const ratingSystem = {
  // Rating Triggers
  triggers: {
    itemSold: "When item status changes to 'sold'",
    transactionCompleted: "When transaction status is 'completed'"
  },
  
  // Rating Modal
  ratingModal: {
    transaction: "Transaction details",
    buyer: "Buyer information",
    item: "Sold item details",
    ratingOptions: "1-5 star rating system",
    comments: "Optional feedback text"
  },
  
  // Rating Status
  ratingStatus: {
    hasRated: "boolean - whether seller has rated buyer",
    canRate: "boolean - whether rating is available",
    ratingData: "existing rating information"
  }
};
```

## Mobile App Implementation

### 1. Page Structure

#### Main Layout
```javascript
const myItemsPageStructure = {
  // Header Section
  header: {
    title: "My Items",
    subtitle: "Manage your inventory",
    actions: ["Add Item", "Create Bundle", "Bulk Operations"]
  },
  
  // Stats Section
  stats: {
    component: "StatsCards",
    layout: "grid grid-cols-2 md:grid-cols-4 gap-4",
    data: "calculated from items array"
  },
  
  // Tabs Section
  tabs: {
    component: "Tabs",
    tabs: ["all", "active", "sold", "inactive"],
    content: "filtered items grid"
  },
  
  // Items Grid
  itemsGrid: {
    component: "MyItemCard",
    layout: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    features: ["bulk selection", "status badges", "action menus"]
  }
};
```

### 2. State Management

#### Component State
```javascript
const myItemsState = {
  // Data State
  items: "array of user items",
  bundles: "array of user bundles",
  currentUser: "user object",
  
  // UI State
  loading: "boolean - loading state",
  activeTab: "string - current tab selection",
  bulkSelectMode: "boolean - bulk selection mode",
  selectedItems: "array - selected items for bulk operations",
  
  // Modal State
  showBundleCreator: "boolean - bundle creation modal",
  showBulkDeleteModal: "boolean - bulk delete modal",
  showRatingModal: "boolean - rating modal",
  
  // Rating State
  itemRatings: "object - rating data for sold items",
  ratingTransaction: "object - transaction being rated"
};
```

### 3. API Integration

#### Data Loading
```javascript
const dataLoading = {
  // Load User Items
  loadUserItems: async () => {
    const user = await User.me();
    const items = await Item.filter({ seller_id: user.id }, "-created_at");
    return items;
  },
  
  // Load User Bundles
  loadUserBundles: async () => {
    const response = await fetch(`/api/bundles?seller_id=${userId}&limit=50`);
    return response.json();
  },
  
  // Load Rating Data
  loadRatingData: async (items) => {
    const ratingsData = {};
    for (const item of items) {
      if (item.status === 'sold') {
        const transaction = await Transaction.filter({ 
          item_id: item.id, 
          status: 'completed' 
        })[0];
        if (transaction) {
          const rating = await Rating.filter({ 
            transaction_id: transaction.id, 
            rated_by_user_id: user.id 
          });
          ratingsData[item.id] = { transaction, hasRated: rating.length > 0 };
        }
      }
    }
    return ratingsData;
  }
};
```

### 4. Bulk Operations API

#### Bulk Delete Implementation
```javascript
const bulkDeleteAPI = {
  // Delete Multiple Items
  bulkDeleteItems: async (itemIds) => {
    const response = await fetch('/api/bulk-delete-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds })
    });
    return response.json();
  },
  
  // Validation
  validateBulkDelete: (items) => {
    const canDelete = items.filter(item => 
      item.status === 'active' || item.status === 'inactive'
    );
    const cannotDelete = items.filter(item => 
      item.status === 'reserved' || item.status === 'sold'
    );
    return { canDelete, cannotDelete };
  }
};
```

### 5. Bundle Management API

#### Bundle Operations
```javascript
const bundleAPI = {
  // Create Bundle
  createBundle: async (bundleData) => {
    const response = await fetch('/api/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundleData)
    });
    return response.json();
  },
  
  // Update Bundle
  updateBundle: async (bundleId, updates) => {
    const response = await fetch(`/api/bundles/${bundleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },
  
  // Delete Bundle
  deleteBundle: async (bundleId) => {
    const response = await fetch(`/api/bundles/${bundleId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};
```

## Mobile-Specific Features

### 1. Touch Interactions

#### Gesture Support
```javascript
const touchInteractions = {
  // Item Card Interactions
  itemCard: {
    tap: "navigate to item detail",
    longPress: "open action menu",
    swipe: "quick actions (future feature)"
  },
  
  // Bulk Selection
  bulkSelection: {
    tap: "select/deselect item",
    longPress: "enter bulk mode",
    multiSelect: "select multiple items"
  }
};
```

### 2. Performance Optimizations

#### Lazy Loading
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
    itemHeight: 200,
    bufferSize: 10
  },
  
  // Data Pagination
  pagination: {
    pageSize: 20,
    loadMore: "infinite scroll",
    caching: "local storage cache"
  }
};
```

### 3. Offline Support

#### Offline Capabilities
```javascript
const offlineSupport = {
  // Data Caching
  dataCaching: {
    items: "local storage cache",
    bundles: "local storage cache",
    stats: "calculated from cached data"
  },
  
  // Offline Actions
  offlineActions: {
    viewItems: "read from cache",
    editItems: "queue for sync",
    deleteItems: "queue for sync",
    createBundles: "queue for sync"
  },
  
  // Sync Strategy
  syncStrategy: {
    onReconnect: "sync queued actions",
    conflictResolution: "server wins",
    retryLogic: "exponential backoff"
  }
};
```

## Configuration Options

### 1. Display Settings

#### Item Display Configuration
```javascript
const displaySettings = {
  // Grid Layout
  gridLayout: {
    columns: "responsive (1/2/3)",
    spacing: "gap-4 md:gap-6",
    cardSize: "aspect-square images"
  },
  
  // Item Information
  itemInfo: {
    showPrice: true,
    showDate: true,
    showTags: true,
    showCondition: true,
    showStatus: true
  },
  
  // Image Settings
  imageSettings: {
    aspectRatio: "square",
    quality: "medium",
    lazyLoading: true,
    fallbackImage: "default placeholder"
  }
};
```

### 2. Bulk Operations Settings

#### Bulk Operation Configuration
```javascript
const bulkOperationSettings = {
  // Selection Limits
  selectionLimits: {
    maxSelection: 50,
    minSelection: 1,
    allowMixedStatus: false
  },
  
  // Operation Types
  operationTypes: {
    delete: {
      enabled: true,
      confirmation: "required",
      validation: "status-based"
    },
    statusChange: {
      enabled: true,
      allowedTransitions: ["active->inactive", "inactive->active"]
    },
    export: {
      enabled: false,
      formats: ["csv", "json"]
    }
  }
};
```

### 3. Bundle Settings

#### Bundle Configuration
```javascript
const bundleSettings = {
  // Bundle Limits
  bundleLimits: {
    minItems: 2,
    maxItems: 10,
    minSavings: 5, // percentage
    maxSavings: 50 // percentage
  },
  
  // Collection Settings
  collectionSettings: {
    requireDate: false,
    requireAddress: false,
    allowFlexible: true
  },
  
  // Pricing Rules
  pricingRules: {
    mustBeLessThanIndividual: true,
    minSavingsPercentage: 5,
    maxSavingsPercentage: 50
  }
};
```

This comprehensive My Items page configuration provides all the functionality needed for a complete mobile app implementation, including item management, bulk operations, bundle creation, analytics, and mobile-specific optimizations.
