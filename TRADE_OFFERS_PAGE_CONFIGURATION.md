# Trade Offers Page Configuration for Mobile App

This document provides comprehensive information about the "Trade Offers" page functionality, including all features, trade proposal management, offer creation, response handling, and mobile-specific optimizations for the trading system.

## Overview

The Trade Offers page is a comprehensive trading system that allows users to create, manage, and respond to trade proposals. It features dual-tab interface for received and sent offers, real-time status tracking, expiration management, and seamless integration with the marketplace system.

## Core Features

### 1. Dual-Tab Interface

#### Tab Structure
```javascript
const tradeOffersTabs = {
  // Received Offers Tab
  received: {
    title: "Received",
    icon: "RefreshCw",
    color: "purple theme",
    count: "receivedOffers.length",
    description: "Trade offers you've received from other users"
  },
  
  // Sent Offers Tab
  sent: {
    title: "Sent",
    icon: "ArrowRight",
    color: "purple theme",
    count: "sentOffers.length",
    description: "Trade offers you've sent to other users"
  }
};
```

#### Tab Navigation
```javascript
const tabNavigation = {
  layout: "grid w-full grid-cols-2",
  background: "bg-gray-800 rounded-xl p-1 mb-8",
  activeTab: "data-[state=active]:bg-purple-600 data-[state=active]:text-white",
  inactiveTab: "rounded-lg text-gray-300"
};
```

### 2. Trade Proposal System

#### Trade Proposal Structure
```javascript
const tradeProposalStructure = {
  // Core Fields
  coreFields: {
    id: "UUID primary key",
    target_item_id: "UUID reference to target item",
    proposer_user_id: "UUID reference to proposer",
    target_user_id: "UUID reference to target user",
    offered_items: "JSONB array of offered items",
    cash_amount: "decimal (optional)",
    message: "string (optional)",
    total_offered_value: "decimal (calculated)",
    status: "enum (pending, accepted, declined, counter_offered, completed, cancelled)",
    response_message: "string (optional)",
    expires_at: "timestamp",
    created_at: "timestamp",
    updated_at: "timestamp"
  },
  
  // Status Types
  statusTypes: {
    pending: "Awaiting response from target user",
    accepted: "Trade offer accepted",
    declined: "Trade offer declined",
    counter_offered: "Counter offer made",
    completed: "Trade completed",
    cancelled: "Trade offer cancelled"
  }
};
```

#### Trade Proposal Operations
```javascript
const tradeProposalOperations = {
  // Create Operations
  create: {
    createProposal: "Create new trade proposal",
    formFields: ["target_item_id", "proposer_user_id", "target_user_id", "offered_items", "cash_amount", "message"],
    validation: "At least one item or cash amount required",
    expiration: "60 minutes from creation"
  },
  
  // Read Operations
  read: {
    listReceived: "List received trade proposals",
    listSent: "List sent trade proposals",
    viewProposal: "View individual proposal details",
    filterProposals: "Filter by status, date, user"
  },
  
  // Update Operations
  update: {
    acceptProposal: "Accept trade proposal",
    declineProposal: "Decline trade proposal",
    counterOffer: "Make counter offer",
    completeTrade: "Mark trade as completed",
    cancelProposal: "Cancel trade proposal"
  }
};
```

### 3. Offer Creation System

#### Trade Modal Configuration
```javascript
const tradeModalConfiguration = {
  // Modal Features
  modalFeatures: {
    itemSelection: "Select items to trade",
    cashAmount: "Add cash to trade offer",
    message: "Add personal message",
    valueCalculation: "Calculate total offer value",
    expiration: "Set 60-minute expiration"
  },
  
  // Item Selection
  itemSelection: {
    userItems: "Load user's active items",
    multiSelect: "Select multiple items",
    itemDetails: "Show item details and images",
    valueCalculation: "Calculate total value"
  },
  
  // Cash Addition
  cashAddition: {
    cashInput: "Add cash amount to offer",
    totalCalculation: "Include cash in total value",
    validation: "Ensure positive cash amount"
  }
};
```

#### Trade Creation Process
```javascript
const tradeCreationProcess = {
  // Step 1: Load User Data
  loadUserData: async () => {
    // Load current user
    // Load user's active items
    // Set up form state
  },
  
  // Step 2: Select Items
  selectItems: {
    handleSelectItem: (item) => {
      // Toggle item selection
      // Update selected items array
      // Recalculate total value
    }
  },
  
  // Step 3: Add Cash (Optional)
  addCash: {
    setCashAmount: (amount) => {
      // Set cash amount
      // Recalculate total value
    }
  },
  
  // Step 4: Add Message (Optional)
  addMessage: {
    setMessage: (message) => {
      // Set personal message
      // Validate message length
    }
  },
  
  // Step 5: Submit Trade
  submitTrade: async () => {
    // Validate offer (items or cash required)
    // Create trade proposal
    // Set expiration (60 minutes)
    // Send notification
    // Close modal
  }
};
```

### 4. Response Management System

#### Response Modal Configuration
```javascript
const responseModalConfiguration = {
  // Response Options
  responseOptions: {
    accept: "Accept trade proposal",
    decline: "Decline trade proposal",
    counterOffer: "Make counter offer",
    message: "Add response message"
  },
  
  // Response Actions
  responseActions: {
    handleAccept: async (offerId, message) => {
      // Update proposal status to 'accepted'
      // Add response message
      // Send notification to proposer
      // Update UI
    },
    
    handleDecline: async (offerId, message) => {
      // Update proposal status to 'declined'
      // Add response message (required)
      // Send notification to proposer
      // Update UI
    }
  }
};
```

#### Response Workflow
```javascript
const responseWorkflow = {
  // Response Process
  responseProcess: {
    viewOffer: "View trade offer details",
    reviewItems: "Review offered items and cash",
    addMessage: "Add response message",
    chooseAction: "Accept or decline offer",
    submitResponse: "Submit response"
  },
  
  // Status Updates
  statusUpdates: {
    accepted: "Update status to 'accepted'",
    declined: "Update status to 'declined'",
    counterOffered: "Update status to 'counter_offered'",
    completed: "Update status to 'completed'"
  }
};
```

### 5. Status Management System

#### Status Configuration
```javascript
const statusConfiguration = {
  // Status Colors
  statusColors: {
    pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    accepted: "bg-green-900/50 text-green-300 border-green-700",
    declined: "bg-red-900/50 text-red-300 border-red-700",
    counter_offered: "bg-purple-900/50 text-purple-300 border-purple-700",
    completed: "bg-blue-900/50 text-blue-300 border-blue-700",
    cancelled: "bg-gray-700 text-gray-300 border-gray-700"
  },
  
  // Status Icons
  statusIcons: {
    pending: "Clock",
    accepted: "Check",
    declined: "X",
    counter_offered: "RefreshCw",
    completed: "CheckCircle",
    cancelled: "X"
  }
};
```

#### Status Transitions
```javascript
const statusTransitions = {
  // Valid Transitions
  validTransitions: {
    pending: ["accepted", "declined", "counter_offered", "cancelled"],
    accepted: ["completed"],
    declined: [], // terminal state
    counter_offered: ["accepted", "declined", "cancelled"],
    completed: [], // terminal state
    cancelled: [] // terminal state
  },
  
  // Status Actions
  statusActions: {
    accept: "Change status to 'accepted'",
    decline: "Change status to 'declined'",
    counterOffer: "Change status to 'counter_offered'",
    complete: "Change status to 'completed'",
    cancel: "Change status to 'cancelled'"
  }
};
```

### 6. Expiration Management

#### Expiration System
```javascript
const expirationSystem = {
  // Expiration Settings
  expirationSettings: {
    duration: "60 minutes from creation",
    warningTime: "10 minutes before expiration",
    autoExpire: "Automatic expiration handling"
  },
  
  // Expiration Logic
  expirationLogic: {
    setExpiration: (createdAt) => {
      const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000);
      return expiresAt;
    },
    
    checkExpiration: (expiresAt) => {
      const now = new Date();
      return now > expiresAt;
    },
    
    handleExpiration: async (proposalId) => {
      // Update status to 'expired'
      // Send notification
      // Update UI
    }
  }
};
```

#### Expiration Display
```javascript
const expirationDisplay = {
  // Time Remaining
  timeRemaining: {
    calculate: "Calculate time remaining",
    display: "Display time remaining",
    format: "Format as 'X minutes remaining'"
  },
  
  // Expiration Warnings
  expirationWarnings: {
    warning: "Show warning when 10 minutes remaining",
    urgent: "Show urgent warning when 5 minutes remaining",
    expired: "Show expired status when expired"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const tradeOffersPageState = {
  // Data State
  receivedOffers: "array of received trade proposals",
  sentOffers: "array of sent trade proposals",
  currentUser: "current user object",
  
  // UI State
  loading: "boolean loading state",
  activeTab: "current active tab (received/sent)",
  selectedOffer: "selected offer for response",
  
  // Modal State
  showTradeModal: "boolean for trade creation modal",
  showResponseModal: "boolean for response modal",
  targetItem: "target item for trade",
  targetSeller: "target seller for trade"
};
```

#### State Management
```javascript
const stateManagement = {
  // Data Loading
  dataLoading: {
    loadReceivedOffers: "Load received trade proposals",
    loadSentOffers: "Load sent trade proposals",
    loadUserData: "Load current user data",
    refreshData: "Refresh all data"
  },
  
  // Tab Management
  tabManagement: {
    switchTab: "Switch between received/sent tabs",
    updateCounts: "Update tab counts",
    handleTabChange: "Handle tab change events"
  }
};
```

### 2. Trade Offer Management

#### Trade Offer Component
```javascript
const tradeOfferComponent = {
  // Display Features
  displayFeatures: {
    offerDetails: "Display offer details",
    itemImages: "Display offered item images",
    cashAmount: "Display cash amount",
    totalValue: "Display total offer value",
    expiration: "Display expiration time",
    status: "Display offer status"
  },
  
  // Action Features
  actionFeatures: {
    viewOffer: "View offer details",
    respondToOffer: "Respond to offer",
    acceptOffer: "Accept offer",
    declineOffer: "Decline offer",
    cancelOffer: "Cancel offer"
  }
};
```

#### Trade Offer Operations
```javascript
const tradeOfferOperations = {
  // Create Operations
  createOperations: {
    createTradeProposal: async (proposalData) => {
      // Validate proposal data
      // Create trade proposal
      // Set expiration (60 minutes)
      // Send notification
      // Refresh data
    },
    
    validateProposal: (proposalData) => {
      // Check required fields
      // Validate item selection
      // Validate cash amount
      // Return validation result
    }
  },
  
  // Update Operations
  updateOperations: {
    acceptProposal: async (proposalId, message) => {
      // Update status to 'accepted'
      // Add response message
      // Send notification
      // Refresh data
    },
    
    declineProposal: async (proposalId, message) => {
      // Update status to 'declined'
      // Add response message
      // Send notification
      // Refresh data
    }
  }
};
```

### 3. Trade Creation Implementation

#### Trade Modal Component
```javascript
const tradeModalComponent = {
  // Modal Features
  modalFeatures: {
    itemSelection: "Select items to trade",
    cashInput: "Add cash amount",
    messageInput: "Add personal message",
    valueCalculation: "Calculate total value",
    expirationDisplay: "Show expiration time"
  },
  
  // Item Selection
  itemSelection: {
    loadUserItems: "Load user's active items",
    selectItems: "Select multiple items",
    showItemDetails: "Show item details and images",
    calculateValue: "Calculate total value"
  }
};
```

#### Trade Creation Process
```javascript
const tradeCreationProcess = {
  // Step 1: Load Data
  loadData: async () => {
    // Load current user
    // Load user's active items
    // Set up form state
  },
  
  // Step 2: Select Items
  selectItems: {
    handleItemSelection: (item) => {
      // Toggle item selection
      // Update selected items
      // Recalculate total value
    }
  },
  
  // Step 3: Add Cash
  addCash: {
    handleCashInput: (amount) => {
      // Set cash amount
      // Recalculate total value
    }
  },
  
  // Step 4: Submit Trade
  submitTrade: async () => {
    // Validate offer
    // Create proposal
    // Set expiration
    // Send notification
    // Close modal
  }
};
```

### 4. Response Management Implementation

#### Response Modal Component
```javascript
const responseModalComponent = {
  // Response Features
  responseFeatures: {
    viewOffer: "View offer details",
    addMessage: "Add response message",
    acceptOffer: "Accept offer",
    declineOffer: "Decline offer"
  },
  
  // Response Actions
  responseActions: {
    handleAccept: async (offerId, message) => {
      // Update status
      // Add message
      // Send notification
      // Update UI
    },
    
    handleDecline: async (offerId, message) => {
      // Update status
      // Add message
      // Send notification
      // Update UI
    }
  }
};
```

#### Response Workflow
```javascript
const responseWorkflow = {
  // Response Process
  responseProcess: {
    viewOffer: "Display offer details",
    reviewItems: "Show offered items and cash",
    addMessage: "Add response message",
    chooseAction: "Accept or decline",
    submitResponse: "Submit response"
  },
  
  // Status Updates
  statusUpdates: {
    updateStatus: "Update proposal status",
    addResponse: "Add response message",
    sendNotification: "Send notification to proposer",
    refreshData: "Refresh offer data"
  }
};
```

### 5. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    itemSelection: "Touch-friendly item selection",
    modalNavigation: "Swipe to close modals",
    tabSwitching: "Swipe between tabs",
    gestureSupport: "Native gesture support"
  },
  
  // Performance
  performance: {
    imageOptimization: "Optimize item images for mobile",
    lazyLoading: "Load images on demand",
    caching: "Cache offer data locally",
    offline: "Handle offline scenarios"
  },
  
  // Mobile Features
  mobileFeatures: {
    pushNotifications: "Push notifications for new offers",
    backgroundRefresh: "Refresh data in background",
    gestureNavigation: "Swipe and touch gestures",
    orientation: "Handle orientation changes"
  }
};
```

#### Mobile UI/UX
```javascript
const mobileUIUX = {
  // Responsive Design
  responsiveDesign: {
    mobileFirst: "Mobile-first design approach",
    touchFriendly: "Touch-friendly controls",
    readableText: "Readable text sizes",
    accessibleButtons: "Accessible button sizes"
  },
  
  // Navigation
  navigation: {
    tabNavigation: "Easy tab switching",
    modalNavigation: "Smooth modal transitions",
    backNavigation: "Intuitive back navigation",
    gestureNavigation: "Gesture-based navigation"
  }
};
```

### 6. Real-Time Updates

#### Real-Time System
```javascript
const realTimeSystem = {
  // WebSocket Integration
  webSocketIntegration: {
    connect: "Connect to WebSocket",
    subscribe: "Subscribe to offer updates",
    handleUpdates: "Handle real-time updates",
    disconnect: "Disconnect from WebSocket"
  },
  
  // Update Types
  updateTypes: {
    newOffer: "New trade offer received",
    offerAccepted: "Trade offer accepted",
    offerDeclined: "Trade offer declined",
    offerExpired: "Trade offer expired"
  }
};
```

#### Notification System
```javascript
const notificationSystem = {
  // Notification Types
  notificationTypes: {
    newOffer: "New trade offer notification",
    offerAccepted: "Offer accepted notification",
    offerDeclined: "Offer declined notification",
    offerExpired: "Offer expired notification"
  },
  
  // Notification Delivery
  notificationDelivery: {
    pushNotifications: "Push notifications for mobile",
    inAppNotifications: "In-app notification system",
    emailNotifications: "Email notifications",
    smsNotifications: "SMS notifications (optional)"
  }
};
```

## Configuration Options

### 1. Trade Proposal Configuration

#### Proposal Settings
```javascript
const proposalSettings = {
  // Required Fields
  requiredFields: {
    target_item_id: "Target item ID (required)",
    proposer_user_id: "Proposer user ID (required)",
    target_user_id: "Target user ID (required)",
    offered_items: "Offered items array (required if no cash)",
    cash_amount: "Cash amount (required if no items)"
  },
  
  // Optional Fields
  optionalFields: {
    message: "Personal message",
    response_message: "Response message"
  },
  
  // Validation Rules
  validationRules: {
    itemsOrCash: "At least one item or cash amount required",
    positiveCash: "Cash amount must be positive",
    validItems: "All offered items must be active",
    messageLength: "Message max 500 characters"
  }
};
```

#### Expiration Settings
```javascript
const expirationSettings = {
  // Expiration Configuration
  expirationConfiguration: {
    duration: "60 minutes from creation",
    warningTime: "10 minutes before expiration",
    autoExpire: "Automatic expiration handling",
    extendExpiration: "Allow extending expiration"
  },
  
  // Expiration Display
  expirationDisplay: {
    showTimeRemaining: true,
    showExpirationWarning: true,
    showExpiredStatus: true,
    formatTimeRemaining: "X minutes remaining"
  }
};
```

### 2. Status Configuration

#### Status Settings
```javascript
const statusSettings = {
  // Status Types
  statusTypes: {
    pending: "Awaiting response",
    accepted: "Offer accepted",
    declined: "Offer declined",
    counter_offered: "Counter offer made",
    completed: "Trade completed",
    cancelled: "Offer cancelled"
  },
  
  // Status Colors
  statusColors: {
    pending: "yellow",
    accepted: "green",
    declined: "red",
    counter_offered: "purple",
    completed: "blue",
    cancelled: "gray"
  }
};
```

#### Status Transitions
```javascript
const statusTransitions = {
  // Valid Transitions
  validTransitions: {
    pending: ["accepted", "declined", "counter_offered", "cancelled"],
    accepted: ["completed"],
    declined: [],
    counter_offered: ["accepted", "declined", "cancelled"],
    completed: [],
    cancelled: []
  },
  
  // Status Actions
  statusActions: {
    accept: "Accept offer",
    decline: "Decline offer",
    counterOffer: "Make counter offer",
    complete: "Complete trade",
    cancel: "Cancel offer"
  }
};
```

### 3. Mobile Configuration

#### Mobile Features
```javascript
const mobileFeatures = {
  // Touch Interactions
  touchInteractions: {
    swipeTabs: "Swipe between tabs",
    swipeModals: "Swipe to close modals",
    touchSelection: "Touch item selection",
    gestureNavigation: "Gesture-based navigation"
  },
  
  // Performance
  performance: {
    imageOptimization: "Optimize images for mobile",
    lazyLoading: "Load content on demand",
    caching: "Cache data locally",
    offline: "Handle offline scenarios"
  }
};
```

#### Mobile UI/UX
```javascript
const mobileUIUX = {
  // Responsive Design
  responsiveDesign: {
    mobileFirst: "Mobile-first approach",
    touchFriendly: "Touch-friendly controls",
    readableText: "Readable text sizes",
    accessibleButtons: "Accessible button sizes"
  },
  
  // Navigation
  navigation: {
    tabNavigation: "Easy tab switching",
    modalNavigation: "Smooth transitions",
    backNavigation: "Intuitive back navigation",
    gestureNavigation: "Gesture-based navigation"
  }
};
```

### 4. Notification Configuration

#### Notification Settings
```javascript
const notificationSettings = {
  // Notification Types
  notificationTypes: {
    newOffer: "New trade offer",
    offerAccepted: "Offer accepted",
    offerDeclined: "Offer declined",
    offerExpired: "Offer expired"
  },
  
  // Delivery Methods
  deliveryMethods: {
    pushNotifications: "Push notifications",
    inAppNotifications: "In-app notifications",
    emailNotifications: "Email notifications",
    smsNotifications: "SMS notifications"
  }
};
```

#### Notification Content
```javascript
const notificationContent = {
  // New Offer Notification
  newOfferNotification: {
    title: "New Trade Offer",
    body: "You received a new trade offer for {item_title}",
    action: "View Offer"
  },
  
  // Offer Accepted Notification
  offerAcceptedNotification: {
    title: "Trade Offer Accepted",
    body: "Your trade offer for {item_title} has been accepted",
    action: "View Details"
  }
};
```

This comprehensive Trade Offers page configuration provides everything needed for a complete mobile app implementation, including trade proposal management, offer creation, response handling, status tracking, and mobile-specific optimizations! 🚀
