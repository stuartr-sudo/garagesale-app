# Settings Configuration System for Mobile App

This document outlines the complete settings configuration system for the garage sale app, including user roles, upsell settings, AI agent configuration, and collection details.

## User Role System

### 1. Account Types

#### Individual (Buyer)
- **Primary Role**: Browse, purchase, negotiate
- **Features**: Cart management, AI chat, recommendations
- **Settings**: Personal preferences, notification settings

#### Seller (Business)
- **Primary Role**: List items, manage inventory, configure AI agent
- **Features**: AI negotiation settings, special offers, bundle creation
- **Settings**: Business preferences, collection details, upsell configuration

### 2. User Roles Hierarchy
```sql
-- Database schema
profiles (
  id UUID PRIMARY KEY,
  account_type TEXT CHECK (account_type IN ('individual', 'seller')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  negotiation_aggressiveness TEXT DEFAULT 'balanced' 
    CHECK (negotiation_aggressiveness IN ('passive', 'balanced', 'aggressive', 'very_aggressive'))
)
```

## Settings Page Configuration

### 1. Individual (Buyer) Settings

#### Personal Information
```javascript
const buyerSettings = {
  // Basic Info
  full_name: "string",
  email: "string",
  phone: "string",
  location: "string",
  
  // Preferences
  notification_preferences: {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false
  },
  
  // Shopping Preferences
  shopping_preferences: {
    preferred_categories: ["electronics", "furniture"],
    price_range: { min: 0, max: 1000 },
    location_radius: 25, // miles
    show_negotiated_prices: true
  },
  
  // Privacy Settings
  privacy_settings: {
    profile_visibility: "public", // public, friends, private
    show_purchase_history: false,
    allow_recommendations: true
  }
};
```

#### Buyer-Specific Features
- **Recommendation Preferences**: Category preferences, price ranges
- **Notification Settings**: Purchase updates, new items, price drops
- **Privacy Controls**: Profile visibility, purchase history
- **Location Settings**: Delivery radius, pickup preferences

### 2. Seller (Business) Settings

#### Business Information
```javascript
const sellerSettings = {
  // Business Details
  business_name: "string",
  business_type: "individual", // individual, business, charity
  abn: "string", // Australian Business Number
  business_address: "string",
  business_phone: "string",
  
  // Collection & Delivery
  collection_details: {
    collection_address: "string",
    collection_hours: "9am-5pm Mon-Fri",
    collection_instructions: "string",
    delivery_available: true,
    delivery_radius: 50, // km
    delivery_fee: 10.00
  },
  
  // AI Agent Configuration
  ai_agent_settings: {
    negotiation_aggressiveness: "balanced", // passive, balanced, aggressive, very_aggressive
    auto_accept_threshold: 5, // % below asking price
    minimum_price_required: true,
    agent_personality: "friendly", // friendly, professional, casual
    response_delay: 2000 // milliseconds
  },
  
  // Upsell Configuration
  upsell_settings: {
    enable_upsells: true,
    upsell_aggressiveness: "moderate", // low, moderate, high
    max_upsell_items: 3,
    upsell_categories: ["accessories", "related_items"],
    upsell_price_range: { min: 10, max: 200 }
  },
  
  // Special Offers
  offer_settings: {
    enable_bogo: true,
    enable_bulk_discounts: true,
    enable_bundle_deals: true,
    default_discount_percentage: 10,
    minimum_items_for_bulk: 3
  }
};
```

## AI Agent Configuration

### 1. Negotiation Aggressiveness Levels

#### Passive (`negotiation_aggressiveness: 'passive'`)
```javascript
const passiveSettings = {
  tone: "Warm and friendly, encouraging, flexible",
  counter_percentages: {
    ">40% below asking": 0.50, // 50% toward asking
    ">20% below asking": 0.40, // 40% toward asking
    "otherwise": 0.30 // 30% toward asking
  },
  auto_accept_threshold: 8, // % below asking price
  use_case: "Quick sales, low-value items, clearance"
};
```

#### Balanced (`negotiation_aggressiveness: 'balanced'`)
```javascript
const balancedSettings = {
  tone: "Friendly but firm, emphasizes value",
  counter_percentages: {
    ">40% below asking": 0.60,
    ">20% below asking": 0.45,
    "otherwise": 0.35
  },
  auto_accept_threshold: 5,
  use_case: "Most sellers, standard marketplace"
};
```

#### Aggressive (`negotiation_aggressiveness: 'aggressive'`)
```javascript
const aggressiveSettings = {
  tone: "Confident and firm, emphasizes exceptional value",
  counter_percentages: {
    ">40% below asking": 0.75,
    ">20% below asking": 0.60,
    "otherwise": 0.45
  },
  auto_accept_threshold: 3,
  use_case: "High-value items, premium products"
};
```

#### Very Aggressive (`negotiation_aggressiveness: 'very_aggressive'`)
```javascript
const veryAggressiveSettings = {
  tone: "Very confident, premium item positioning",
  counter_percentages: {
    ">40% below asking": 0.85,
    ">20% below asking": 0.75,
    "otherwise": 0.60
  },
  auto_accept_threshold: 2,
  use_case: "Luxury items, rare collectibles, maximum value"
};
```

### 2. AI Agent Advanced Settings

#### Response Configuration
```javascript
const aiAgentSettings = {
  // Response Timing
  response_delay: {
    min: 1000, // 1 second
    max: 5000, // 5 seconds
    random: true
  },
  
  // Personality Settings
  personality: {
    tone: "friendly", // friendly, professional, casual
    formality: "medium", // low, medium, high
    enthusiasm: "moderate", // low, moderate, high
    humor: false
  },
  
  // Negotiation Behavior
  negotiation_behavior: {
    max_rounds: 3,
    final_offer_warning: true,
    expiration_time: 600, // 10 minutes
    follow_up_messages: true
  },
  
  // Knowledge Base
  knowledge_settings: {
    use_item_description: true,
    use_voice_transcription: true,
    use_seller_notes: true,
    include_condition_details: true
  }
};
```

## Upsell Configuration System

### 1. Upsell Settings

#### Basic Upsell Configuration
```javascript
const upsellSettings = {
  // Enable/Disable
  enable_upsells: true,
  upsell_aggressiveness: "moderate", // low, moderate, high
  
  // Content Limits
  max_upsell_items: 3,
  max_upsell_value: 200, // dollars
  
  // Targeting
  upsell_categories: ["accessories", "related_items", "complementary"],
  upsell_price_range: { min: 10, max: 200 },
  
  // Timing
  show_upsells_after: "cart_view", // item_view, cart_view, checkout
  upsell_display_duration: 30, // seconds
  max_upsell_attempts: 2
};
```

#### Upsell Algorithms
```javascript
const upsellAlgorithms = {
  // 1. Similar Items Algorithm
  similar_items: {
    enabled: true,
    weight: 0.3,
    criteria: {
      same_category: true,
      price_range: 0.5, // ±50% of original price
      same_seller: false
    }
  },
  
  // 2. Complementary Items Algorithm
  complementary_items: {
    enabled: true,
    weight: 0.4,
    criteria: {
      related_categories: true,
      price_range: 0.3,
      bundle_potential: true
    }
  },
  
  // 3. Trending Items Algorithm
  trending_items: {
    enabled: true,
    weight: 0.2,
    criteria: {
      recent_views: true,
      popularity_score: 0.7,
      time_decay: 7 // days
    }
  },
  
  // 4. Seller Items Algorithm
  seller_items: {
    enabled: true,
    weight: 0.1,
    criteria: {
      same_seller: true,
      price_range: 0.4,
      availability: true
    }
  }
};
```

### 2. Agentic Upsells (AI-Powered)

#### AI Upsell Configuration
```javascript
const agenticUpsellSettings = {
  // AI Upsell Features
  enable_ai_upsells: true,
  ai_upsell_style: "conversational", // conversational, direct, subtle
  
  // AI Upsell Triggers
  triggers: {
    cart_value_threshold: 100,
    item_category: ["electronics", "furniture"],
    user_behavior: "browsing", // browsing, negotiating, purchasing
    time_on_site: 300 // seconds
  },
  
  // AI Upsell Content
  content_generation: {
    use_item_analysis: true,
    use_user_history: true,
    use_market_trends: true,
    personalize_messages: true
  },
  
  // AI Upsell Timing
  timing: {
    delay_after_cart_add: 5, // seconds
    max_upsell_frequency: 2, // per session
    cooldown_period: 300 // seconds
  }
};
```

## Collection & Delivery Settings

### 1. Collection Details

#### Collection Configuration
```javascript
const collectionSettings = {
  // Collection Address
  collection_address: {
    street: "string",
    suburb: "string",
    state: "string",
    postcode: "string",
    country: "Australia"
  },
  
  // Collection Hours
  collection_hours: {
    monday: { start: "09:00", end: "17:00", available: true },
    tuesday: { start: "09:00", end: "17:00", available: true },
    wednesday: { start: "09:00", end: "17:00", available: true },
    thursday: { start: "09:00", end: "17:00", available: true },
    friday: { start: "09:00", end: "17:00", available: true },
    saturday: { start: "10:00", end: "16:00", available: true },
    sunday: { start: "10:00", end: "16:00", available: false }
  },
  
  // Collection Instructions
  collection_instructions: {
    access_instructions: "Ring doorbell, side gate access",
    parking_info: "Street parking available",
    contact_method: "Call when arriving",
    special_requirements: "ID required for collection"
  },
  
  // Collection Policies
  collection_policies: {
    max_hold_days: 7,
    reminder_schedule: [1, 3, 6], // days before expiry
    auto_cancel_after: 7, // days
    reschedule_allowed: true,
    max_reschedules: 2
  }
};
```

### 2. Delivery Settings

#### Delivery Configuration
```javascript
const deliverySettings = {
  // Delivery Availability
  delivery_available: true,
  delivery_radius: 50, // km
  delivery_fee: 15.00,
  free_delivery_threshold: 100.00,
  
  // Delivery Areas
  delivery_areas: [
    { suburb: "Melbourne CBD", fee: 10.00, available: true },
    { suburb: "Richmond", fee: 15.00, available: true },
    { suburb: "Fitzroy", fee: 15.00, available: true }
  ],
  
  // Delivery Schedule
  delivery_schedule: {
    same_day: false,
    next_day: true,
    weekend_delivery: true,
    delivery_hours: "9am-5pm"
  },
  
  // Delivery Instructions
  delivery_instructions: {
    contact_before_delivery: true,
    leave_at_door: false,
    signature_required: true,
    photo_confirmation: true
  }
};
```

## Special Offers Configuration

### 1. Offer Types Configuration

#### BOGO (Buy One Get One) Settings
```javascript
const bogoSettings = {
  enabled: true,
  default_config: {
    buy_quantity: 1,
    get_quantity: 1,
    discount_percent: 100, // 100% = free
    max_applications: 1
  },
  restrictions: {
    min_item_value: 20.00,
    max_item_value: 500.00,
    excluded_categories: ["free_items"]
  }
};
```

#### Bulk Discount Settings
```javascript
const bulkDiscountSettings = {
  enabled: true,
  default_config: {
    min_quantity: 3,
    discount_percent: 10,
    max_discount_percent: 50
  },
  restrictions: {
    min_total_value: 50.00,
    max_discount_amount: 100.00
  }
};
```

#### Bundle Deal Settings
```javascript
const bundleSettings = {
  enabled: true,
  default_config: {
    min_items: 2,
    max_items: 10,
    min_savings_percent: 10,
    max_savings_percent: 40
  },
  restrictions: {
    same_seller_only: true,
    min_bundle_value: 50.00,
    max_bundle_value: 1000.00
  }
};
```

## Edge Version Configuration

### 1. Feature Flags

#### Edge Features
```javascript
const edgeFeatures = {
  // AI Features
  ai_negotiation: true,
  ai_upsells: true,
  ai_recommendations: true,
  voice_analysis: true,
  
  // Advanced Features
  bundle_creation: true,
  special_offers: true,
  bulk_discounts: true,
  real_time_chat: true,
  
  // Analytics Features
  advanced_analytics: true,
  user_behavior_tracking: true,
  conversion_optimization: true,
  a_b_testing: true
};
```

### 2. Performance Settings

#### Edge Performance Configuration
```javascript
const edgePerformanceSettings = {
  // Caching
  cache_settings: {
    enable_caching: true,
    cache_duration: 300, // seconds
    cache_strategy: "lru" // lru, fifo, ttl
  },
  
  // Real-time Updates
  realtime_settings: {
    enable_realtime: true,
    update_frequency: 1000, // milliseconds
    max_connections: 1000
  },
  
  // API Optimization
  api_settings: {
    request_timeout: 5000, // milliseconds
    retry_attempts: 3,
    rate_limiting: true,
    max_requests_per_minute: 100
  }
};
```

## Mobile App Implementation

### 1. Settings Page Structure

#### Settings Navigation
```javascript
const settingsStructure = {
  // Individual (Buyer) Settings
  individual: [
    {
      section: "Personal Information",
      items: ["name", "email", "phone", "location"]
    },
    {
      section: "Preferences",
      items: ["notifications", "categories", "price_range"]
    },
    {
      section: "Privacy",
      items: ["profile_visibility", "data_sharing", "purchase_history"]
    }
  ],
  
  // Seller Settings
  seller: [
    {
      section: "Business Information",
      items: ["business_name", "abn", "address", "contact"]
    },
    {
      section: "AI Agent",
      items: ["negotiation_style", "auto_accept", "response_timing"]
    },
    {
      section: "Upsells",
      items: ["enable_upsells", "upsell_style", "recommendation_algorithms"]
    },
    {
      section: "Collection & Delivery",
      items: ["collection_address", "delivery_settings", "collection_hours"]
    },
    {
      section: "Special Offers",
      items: ["bogo_settings", "bulk_discounts", "bundle_deals"]
    }
  ]
};
```

### 2. Settings API Endpoints

#### Settings Management
```javascript
// Get user settings
GET /api/settings
Response: {
  user_type: "individual" | "seller",
  settings: { ... },
  features: { ... }
}

// Update settings
PUT /api/settings
Body: {
  section: "ai_agent",
  settings: {
    negotiation_aggressiveness: "balanced",
    auto_accept_threshold: 5
  }
}

// Get available features
GET /api/settings/features
Response: {
  edge_features: { ... },
  available_algorithms: [ ... ],
  upsell_options: { ... }
}
```

This comprehensive settings system provides complete configuration control for both buyers and sellers, with advanced AI agent settings, upsell configuration, and collection management tailored to each user type.
