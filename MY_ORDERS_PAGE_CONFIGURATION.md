# My Orders Page Configuration for Mobile App

This document provides comprehensive information about the "My Orders" page functionality, including all features, order management, payment tracking, collection details, and shipping management for both buyers and sellers.

## Overview

The My Orders page is the central hub for order management, providing separate views for buyers and sellers to track purchases, sales, payments, and delivery status. It features comprehensive order tracking, payment confirmation, collection management, and shipping integration.

## Core Features

### 1. Dual-Tab Interface

#### Tab Structure
```javascript
const orderTabs = {
  // Buying Tab
  buying: {
    title: "I'm Buying",
    icon: "Package",
    color: "cyan theme",
    count: "buyingOrders.length",
    description: "Track your purchases and orders"
  },
  
  // Selling Tab
  selling: {
    title: "I'm Selling", 
    icon: "Building2",
    color: "purple theme",
    count: "sellingOrders.length",
    description: "Manage your sales and orders"
  }
};
```

#### Tab Navigation
```javascript
const tabNavigation = {
  layout: "grid w-full grid-cols-2",
  background: "bg-gray-900/50 border border-cyan-500/20",
  activeBuying: "data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400",
  activeSelling: "data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
};
```

### 2. Order Status System

#### Order Status Flow
```javascript
const orderStatusFlow = {
  // Initial Status
  awaiting_payment: {
    description: "Waiting for buyer to make payment",
    color: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    icon: "Clock",
    actions: ["buyer: make payment", "seller: wait for payment"]
  },
  
  // Payment Confirmation
  payment_pending_seller_confirmation: {
    description: "Payment made, waiting for seller confirmation",
    color: "bg-blue-900/50 text-blue-300 border-blue-700",
    icon: "AlertCircle",
    actions: ["seller: confirm payment", "buyer: wait for confirmation"]
  },
  
  // Payment Confirmed
  payment_confirmed: {
    description: "Payment confirmed, ready for delivery",
    color: "bg-green-900/50 text-green-300 border-green-700",
    icon: "CheckCircle",
    actions: ["seller: arrange delivery/collection", "buyer: wait for delivery"]
  },
  
  // Shipping Status
  shipped: {
    description: "Item has been shipped",
    color: "bg-blue-900/50 text-blue-300 border-blue-700",
    icon: "Truck",
    actions: ["buyer: track delivery", "seller: monitor delivery"]
  },
  
  // Delivery Status
  delivered: {
    description: "Item has been delivered",
    color: "bg-green-900/50 text-green-300 border-green-700",
    icon: "CheckCircle",
    actions: ["buyer: confirm receipt", "seller: order complete"]
  },
  
  // Collection Status
  collected: {
    description: "Item has been collected",
    color: "bg-green-900/50 text-green-300 border-green-700",
    icon: "MapPin",
    actions: ["buyer: confirm receipt", "seller: order complete"]
  },
  
  // Problem Statuses
  expired: {
    description: "Payment deadline expired",
    color: "bg-red-900/50 text-red-300 border-red-700",
    icon: "AlertCircle",
    actions: ["buyer: reorder", "seller: item available again"]
  },
  
  cancelled: {
    description: "Order was cancelled",
    color: "bg-gray-900/50 text-gray-300 border-gray-700",
    icon: "X",
    actions: ["buyer: reorder", "seller: item available again"]
  }
};
```

### 3. Order Card Configuration

#### Order Card Display
```javascript
const orderCardConfig = {
  // Visual Layout
  layout: {
    image: "w-24 h-24 object-cover rounded-lg",
    content: "flex-1 space-y-4",
    grid: "grid grid-cols-2 gap-4"
  },
  
  // Order Information
  orderInfo: {
    title: "order.item.title",
    orderNumber: "Order #{order.id.slice(0, 8).toUpperCase()}",
    status: "dynamic status badge",
    totalAmount: "formatted total amount",
    deliveryMethod: "collect or ship",
    createdAt: "formatted creation date"
  },
  
  // Party Information
  partyInfo: {
    buyer: "order.buyer information",
    seller: "order.seller information",
    contact: "email or phone if available"
  },
  
  // Item Details
  itemDetails: {
    image: "primary item image",
    title: "item title",
    description: "item description",
    price: "item price",
    condition: "item condition"
  }
};
```

#### Order Card Actions
```javascript
const orderCardActions = {
  // Seller Actions
  sellerActions: {
    confirmPayment: {
      condition: "status === 'payment_pending_seller_confirmation'",
      action: "handleSellerConfirmPayment",
      button: "Confirm Payment Received",
      color: "green gradient"
    },
    
    addCollectionDetails: {
      condition: "status === 'payment_confirmed' && delivery_method === 'collect'",
      action: "handleAddCollectionDetails",
      button: "Save Collection Details",
      color: "purple gradient"
    },
    
    addTracking: {
      condition: "status === 'payment_confirmed' && delivery_method === 'ship'",
      action: "handleAddTracking",
      button: "Parcel Posted",
      color: "blue gradient"
    }
  },
  
  // Buyer Actions
  buyerActions: {
    viewCollectionDetails: {
      condition: "status === 'collected'",
      action: "view collection information",
      display: "collection address, date, time"
    },
    
    trackShipping: {
      condition: "status === 'shipped'",
      action: "track delivery",
      display: "tracking number and status"
    }
  }
};
```

### 4. Payment Management System

#### Payment Confirmation Flow
```javascript
const paymentConfirmationFlow = {
  // Seller Confirms Payment
  sellerConfirmPayment: {
    trigger: "seller clicks 'Confirm Payment Received'",
    action: "update order status to 'payment_confirmed'",
    timestamp: "set seller_confirmed_payment_at",
    notification: "buyer receives confirmation",
    nextStep: "seller arranges delivery/collection"
  },
  
  // Payment Tracking
  paymentTracking: {
    buyerConfirmedPayment: "buyer_confirmed_payment_at timestamp",
    sellerConfirmedPayment: "seller_confirmed_payment_at timestamp",
    paymentDeadline: "payment_deadline timestamp",
    status: "current payment status"
  }
};
```

#### Payment Status Indicators
```javascript
const paymentStatusIndicators = {
  awaitingPayment: {
    icon: "Clock",
    color: "yellow",
    message: "Waiting for payment",
    action: "buyer needs to pay"
  },
  
  paymentPending: {
    icon: "AlertCircle", 
    color: "blue",
    message: "Payment pending confirmation",
    action: "seller needs to confirm"
  },
  
  paymentConfirmed: {
    icon: "CheckCircle",
    color: "green", 
    message: "Payment confirmed",
    action: "ready for delivery"
  }
};
```

### 5. Collection Management System

#### Collection Details Configuration
```javascript
const collectionDetailsConfig = {
  // Collection Information
  collectionInfo: {
    address: "collection_address",
    date: "collection_date",
    timeStart: "collection_time_start",
    timeEnd: "collection_time_end",
    instructions: "collection_instructions"
  },
  
  // Collection Form
  collectionForm: {
    address: {
      type: "text input",
      placeholder: "Enter collection address",
      required: true
    },
    
    date: {
      type: "date picker",
      placeholder: "Select collection date",
      required: true
    },
    
    timeStart: {
      type: "time picker",
      placeholder: "Start time",
      required: true
    },
    
    timeEnd: {
      type: "time picker", 
      placeholder: "End time",
      required: true
    }
  },
  
  // Collection Actions
  collectionActions: {
    saveDetails: {
      action: "handleAddCollectionDetails",
      button: "Save Collection Details",
      color: "purple gradient",
      icon: "MapPin"
    }
  }
};
```

#### Collection Display
```javascript
const collectionDisplay = {
  // Collection Information Display
  collectionInfo: {
    address: "formatted collection address",
    date: "formatted collection date",
    time: "formatted time range",
    instructions: "collection instructions if available"
  },
  
  // Collection Status
  collectionStatus: {
    pending: "awaiting collection",
    scheduled: "collection scheduled",
    completed: "item collected"
  }
};
```

### 6. Shipping Management System

#### Shipping Configuration
```javascript
const shippingConfig = {
  // Shipping Information
  shippingInfo: {
    address: "shipping_address",
    trackingNumber: "tracking_number",
    carrier: "shipping_carrier",
    status: "shipping_status"
  },
  
  // Tracking Form
  trackingForm: {
    trackingNumber: {
      type: "text input",
      placeholder: "Enter tracking number",
      required: true
    },
    
    carrier: {
      type: "select dropdown",
      options: ["Australia Post", "DHL", "FedEx", "UPS", "Other"],
      required: true
    }
  },
  
  // Shipping Actions
  shippingActions: {
    addTracking: {
      action: "handleAddTracking",
      button: "Parcel Posted",
      color: "blue gradient",
      icon: "Truck"
    }
  }
};
```

#### Shipping Display
```javascript
const shippingDisplay = {
  // Tracking Information
  trackingInfo: {
    number: "tracking_number",
    carrier: "shipping_carrier",
    status: "shipping_status",
    estimatedDelivery: "estimated_delivery_date"
  },
  
  // Shipping Status
  shippingStatus: {
    pending: "awaiting shipment",
    shipped: "in transit",
    delivered: "delivered",
    failed: "delivery failed"
  }
};
```

### 7. Order Data Management

#### Data Loading
```javascript
const dataLoading = {
  // Load Buying Orders
  loadBuyingOrders: async (userId) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        item:items(*),
        seller:seller_id(*)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });
    return data;
  },
  
  // Load Selling Orders
  loadSellingOrders: async (userId) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        item:items(*),
        buyer:buyer_id(*)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    return data;
  }
};
```

#### Order Relationships
```javascript
const orderRelationships = {
  // Order to Item
  item: {
    table: "items",
    relationship: "item_id",
    fields: ["id", "title", "description", "price", "image_urls", "condition"]
  },
  
  // Order to Buyer
  buyer: {
    table: "profiles",
    relationship: "buyer_id", 
    fields: ["id", "full_name", "email", "phone"]
  },
  
  // Order to Seller
  seller: {
    table: "profiles",
    relationship: "seller_id",
    fields: ["id", "full_name", "email", "phone"]
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const myOrdersState = {
  // Data State
  buyingOrders: "array of buyer orders",
  sellingOrders: "array of seller orders",
  currentUser: "user object",
  
  // UI State
  activeTab: "buying or selling",
  loading: "boolean loading state",
  
  // Form State
  trackingNumber: "object of tracking numbers by order id",
  collectionDetails: "object of collection details by order id"
};
```

#### State Management
```javascript
const stateManagement = {
  // Tab Management
  tabManagement: {
    activeTab: "buying | selling",
    setActiveTab: "function to change active tab",
    tabCounts: "display order counts in tab labels"
  },
  
  // Form Management
  formManagement: {
    trackingNumber: "tracking number input state",
    collectionDetails: "collection details input state",
    formValidation: "validate form inputs before submission"
  }
};
```

### 2. Order Actions

#### Seller Actions
```javascript
const sellerActions = {
  // Confirm Payment
  confirmPayment: async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'payment_confirmed',
        seller_confirmed_payment_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (!error) {
      toast.success("Payment Confirmed! Buyer has been notified");
      loadData(); // Reload orders
    }
  },
  
  // Add Collection Details
  addCollectionDetails: async (orderId, details) => {
    const { error } = await supabase
      .from('orders')
      .update({
        collection_address: details.address,
        collection_date: details.date,
        collection_time_start: details.timeStart,
        collection_time_end: details.timeEnd
      })
      .eq('id', orderId);
    
    if (!error) {
      toast.success("Collection details saved!");
      loadData();
    }
  },
  
  // Add Tracking Number
  addTracking: async (orderId, trackingNumber) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number: trackingNumber
      })
      .eq('id', orderId);
    
    if (!error) {
      toast.success("Tracking added! Buyer has been notified");
      loadData();
    }
  }
};
```

#### Buyer Actions
```javascript
const buyerActions = {
  // View Collection Details
  viewCollectionDetails: (order) => {
    return {
      address: order.collection_address,
      date: order.collection_date,
      time: `${order.collection_time_start} - ${order.collection_time_end}`
    };
  },
  
  // Track Shipping
  trackShipping: (order) => {
    return {
      trackingNumber: order.tracking_number,
      status: order.status,
      estimatedDelivery: order.estimated_delivery
    };
  }
};
```

### 3. Order Status Management

#### Status Updates
```javascript
const statusUpdates = {
  // Status Transitions
  statusTransitions: {
    awaiting_payment: ["payment_pending_seller_confirmation", "expired", "cancelled"],
    payment_pending_seller_confirmation: ["payment_confirmed", "expired", "cancelled"],
    payment_confirmed: ["shipped", "collected"],
    shipped: ["delivered"],
    delivered: [], // terminal state
    collected: [], // terminal state
    expired: [], // terminal state
    cancelled: [] // terminal state
  },
  
  // Status Validation
  statusValidation: {
    canTransition: (fromStatus, toStatus) => {
      return statusTransitions[fromStatus].includes(toStatus);
    }
  }
};
```

#### Status Badges
```javascript
const statusBadges = {
  // Badge Configuration
  badgeConfig: {
    awaiting_payment: {
      icon: "Clock",
      color: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
      text: "Awaiting Payment"
    },
    payment_pending_seller_confirmation: {
      icon: "AlertCircle",
      color: "bg-blue-900/50 text-blue-300 border-blue-700", 
      text: "Payment Pending"
    },
    payment_confirmed: {
      icon: "CheckCircle",
      color: "bg-green-900/50 text-green-300 border-green-700",
      text: "Payment Confirmed"
    },
    shipped: {
      icon: "Truck",
      color: "bg-blue-900/50 text-blue-300 border-blue-700",
      text: "Shipped"
    },
    delivered: {
      icon: "CheckCircle",
      color: "bg-green-900/50 text-green-300 border-green-700",
      text: "Delivered"
    },
    collected: {
      icon: "MapPin",
      color: "bg-green-900/50 text-green-300 border-green-700",
      text: "Collected"
    },
    expired: {
      icon: "AlertCircle",
      color: "bg-red-900/50 text-red-300 border-red-700",
      text: "Expired"
    },
    cancelled: {
      icon: "X",
      color: "bg-gray-900/50 text-gray-300 border-gray-700",
      text: "Cancelled"
    }
  }
};
```

### 4. Mobile-Specific Features

#### Touch Interactions
```javascript
const touchInteractions = {
  // Order Card Interactions
  orderCard: {
    tap: "view order details",
    longPress: "quick actions menu",
    swipe: "mark as read/unread (future)"
  },
  
  // Tab Interactions
  tabNavigation: {
    tap: "switch between buying/selling",
    swipe: "swipe between tabs"
  }
};
```

#### Performance Optimizations
```javascript
const performanceOptimizations = {
  // Data Loading
  dataLoading: {
    lazyLoading: "load orders on demand",
    pagination: "load orders in batches",
    caching: "cache order data locally"
  },
  
  // Image Loading
  imageLoading: {
    lazyLoading: "load images as needed",
    placeholder: "blur placeholder",
    errorFallback: "default image"
  },
  
  // Real-time Updates
  realtimeUpdates: {
    enabled: true,
    subscription: "subscribe to order changes",
    updateFrequency: "on status change"
  }
};
```

### 5. Empty States

#### Empty State Configuration
```javascript
const emptyStates = {
  // No Buying Orders
  noBuyingOrders: {
    icon: "Package",
    title: "No purchases yet",
    description: "Items you buy will appear here",
    action: "Browse Marketplace"
  },
  
  // No Selling Orders
  noSellingOrders: {
    icon: "Building2",
    title: "No sales yet",
    description: "Items you sell will appear here",
    action: "List an Item"
  }
};
```

#### Empty State Display
```javascript
const emptyStateDisplay = {
  // Visual Elements
  visual: {
    icon: "large icon (w-16 h-16)",
    color: "text-gray-600",
    spacing: "mx-auto mb-4"
  },
  
  // Content
  content: {
    title: "text-xl font-semibold text-white mb-2",
    description: "text-gray-400",
    action: "button to relevant page"
  }
};
```

## Configuration Options

### 1. Order Display Settings

#### Order Card Configuration
```javascript
const orderCardSettings = {
  // Display Options
  displayOptions: {
    showOrderNumber: true,
    showStatus: true,
    showTotalAmount: true,
    showDeliveryMethod: true,
    showCreatedDate: true
  },
  
  // Layout Options
  layoutOptions: {
    imageSize: "w-24 h-24",
    gridLayout: "grid grid-cols-2 gap-4",
    spacing: "space-y-4"
  }
};
```

#### Status Display Settings
```javascript
const statusDisplaySettings = {
  // Status Colors
  statusColors: {
    awaiting_payment: "yellow",
    payment_pending_seller_confirmation: "blue",
    payment_confirmed: "green",
    shipped: "blue",
    delivered: "green",
    collected: "green",
    expired: "red",
    cancelled: "gray"
  },
  
  // Status Icons
  statusIcons: {
    awaiting_payment: "Clock",
    payment_pending_seller_confirmation: "AlertCircle",
    payment_confirmed: "CheckCircle",
    shipped: "Truck",
    delivered: "CheckCircle",
    collected: "MapPin",
    expired: "AlertCircle",
    cancelled: "X"
  }
};
```

### 2. Form Configuration

#### Collection Form Settings
```javascript
const collectionFormSettings = {
  // Form Fields
  formFields: {
    address: {
      type: "text",
      required: true,
      placeholder: "Enter collection address"
    },
    date: {
      type: "date",
      required: true,
      placeholder: "Select collection date"
    },
    timeStart: {
      type: "time",
      required: true,
      placeholder: "Start time"
    },
    timeEnd: {
      type: "time",
      required: true,
      placeholder: "End time"
    }
  },
  
  // Validation
  validation: {
    address: "required, min 10 characters",
    date: "required, future date",
    timeStart: "required, valid time",
    timeEnd: "required, after start time"
  }
};
```

#### Tracking Form Settings
```javascript
const trackingFormSettings = {
  // Form Fields
  formFields: {
    trackingNumber: {
      type: "text",
      required: true,
      placeholder: "Enter tracking number"
    }
  },
  
  // Validation
  validation: {
    trackingNumber: "required, min 5 characters"
  }
};
```

### 3. Notification Settings

#### Notification Configuration
```javascript
const notificationSettings = {
  // Order Notifications
  orderNotifications: {
    paymentConfirmed: "notify buyer when payment confirmed",
    orderShipped: "notify buyer when order shipped",
    orderDelivered: "notify buyer when order delivered",
    collectionScheduled: "notify buyer when collection scheduled"
  },
  
  // Status Notifications
  statusNotifications: {
    statusChange: "notify both parties on status change",
    deadlineReminder: "remind buyer of payment deadline",
    collectionReminder: "remind buyer of collection details"
  }
};
```

This comprehensive My Orders page configuration provides all the functionality needed for a complete mobile app implementation, including order management, payment tracking, collection details, shipping management, and mobile-specific optimizations! 🚀
