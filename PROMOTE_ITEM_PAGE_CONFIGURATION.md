# Promote Item Page Configuration for Mobile App

This document provides comprehensive information about the "Promote Item" page functionality, including all features, advertisement management, promotion options, placement strategies, and administrative controls for both admin and business users.

## Overview

The Promote Item page is a comprehensive advertisement and promotion management system that allows users to create, manage, and track promotional campaigns for their items. It features multiple placement options, targeting capabilities, analytics tracking, and role-based access control for different user types.

## Core Features

### 1. Advertisement Management System

#### Advertisement Structure
```javascript
const advertisementStructure = {
  // Core Fields
  coreFields: {
    id: "UUID primary key",
    title: "string (required)",
    description: "string (optional)",
    image_url: "string (required)",
    link_url: "string (optional)",
    placement: "enum (top_banner, local_deals, bottom_banner, between_items)",
    status: "enum (active, inactive, scheduled)",
    priority: "integer (1-100)",
    start_date: "date (optional)",
    end_date: "date (optional)",
    impression_count: "integer (default 0)",
    click_count: "integer (default 0)",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  
  // Placement Types
  placementTypes: {
    top_banner: "Full-width banner at top of marketplace",
    local_deals: "Card-style ad in main grid (position 3)",
    bottom_banner: "Featured card in main grid (position 8)",
    between_items: "Horizontal banner between items (every 6 items)"
  }
};
```

#### Advertisement Operations
```javascript
const advertisementOperations = {
  // Create Operations
  create: {
    createAd: "Create new advertisement",
    formFields: ["title", "description", "image_url", "link_url", "placement", "priority", "start_date", "end_date"],
    validation: "Title and image required, valid placement",
    imageUpload: "Upload advertisement image"
  },
  
  // Read Operations
  read: {
    listAds: "List all advertisements",
    filterAds: "Filter by placement, status, date range",
    searchAds: "Search by title, description",
    viewAd: "View individual advertisement details"
  },
  
  // Update Operations
  update: {
    editAd: "Edit advertisement details",
    updateStatus: "Activate/deactivate advertisement",
    updatePriority: "Change advertisement priority",
    updateDates: "Update start/end dates"
  },
  
  // Delete Operations
  delete: {
    deleteAd: "Delete advertisement permanently",
    bulkDelete: "Delete multiple advertisements",
    confirmation: "Confirmation dialog for deletion"
  }
};
```

### 2. Placement Strategy System

#### Placement Configuration
```javascript
const placementConfiguration = {
  // Top Banner (Premium)
  topBanner: {
    location: "Top of marketplace page, before trending items",
    style: "Full-width promotional banner",
    bestFor: "Major announcements, sales, brand awareness",
    priority: "Highest visibility",
    dimensions: "Full width, responsive height",
    demoAd: "🎉 Welcome to Our Marketplace!"
  },
  
  // Local Deals Card
  localDeals: {
    location: "Position 3 in main grid",
    style: "Card-style ad that blends with listings",
    bestFor: "Promoting local businesses, special deals",
    priority: "High visibility in main grid",
    dimensions: "Standard item card size",
    demoAd: "Local Artisan Market"
  },
  
  // Bottom Banner (Featured)
  bottomBanner: {
    location: "Position 8 in main grid",
    style: "Featured card with call-to-action button",
    bestFor: "Featured products, premium listings",
    priority: "High visibility in main grid",
    dimensions: "Standard item card size",
    demoAd: "Premium Featured Listing"
  },
  
  // Between Items (In-Feed)
  betweenItems: {
    location: "After every 6 items in the grid",
    style: "Horizontal banner ad",
    bestFor: "Ongoing promotions, service announcements",
    priority: "Regular visibility throughout grid",
    dimensions: "Full width, compact height",
    demoAd: "📦 Safe Shipping Available"
  }
};
```

#### Placement Logic
```javascript
const placementLogic = {
  // Advertisement Insertion
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

### 3. Analytics and Tracking System

#### Analytics Configuration
```javascript
const analyticsConfiguration = {
  // Tracking Metrics
  trackingMetrics: {
    impressions: "Number of times ad is viewed",
    clicks: "Number of times ad is clicked",
    clickThroughRate: "Clicks / Impressions * 100",
    conversionRate: "Conversions / Clicks * 100",
    costPerClick: "Total cost / Clicks",
    costPerImpression: "Total cost / Impressions"
  },
  
  // Tracking Implementation
  trackingImplementation: {
    impressionTracking: "IntersectionObserver for view tracking",
    clickTracking: "Click event handlers",
    conversionTracking: "Purchase/action tracking",
    realTimeUpdates: "Live analytics updates"
  }
};
```

#### Analytics Display
```javascript
const analyticsDisplay = {
  // Dashboard Metrics
  dashboardMetrics: {
    totalAds: "Total number of advertisements",
    activeAds: "Currently running advertisements",
    totalClicks: "Sum of all ad clicks",
    totalImpressions: "Total times ads have been viewed",
    averageCTR: "Average click-through rate",
    topPerformingAd: "Highest performing advertisement"
  },
  
  // Individual Ad Metrics
  individualMetrics: {
    impressionCount: "Number of impressions",
    clickCount: "Number of clicks",
    clickThroughRate: "CTR percentage",
    dateRange: "Start and end dates",
    priority: "Priority level",
    status: "Active/Inactive status"
  }
};
```

### 4. Role-Based Access Control

#### Access Control Configuration
```javascript
const accessControlConfiguration = {
  // User Roles
  userRoles: {
    admin: {
      permissions: ["view", "create", "update", "delete", "manage"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: true
    },
    super_admin: {
      permissions: ["view", "create", "update", "delete", "manage", "admin"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: true,
      systemAccess: true
    },
    business: {
      permissions: ["view", "create", "update"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: false
    },
    regular: {
      permissions: ["view"],
      advertisementAccess: false,
      analyticsAccess: false,
      placementAccess: false
    }
  }
};
```

#### Permission Checks
```javascript
const permissionChecks = {
  // Advertisement Permissions
  advertisementPermissions: {
    canViewAds: "Check if user can view advertisements",
    canCreateAds: "Check if user can create advertisements",
    canUpdateAds: "Check if user can update advertisements",
    canDeleteAds: "Check if user can delete advertisements"
  },
  
  // Analytics Permissions
  analyticsPermissions: {
    canViewAnalytics: "Check if user can view analytics",
    canExportAnalytics: "Check if user can export analytics",
    canViewDetailedMetrics: "Check if user can view detailed metrics"
  }
};
```

### 5. Advertisement Creation System

#### Creation Form
```javascript
const creationForm = {
  // Required Fields
  requiredFields: {
    title: "Advertisement title (required)",
    image: "Advertisement image (required)",
    placement: "Advertisement placement (required)"
  },
  
  // Optional Fields
  optionalFields: {
    description: "Advertisement description",
    linkUrl: "Click destination URL",
    priority: "Priority level (1-100)",
    startDate: "Start date for advertisement",
    endDate: "End date for advertisement"
  },
  
  // Form Validation
  formValidation: {
    title: "Non-empty string, max 100 characters",
    description: "Max 500 characters",
    image: "Valid image file, max 10MB",
    linkUrl: "Valid URL format",
    priority: "Integer between 1-100",
    dates: "End date must be after start date"
  }
};
```

#### Image Upload System
```javascript
const imageUploadSystem = {
  // Upload Configuration
  uploadConfiguration: {
    maxFileSize: "10MB per image",
    supportedFormats: ["image/jpeg", "image/png", "image/webp"],
    compression: "Automatic compression for optimization",
    storage: "Cloud storage with CDN"
  },
  
  // Image Processing
  imageProcessing: {
    resize: "Resize for optimal display",
    compress: "Compress for faster loading",
    optimize: "Optimize for different placements",
    generateThumbnails: "Generate thumbnail versions"
  }
};
```

### 6. Demo Advertisement System

#### Demo Advertisement Configuration
```javascript
const demoAdvertisementConfiguration = {
  // Demo Advertisements
  demoAds: {
    topBanner: {
      id: "demo_top_banner",
      title: "🎉 Welcome to Our Marketplace!",
      description: "Discover amazing local deals and connect with sellers in your community. Start browsing today!",
      image_url: "marketplace welcome image",
      placement: "top_banner",
      status: "active",
      priority: 1,
      impression_count: 1250,
      click_count: 87
    },
    localDeals: {
      id: "demo_local_deals",
      title: "Local Artisan Market",
      description: "Handcrafted goods from local makers. Support your community!",
      image_url: "artisan market image",
      placement: "local_deals",
      status: "active",
      priority: 2,
      impression_count: 890,
      click_count: 65
    },
    bottomBanner: {
      id: "demo_bottom_banner",
      title: "Premium Featured Listing",
      description: "Get your items seen by more buyers with featured placement",
      image_url: "featured listing image",
      placement: "bottom_banner",
      status: "active",
      priority: 3,
      impression_count: 567,
      click_count: 43
    },
    betweenItems: {
      id: "demo_between_items",
      title: "📦 Safe Shipping Available",
      description: "Shop with confidence - secure shipping on all items",
      image_url: "shipping image",
      placement: "between_items",
      status: "active",
      priority: 4,
      impression_count: 1456,
      click_count: 92
    }
  },
  
  // Fallback System
  fallbackSystem: {
    showDemoAds: "Show demo ads when no real ads available",
    replaceWithRealAds: "Replace demo ads with real ads when created",
    maintainDemoAds: "Keep demo ads as fallback"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const promoteItemPageState = {
  // Data State
  advertisements: "array of advertisements",
  currentUser: "current user object",
  selectedPlacement: "selected placement type",
  
  // UI State
  loading: "boolean loading state",
  isCreating: "boolean creating state",
  isEditing: "boolean editing state",
  editingId: "ID of advertisement being edited",
  
  // Form State
  formData: {
    title: "string",
    description: "string",
    image_url: "string",
    link_url: "string",
    placement: "string",
    priority: "number",
    start_date: "string",
    end_date: "string"
  },
  
  // Analytics State
  analytics: {
    totalAds: "number",
    activeAds: "number",
    totalClicks: "number",
    totalImpressions: "number"
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Data Loading
  dataLoading: {
    loadAdvertisements: "Load all advertisements",
    loadAnalytics: "Load analytics data",
    loadUser: "Load current user data",
    refreshData: "Refresh all data"
  },
  
  // Form Management
  formManagement: {
    updateField: "Update individual form fields",
    resetForm: "Reset form to initial state",
    validateForm: "Validate form data",
    submitForm: "Submit form data"
  }
};
```

### 2. Advertisement Management

#### Advertisement Component
```javascript
const advertisementComponent = {
  // Display Features
  displayFeatures: {
    title: "Display advertisement title",
    description: "Display advertisement description",
    image: "Display advertisement image",
    placement: "Display placement type",
    status: "Display status badge",
    metrics: "Display impression and click counts"
  },
  
  // Action Features
  actionFeatures: {
    viewAd: "View advertisement details",
    editAd: "Edit advertisement",
    activateAd: "Activate advertisement",
    deactivateAd: "Deactivate advertisement",
    deleteAd: "Delete advertisement"
  }
};
```

#### Advertisement Operations
```javascript
const advertisementOperations = {
  // Create Operations
  createOperations: {
    createAdvertisement: async (adData) => {
      // Validate required fields
      // Upload image if provided
      // Insert into database
      // Refresh advertisement list
    },
    
    validateAdvertisement: (adData) => {
      // Check required fields
      // Validate data types
      // Return validation result
    }
  },
  
  // Update Operations
  updateOperations: {
    updateAdvertisement: async (id, updates) => {
      // Validate updates
      // Update database
      // Refresh advertisement list
    },
    
    toggleStatus: async (id, status) => {
      // Update status
      // Save to database
      // Update UI
    }
  },
  
  // Delete Operations
  deleteOperations: {
    deleteAdvertisement: async (id) => {
      // Confirm deletion
      // Delete from database
      // Refresh advertisement list
    }
  }
};
```

### 3. Analytics Implementation

#### Analytics Component
```javascript
const analyticsComponent = {
  // Dashboard Features
  dashboardFeatures: {
    totalAds: "Display total advertisements",
    activeAds: "Display active advertisements",
    totalClicks: "Display total clicks",
    totalImpressions: "Display total impressions",
    averageCTR: "Display average click-through rate"
  },
  
  // Individual Metrics
  individualMetrics: {
    impressionCount: "Display impression count",
    clickCount: "Display click count",
    clickThroughRate: "Display CTR percentage",
    dateRange: "Display date range",
    priority: "Display priority level"
  }
};
```

#### Analytics Operations
```javascript
const analyticsOperations = {
  // Data Fetching
  dataFetching: {
    fetchAnalytics: async () => {
      // Fetch analytics data
      // Calculate metrics
      // Update state
    },
    
    fetchAdMetrics: async (adId) => {
      // Fetch individual ad metrics
      // Calculate performance metrics
      // Update state
    }
  },
  
  // Metric Calculations
  metricCalculations: {
    calculateCTR: (clicks, impressions) => {
      return (clicks / impressions) * 100;
    },
    
    calculateConversionRate: (conversions, clicks) => {
      return (conversions / clicks) * 100;
    }
  }
};
```

### 4. Placement Management

#### Placement Component
```javascript
const placementComponent = {
  // Placement Selection
  placementSelection: {
    topBanner: "Top banner placement option",
    localDeals: "Local deals card placement option",
    bottomBanner: "Bottom banner placement option",
    betweenItems: "Between items placement option"
  },
  
  // Placement Preview
  placementPreview: {
    showPreview: "Show placement preview",
    updatePreview: "Update preview based on selection",
    validatePlacement: "Validate placement selection"
  }
};
```

#### Placement Operations
```javascript
const placementOperations = {
  // Placement Logic
  placementLogic: {
    insertAdvertisements: (items) => {
      // Insert advertisements at specific positions
      // Handle placement logic
      // Return items with advertisements
    },
    
    validatePlacement: (placement) => {
      // Validate placement selection
      // Check availability
      // Return validation result
    }
  }
};
```

### 5. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    imageUpload: "Touch-friendly upload buttons",
    formInputs: "Large, accessible input fields",
    navigation: "Swipe between sections",
    gestures: "Native gesture support"
  },
  
  // Performance
  performance: {
    imageCompression: "Compress images for mobile",
    lazyLoading: "Load images on demand",
    caching: "Cache data locally",
    offline: "Handle offline scenarios"
  },
  
  // Mobile Features
  mobileFeatures: {
    camera: "Native camera access for images",
    gestures: "Swipe and touch gestures",
    orientation: "Handle orientation changes",
    notifications: "Push notifications for ad performance"
  }
};
```

#### Mobile Camera Integration
```javascript
const mobileCameraIntegration = {
  // Camera Features
  cameraFeatures: {
    capture: "Take photo directly in app",
    retake: "Retake if not satisfied",
    confirm: "Confirm before adding",
    quality: "High quality capture"
  },
  
  // Camera Constraints
  cameraConstraints: {
    resolution: "High resolution capture",
    format: "JPEG format",
    compression: "Optimized for mobile",
    orientation: "Auto-rotate based on device"
  }
};
```

### 6. API Integration

#### API Endpoints
```javascript
const apiEndpoints = {
  // Advertisement Endpoints
  advertisementEndpoints: {
    list: "GET /api/advertisements - List all advertisements",
    create: "POST /api/advertisements - Create new advertisement",
    update: "PUT /api/advertisements - Update advertisement",
    delete: "DELETE /api/advertisements - Delete advertisement"
  },
  
  // Analytics Endpoints
  analyticsEndpoints: {
    dashboard: "GET /api/analytics/dashboard - Get dashboard metrics",
    adMetrics: "GET /api/analytics/ad/{id} - Get ad metrics",
    export: "GET /api/analytics/export - Export analytics data"
  }
};
```

#### API Operations
```javascript
const apiOperations = {
  // Advertisement Operations
  advertisementOperations: {
    fetchAdvertisements: async () => {
      // Fetch all advertisements
      // Handle errors
      // Update state
    },
    
    createAdvertisement: async (adData) => {
      // Validate data
      // Send to API
      // Handle response
      // Update state
    },
    
    updateAdvertisement: async (id, updates) => {
      // Validate updates
      // Send to API
      // Handle response
      // Update state
    },
    
    deleteAdvertisement: async (id) => {
      // Confirm deletion
      // Send to API
      // Handle response
      // Update state
    }
  },
  
  // Analytics Operations
  analyticsOperations: {
    fetchAnalytics: async () => {
      // Fetch analytics data
      // Calculate metrics
      // Update state
    },
    
    fetchAdMetrics: async (adId) => {
      // Fetch individual ad metrics
      // Calculate performance
      // Update state
    }
  }
};
```

## Configuration Options

### 1. Advertisement Configuration

#### Advertisement Settings
```javascript
const advertisementSettings = {
  // Required Fields
  requiredFields: {
    title: "Advertisement title (required)",
    image: "Advertisement image (required)",
    placement: "Advertisement placement (required)"
  },
  
  // Optional Fields
  optionalFields: {
    description: "Advertisement description",
    linkUrl: "Click destination URL",
    priority: "Priority level (1-100)",
    startDate: "Start date for advertisement",
    endDate: "End date for advertisement"
  },
  
  // Validation Rules
  validationRules: {
    title: "Non-empty string, max 100 characters",
    description: "Max 500 characters",
    image: "Valid image file, max 10MB",
    linkUrl: "Valid URL format",
    priority: "Integer between 1-100",
    dates: "End date must be after start date"
  }
};
```

#### Placement Settings
```javascript
const placementSettings = {
  // Placement Options
  placementOptions: {
    topBanner: {
      name: "Top Banner",
      description: "Full-width banner at top of marketplace",
      priority: "Highest visibility",
      bestFor: "Major announcements, sales, brand awareness"
    },
    localDeals: {
      name: "Local Deals Card",
      description: "Card-style ad in main grid",
      priority: "High visibility in main grid",
      bestFor: "Promoting local businesses, special deals"
    },
    bottomBanner: {
      name: "Bottom Banner (Featured)",
      description: "Featured card in main grid",
      priority: "High visibility in main grid",
      bestFor: "Featured products, premium listings"
    },
    betweenItems: {
      name: "Between Items (In-Feed)",
      description: "Horizontal banner between items",
      priority: "Regular visibility throughout grid",
      bestFor: "Ongoing promotions, service announcements"
    }
  }
};
```

### 2. Analytics Configuration

#### Analytics Settings
```javascript
const analyticsSettings = {
  // Metrics to Track
  metricsToTrack: {
    impressions: "Number of times ad is viewed",
    clicks: "Number of times ad is clicked",
    conversions: "Number of conversions from ad",
    revenue: "Revenue generated from ad"
  },
  
  // Display Options
  displayOptions: {
    showTotalAds: true,
    showActiveAds: true,
    showTotalClicks: true,
    showTotalImpressions: true,
    showAverageCTR: true,
    showTopPerformingAd: true
  }
};
```

#### Analytics Display
```javascript
const analyticsDisplay = {
  // Dashboard Layout
  dashboardLayout: {
    metricsGrid: "Grid layout for metrics",
    chartsSection: "Charts and graphs section",
    topAdsSection: "Top performing ads section",
    recentActivitySection: "Recent activity section"
  },
  
  // Chart Types
  chartTypes: {
    impressionsChart: "Line chart for impressions over time",
    clicksChart: "Bar chart for clicks by placement",
    ctrChart: "Pie chart for click-through rates",
    performanceChart: "Combined performance chart"
  }
};
```

### 3. Mobile Configuration

#### Mobile Features
```javascript
const mobileFeatures = {
  // Camera Integration
  cameraIntegration: {
    enabled: true,
    permissions: "Request camera access",
    quality: "High quality capture",
    format: "JPEG format",
    orientation: "Auto-rotate"
  },
  
  // Touch Interactions
  touchInteractions: {
    swipe: "Swipe between sections",
    tap: "Tap to interact",
    longPress: "Long press for options",
    gestures: "Native gesture support"
  }
};
```

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Performance
  performance: {
    imageCompression: "Compress images for mobile",
    lazyLoading: "Load images on demand",
    caching: "Cache data locally",
    offline: "Handle offline scenarios"
  },
  
  // UI/UX
  uiUx: {
    responsive: "Responsive design",
    touchFriendly: "Touch-friendly controls",
    accessibility: "Accessibility features",
    orientation: "Handle orientation changes"
  }
};
```

### 4. Access Control Configuration

#### Role-Based Access
```javascript
const roleBasedAccess = {
  // User Roles
  userRoles: {
    admin: {
      permissions: ["view", "create", "update", "delete", "manage"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: true
    },
    super_admin: {
      permissions: ["view", "create", "update", "delete", "manage", "admin"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: true,
      systemAccess: true
    },
    business: {
      permissions: ["view", "create", "update"],
      advertisementAccess: true,
      analyticsAccess: true,
      placementAccess: false
    },
    regular: {
      permissions: ["view"],
      advertisementAccess: false,
      analyticsAccess: false,
      placementAccess: false
    }
  }
};
```

#### Permission Checks
```javascript
const permissionChecks = {
  // Advertisement Permissions
  advertisementPermissions: {
    canViewAds: "Check if user can view advertisements",
    canCreateAds: "Check if user can create advertisements",
    canUpdateAds: "Check if user can update advertisements",
    canDeleteAds: "Check if user can delete advertisements"
  },
  
  // Analytics Permissions
  analyticsPermissions: {
    canViewAnalytics: "Check if user can view analytics",
    canExportAnalytics: "Check if user can export analytics",
    canViewDetailedMetrics: "Check if user can view detailed metrics"
  }
};
```

This comprehensive Promote Item page configuration provides everything needed for a complete mobile app implementation, including advertisement management, placement strategies, analytics tracking, and role-based access control! 🚀
