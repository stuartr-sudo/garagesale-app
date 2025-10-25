# Donations Page Configuration for Mobile App

This document provides comprehensive information about the "Donations" page functionality, including all features, Stripe payment integration, donation processing, and mobile-specific optimizations for the donation system.

## Overview

The Donations page is a comprehensive donation system that allows users to support the platform through monetary contributions. It features preset donation amounts, custom amount input, donor information collection, Stripe payment processing, and seamless integration with the platform's payment infrastructure.

## Core Features

### 1. Donation Interface

#### Page Layout
```javascript
const donationsPageLayout = {
  // Header Section
  header: {
    icon: "Heart (pink gradient)",
    title: "Support GarageSale",
    description: "Help us keep the community marketplace thriving! Your donations support platform development, community events, and keeping GarageSale free for everyone."
  },
  
  // Two-Column Layout
  layout: {
    leftColumn: "Donation Impact Information",
    rightColumn: "Donation Form"
  }
};
```

#### Visual Design
```javascript
const visualDesign = {
  // Color Scheme
  colors: {
    primary: "Pink to Fuchsia gradient",
    accent: "Pink-400",
    background: "Slate-950",
    text: "Gray-200",
    cards: "Gray-900/80 with backdrop blur"
  },
  
  // Icons and Graphics
  icons: {
    heart: "Pink gradient heart icon",
    gift: "Gift icon for donation form",
    dollar: "Dollar sign for amounts",
    users: "Users icon for community"
  }
};
```

### 2. Donation Amount System

#### Preset Amounts
```javascript
const donationAmounts = {
  // Preset Amounts
  presetAmounts: [10, 25, 50, 100, 250, 500],
  
  // Amount Selection
  amountSelection: {
    presetButtons: "Quick selection buttons",
    customInput: "Custom amount input field",
    minimumAmount: "$5 minimum donation",
    validation: "Amount validation and error handling"
  }
};
```

#### Amount Selection Logic
```javascript
const amountSelectionLogic = {
  // Selection State
  selectionState: {
    selectedAmount: "Currently selected amount",
    customAmount: "Custom amount input value",
    isCustom: "Boolean for custom amount mode"
  },
  
  // Selection Process
  selectionProcess: {
    handlePresetSelection: (amount) => {
      // Set selected amount
      // Clear custom amount
      // Update UI
    },
    
    handleCustomSelection: () => {
      // Set custom mode
      // Clear preset selection
      // Focus custom input
    },
    
    handleCustomInput: (value) => {
      // Update custom amount
      // Validate input
      // Update total display
    }
  }
};
```

### 3. Donor Information Collection

#### Donor Information Form
```javascript
const donorInformationForm = {
  // Required Fields
  requiredFields: {
    email: "Email address (required)",
    name: "Full name (optional)",
    message: "Support message (optional)"
  },
  
  // Form Validation
  validation: {
    email: "Valid email format required",
    amount: "Minimum $5 donation required",
    message: "Optional message up to 500 characters"
  }
};
```

#### Form State Management
```javascript
const formStateManagement = {
  // Form State
  formState: {
    donorInfo: {
      name: "string",
      email: "string", 
      message: "string"
    },
    selectedAmount: "number or 'custom'",
    customAmount: "string",
    isProcessing: "boolean"
  },
  
  // Form Updates
  formUpdates: {
    updateDonorInfo: (field, value) => {
      // Update specific donor info field
      // Validate field
      // Update form state
    },
    
    updateAmount: (amount) => {
      // Update selected amount
      // Clear custom amount if preset
      // Update total display
    }
  }
};
```

### 4. Stripe Payment Integration

#### Stripe Configuration
```javascript
const stripeConfiguration = {
  // Environment Variables
  environmentVariables: {
    STRIPE_SECRET_KEY: "sk_test_... (test) or sk_live_... (production)",
    STRIPE_PUBLISHABLE_KEY: "pk_test_... (test) or pk_live_... (production)",
    STRIPE_WEBHOOK_SECRET: "whsec_... (for webhook verification)"
  },
  
  // Stripe Setup
  stripeSetup: {
    testMode: "Use test keys for development",
    productionMode: "Use live keys for production",
    webhookEndpoint: "https://yourdomain.com/api/stripe/webhook"
  }
};
```

#### Stripe API Integration
```javascript
const stripeAPIIntegration = {
  // Payment Intent Creation
  paymentIntentCreation: {
    endpoint: "/api/stripe/create-payment-intent",
    method: "POST",
    body: {
      amount: "number (in cents)",
      currency: "string (default: 'aud')",
      itemId: "string (optional for donations)"
    },
    response: {
      clientSecret: "string",
      paymentIntent: {
        id: "string",
        amount: "number",
        currency: "string",
        status: "string"
      }
    }
  },
  
  // Checkout Session Creation
  checkoutSessionCreation: {
    endpoint: "/api/stripe/create-checkout-session",
    method: "POST",
    body: {
      amount: "number",
      currency: "string",
      donorInfo: "object",
      successUrl: "string",
      cancelUrl: "string"
    },
    response: {
      sessionId: "string",
      url: "string (redirect URL)"
    }
  }
};
```

### 5. Donation Processing

#### Donation Flow
```javascript
const donationFlow = {
  // Step 1: Amount Selection
  amountSelection: {
    selectPreset: "Select from preset amounts",
    selectCustom: "Enter custom amount",
    validateAmount: "Ensure minimum $5 donation"
  },
  
  // Step 2: Donor Information
  donorInformation: {
    collectEmail: "Collect email address",
    collectName: "Collect name (optional)",
    collectMessage: "Collect support message (optional)"
  },
  
  // Step 3: Payment Processing
  paymentProcessing: {
    createSession: "Create Stripe checkout session",
    redirectToStripe: "Redirect to Stripe checkout",
    processPayment: "Handle payment completion",
    sendReceipt: "Send email receipt"
  }
};
```

#### Donation Processing Logic
```javascript
const donationProcessingLogic = {
  // Validation
  validation: {
    validateAmount: (amount) => {
      // Check minimum $5 donation
      // Ensure valid number
      // Return validation result
    },
    
    validateEmail: (email) => {
      // Check email format
      // Ensure email is provided
      // Return validation result
    }
  },
  
  // Processing
  processing: {
    handleDonation: async () => {
      // Validate amount and email
      // Create donation session
      // Redirect to Stripe
      // Handle errors
    },
    
    processDonation: async (sessionData) => {
      // Create donation record
      // Send confirmation email
      // Update donor information
      // Handle success/error
    }
  }
};
```

### 6. Impact Information Display

#### Impact Categories
```javascript
const impactCategories = {
  // Platform Development
  platformDevelopment: {
    icon: "💻",
    title: "Platform Development",
    description: "Help us build new features and improve the platform"
  },
  
  // Community Events
  communityEvents: {
    icon: "🎉",
    title: "Community Events",
    description: "Support local meetups and community gatherings"
  },
  
  // Free Access
  freeAccess: {
    icon: "🆓",
    title: "Free Access",
    description: "Keep the platform free for everyone to use"
  },
  
  // Mobile App
  mobileApp: {
    icon: "📱",
    title: "Mobile App",
    description: "Help us build a dedicated mobile app"
  }
};
```

#### Impact Display
```javascript
const impactDisplay = {
  // Impact Cards
  impactCards: {
    layout: "Grid layout with icons and descriptions",
    styling: "Gray-800/50 background with rounded corners",
    content: "Icon, title, and description for each impact area"
  },
  
  // Visual Elements
  visualElements: {
    icons: "Emoji icons for each category",
    colors: "Consistent color scheme",
    spacing: "Proper spacing and alignment"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const donationsPageState = {
  // Form State
  formState: {
    customAmount: "string",
    selectedAmount: "number",
    donorInfo: {
      name: "string",
      email: "string",
      message: "string"
    },
    isProcessing: "boolean"
  },
  
  // UI State
  uiState: {
    showCustomInput: "boolean",
    validationErrors: "object",
    processingStatus: "string"
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Form Updates
  formUpdates: {
    updateCustomAmount: (amount) => {
      // Update custom amount
      // Clear selected amount
      // Update UI
    },
    
    updateSelectedAmount: (amount) => {
      // Update selected amount
      // Clear custom amount
      // Update UI
    },
    
    updateDonorInfo: (field, value) => {
      // Update donor info field
      // Validate field
      // Update form state
    }
  },
  
  // Validation
  validation: {
    validateForm: () => {
      // Check amount validity
      // Check email validity
      // Return validation result
    },
    
    clearErrors: () => {
      // Clear validation errors
      // Reset error state
    }
  }
};
```

### 2. Donation Form Implementation

#### Form Component
```javascript
const donationFormComponent = {
  // Form Fields
  formFields: {
    amountSelection: "Preset amounts and custom input",
    donorInfo: "Name, email, and message fields",
    submitButton: "Donation button with processing state"
  },
  
  // Form Validation
  formValidation: {
    amountValidation: "Minimum $5 donation",
    emailValidation: "Valid email format",
    messageValidation: "Optional message length"
  }
};
```

#### Form Submission
```javascript
const formSubmission = {
  // Submission Process
  submissionProcess: {
    validateForm: "Validate all form fields",
    createSession: "Create Stripe checkout session",
    redirectToStripe: "Redirect to Stripe checkout",
    handleErrors: "Handle and display errors"
  },
  
  // Error Handling
  errorHandling: {
    validationErrors: "Display field validation errors",
    networkErrors: "Handle network and API errors",
    stripeErrors: "Handle Stripe-specific errors"
  }
};
```

### 3. Stripe Integration Implementation

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
  
  // API Endpoints
  apiEndpoints: {
    createPaymentIntent: "/api/stripe/create-payment-intent",
    createCheckoutSession: "/api/stripe/create-checkout-session",
    webhookHandler: "/api/stripe/webhook"
  }
};
```

#### Stripe API Calls
```javascript
const stripeAPICalls = {
  // Create Donation Session
  createDonationSession: async (donationData) => {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: donationData.amount,
        currency: 'aud',
        donorInfo: donationData.donorInfo,
        successUrl: `${window.location.origin}/donation-success`,
        cancelUrl: `${window.location.origin}/donations`
      })
    });
    
    const data = await response.json();
    return data;
  },
  
  // Handle Stripe Response
  handleStripeResponse: (response) => {
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    if (response.checkout_url) {
      window.location.href = response.checkout_url;
    }
  }
};
```

### 4. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    amountButtons: "Touch-friendly amount selection",
    formInputs: "Mobile-optimized form inputs",
    submitButton: "Large, accessible submit button"
  },
  
  // Performance
  performance: {
    imageOptimization: "Optimize images for mobile",
    lazyLoading: "Load content on demand",
    caching: "Cache donation data locally"
  },
  
  // Mobile Features
  mobileFeatures: {
    pushNotifications: "Push notifications for donation confirmations",
    backgroundRefresh: "Refresh data in background",
    gestureNavigation: "Swipe and touch gestures"
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
    backNavigation: "Intuitive back navigation",
    gestureNavigation: "Gesture-based navigation",
    modalNavigation: "Smooth modal transitions"
  }
};
```

### 5. Payment Processing

#### Payment Flow
```javascript
const paymentFlow = {
  // Payment Steps
  paymentSteps: {
    step1: "Select donation amount",
    step2: "Enter donor information",
    step3: "Create Stripe session",
    step4: "Redirect to Stripe checkout",
    step5: "Process payment",
    step6: "Send confirmation"
  },
  
  // Payment States
  paymentStates: {
    idle: "Ready for donation",
    processing: "Creating payment session",
    redirecting: "Redirecting to Stripe",
    completed: "Payment completed",
    failed: "Payment failed"
  }
};
```

#### Payment Handling
```javascript
const paymentHandling = {
  // Success Handling
  successHandling: {
    redirectToSuccess: "Redirect to success page",
    sendConfirmation: "Send email confirmation",
    updateDatabase: "Update donation records",
    showThankYou: "Display thank you message"
  },
  
  // Error Handling
  errorHandling: {
    validationErrors: "Show validation errors",
    networkErrors: "Handle network issues",
    stripeErrors: "Handle Stripe errors",
    retryLogic: "Allow retry on failure"
  }
};
```

## Stripe Integration Details

### 1. Stripe Account Setup

#### Account Configuration
```javascript
const stripeAccountSetup = {
  // Account Types
  accountTypes: {
    standard: "Standard Stripe account",
    express: "Express account for faster setup",
    custom: "Custom account for advanced features"
  },
  
  // Required Information
  requiredInformation: {
    businessType: "Individual or business",
    businessName: "Legal business name",
    taxId: "Tax identification number",
    bankAccount: "Bank account for payouts",
    address: "Business address"
  }
};
```

#### API Keys Setup
```javascript
const apiKeysSetup = {
  // Test Keys
  testKeys: {
    publishableKey: "pk_test_...",
    secretKey: "sk_test_...",
    webhookSecret: "whsec_..."
  },
  
  // Live Keys
  liveKeys: {
    publishableKey: "pk_live_...",
    secretKey: "sk_live_...",
    webhookSecret: "whsec_..."
  },
  
  // Key Management
  keyManagement: {
    rotation: "Regular key rotation",
    security: "Secure key storage",
    access: "Limited access to keys"
  }
};
```

### 2. Stripe API Implementation

#### Payment Intent Creation
```javascript
const paymentIntentCreation = {
  // API Endpoint
  endpoint: "/api/stripe/create-payment-intent",
  
  // Request Body
  requestBody: {
    amount: "number (in cents)",
    currency: "string (default: 'aud')",
    metadata: {
      donationType: "platform_support",
      donorEmail: "string",
      donorName: "string"
    }
  },
  
  // Response
  response: {
    clientSecret: "string",
    paymentIntent: {
      id: "string",
      amount: "number",
      currency: "string",
      status: "string"
    }
  }
};
```

#### Checkout Session Creation
```javascript
const checkoutSessionCreation = {
  // API Endpoint
  endpoint: "/api/stripe/create-checkout-session",
  
  // Request Body
  requestBody: {
    amount: "number (in cents)",
    currency: "string",
    successUrl: "string",
    cancelUrl: "string",
    metadata: {
      donationType: "platform_support",
      donorEmail: "string",
      donorName: "string",
      donorMessage: "string"
    }
  },
  
  // Response
  response: {
    sessionId: "string",
    url: "string (redirect URL)"
  }
};
```

### 3. Webhook Implementation

#### Webhook Configuration
```javascript
const webhookConfiguration = {
  // Webhook Endpoint
  endpoint: "/api/stripe/webhook",
  
  // Required Events
  requiredEvents: [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "checkout.session.completed",
    "checkout.session.expired"
  ],
  
  // Webhook Security
  webhookSecurity: {
    signatureVerification: "Verify webhook signatures",
    eventValidation: "Validate event data",
    idempotency: "Handle duplicate events"
  }
};
```

#### Webhook Handler
```javascript
const webhookHandler = {
  // Event Processing
  eventProcessing: {
    paymentIntentSucceeded: async (event) => {
      // Update donation status
      // Send confirmation email
      // Update donor records
      // Handle success
    },
    
    paymentIntentFailed: async (event) => {
      // Update donation status
      // Send failure notification
      // Handle failure
    },
    
    checkoutSessionCompleted: async (event) => {
      // Process completed donation
      // Send receipt
      // Update database
    }
  },
  
  // Error Handling
  errorHandling: {
    signatureVerification: "Verify webhook signatures",
    eventValidation: "Validate event data",
    errorLogging: "Log webhook errors",
    retryLogic: "Handle retry scenarios"
  }
};
```

### 4. Database Integration

#### Donation Records
```javascript
const donationRecords = {
  // Database Schema
  databaseSchema: {
    donations: {
      id: "UUID primary key",
      amount: "decimal (in cents)",
      currency: "string",
      donor_email: "string",
      donor_name: "string",
      donor_message: "string",
      stripe_payment_intent_id: "string",
      stripe_session_id: "string",
      status: "enum (pending, completed, failed)",
      created_at: "timestamp",
      updated_at: "timestamp"
    }
  },
  
  // Record Operations
  recordOperations: {
    createDonation: "Create new donation record",
    updateStatus: "Update donation status",
    getDonation: "Retrieve donation by ID",
    listDonations: "List donations with filters"
  }
};
```

#### Database Queries
```javascript
const databaseQueries = {
  // Create Donation
  createDonation: async (donationData) => {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        amount: donationData.amount,
        currency: donationData.currency,
        donor_email: donationData.donorEmail,
        donor_name: donationData.donorName,
        donor_message: donationData.donorMessage,
        stripe_payment_intent_id: donationData.paymentIntentId,
        stripe_session_id: donationData.sessionId,
        status: 'pending'
      })
      .select();
    
    return { data, error };
  },
  
  // Update Status
  updateStatus: async (donationId, status) => {
    const { data, error } = await supabase
      .from('donations')
      .update({ status })
      .eq('id', donationId)
      .select();
    
    return { data, error };
  }
};
```

### 5. Email Integration

#### Email Templates
```javascript
const emailTemplates = {
  // Donation Confirmation
  donationConfirmation: {
    subject: "Thank you for your donation to GarageSale",
    template: "donation-confirmation.html",
    variables: {
      donorName: "string",
      amount: "number",
      currency: "string",
      donationDate: "date"
    }
  },
  
  // Donation Receipt
  donationReceipt: {
    subject: "Your donation receipt",
    template: "donation-receipt.html",
    variables: {
      donorName: "string",
      amount: "number",
      currency: "string",
      transactionId: "string",
      donationDate: "date"
    }
  }
};
```

#### Email Sending
```javascript
const emailSending = {
  // Send Confirmation
  sendConfirmation: async (donationData) => {
    const emailData = {
      to: donationData.donorEmail,
      subject: "Thank you for your donation",
      template: "donation-confirmation",
      variables: {
        donorName: donationData.donorName,
        amount: donationData.amount,
        currency: donationData.currency
      }
    };
    
    return await sendEmail(emailData);
  },
  
  // Send Receipt
  sendReceipt: async (donationData) => {
    const emailData = {
      to: donationData.donorEmail,
      subject: "Your donation receipt",
      template: "donation-receipt",
      variables: {
        donorName: donationData.donorName,
        amount: donationData.amount,
        currency: donationData.currency,
        transactionId: donationData.transactionId
      }
    };
    
    return await sendEmail(emailData);
  }
};
```

## Configuration Options

### 1. Donation Configuration

#### Donation Settings
```javascript
const donationSettings = {
  // Amount Settings
  amountSettings: {
    presetAmounts: [10, 25, 50, 100, 250, 500],
    minimumAmount: 5,
    maximumAmount: 10000,
    currency: "AUD"
  },
  
  // Form Settings
  formSettings: {
    requiredFields: ["email"],
    optionalFields: ["name", "message"],
    messageMaxLength: 500,
    emailValidation: true
  }
};
```

#### Validation Rules
```javascript
const validationRules = {
  // Amount Validation
  amountValidation: {
    minimum: 5,
    maximum: 10000,
    required: true,
    numeric: true
  },
  
  // Email Validation
  emailValidation: {
    required: true,
    format: "valid email format",
    unique: false
  },
  
  // Message Validation
  messageValidation: {
    required: false,
    maxLength: 500,
    allowedCharacters: "all"
  }
};
```

### 2. Stripe Configuration

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
  
  // Payment Configuration
  paymentConfiguration: {
    currency: "AUD",
    paymentMethods: ["card", "bank_transfer"],
    automaticPaymentMethods: true,
    confirmationMethod: "automatic"
  }
};
```

#### Webhook Configuration
```javascript
const webhookConfiguration = {
  // Webhook Settings
  webhookSettings: {
    endpoint: "/api/stripe/webhook",
    events: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "checkout.session.completed"
    ],
    signatureVerification: true
  },
  
  // Security Settings
  securitySettings: {
    signatureVerification: true,
    eventValidation: true,
    idempotency: true,
    errorLogging: true
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
    swipeNavigation: true,
    hapticFeedback: true
  },
  
  // Performance Settings
  performanceSettings: {
    imageOptimization: true,
    lazyLoading: true,
    caching: true,
    offlineSupport: false
  }
};
```

#### Mobile Features
```javascript
const mobileFeatures = {
  // Push Notifications
  pushNotifications: {
    donationConfirmation: true,
    donationReceipt: true,
    donationReminders: false
  },
  
  // Mobile UI
  mobileUI: {
    responsiveDesign: true,
    touchOptimized: true,
    gestureNavigation: true,
    accessibility: true
  }
};
```

This comprehensive Donations page configuration provides everything needed for a complete mobile app implementation, including detailed Stripe integration, donation processing, mobile optimizations, and all the technical details required for the mobile app builder! 🚀
