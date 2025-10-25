# Seller Hub Page Configuration for Mobile App

This document provides comprehensive information about the "Seller Hub" (Connect) page functionality, including all features, bank account setup, payment configuration, seller profile management, and mobile-specific optimizations for the seller hub system.

## Overview

The Seller Hub page is a comprehensive seller management system that allows sellers to configure their payment settings, manage their bank account details, and access seller-specific features. It features bank account setup, payment configuration, seller profile management, and integration with the platform's payment infrastructure.

## Core Features

### 1. Seller Hub Interface

#### Page Layout
```javascript
const sellerHubPageLayout = {
  // Header Section
  header: {
    title: "Seller Hub",
    description: "Manage your payments and seller profile",
    icon: "DollarSign"
  },
  
  // Main Content
  content: {
    bankAccountSetup: "Bank account configuration interface",
    paymentStatus: "Payment setup status display",
    sellerProfile: "Seller profile management",
    quickActions: "Quick access to seller features"
  }
};
```

#### Visual Design
```javascript
const visualDesign = {
  // Color Scheme
  colors: {
    primary: "Pink to Fuchsia gradient",
    accent: "Fuchsia-600",
    background: "Slate-950",
    text: "Gray-200",
    cards: "Gray-900/80 with backdrop blur"
  },
  
  // Icons and Graphics
  icons: {
    connected: "CheckCircle (green)",
    setup: "Building2 (fuchsia)",
    save: "Save icon",
    dollar: "DollarSign"
  }
};
```

### 2. Bank Account Setup System

#### Bank Account Configuration
```javascript
const bankAccountConfiguration = {
  // Required Fields
  requiredFields: {
    account_name: {
      type: "text",
      required: true,
      placeholder: "John Smith",
      description: "The name on your bank account"
    },
    bsb: {
      type: "text",
      required: true,
      placeholder: "062-000",
      format: "XXX-XXX",
      description: "6-digit Bank-State-Branch number (e.g., 062-000)"
    },
    account_number: {
      type: "text",
      required: true,
      placeholder: "12345678",
      format: "6-9 digits",
      description: "6-9 digit account number"
    }
  },
  
  // Validation Rules
  validationRules: {
    account_name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    bsb: {
      required: true,
      pattern: /^\d{3}-\d{3}$/,
      length: 7
    },
    account_number: {
      required: true,
      minLength: 6,
      maxLength: 9,
      pattern: /^\d+$/
    }
  }
};
```

#### Input Formatting
```javascript
const inputFormatting = {
  // BSB Formatting
  bsbFormatting: {
    formatBSB: (value) => {
      // Remove non-digits
      value = value.replace(/\D/g, '').slice(0, 6);
      
      // Add dash after 3 digits
      if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3);
      }
      
      return value;
    },
    
    validateBSB: (bsb) => {
      const cleanBSB = bsb.replace(/\D/g, '');
      return cleanBSB.length === 6;
    }
  },
  
  // Account Number Formatting
  accountNumberFormatting: {
    formatAccountNumber: (value) => {
      // Remove non-digits and limit to 9 characters
      return value.replace(/\D/g, '').slice(0, 9);
    },
    
    validateAccountNumber: (accountNumber) => {
      return accountNumber.length >= 6 && accountNumber.length <= 9;
    }
  }
};
```

### 3. Payment Status System

#### Status Display
```javascript
const paymentStatusSystem = {
  // Status Types
  statusTypes: {
    connected: {
      icon: "CheckCircle",
      color: "green",
      title: "Bank Account Connected",
      description: "Your Australian bank account is set up and ready to receive payments.",
      showDetails: true
    },
    
    notConnected: {
      icon: "Building2",
      color: "fuchsia",
      title: "Add Australian Bank Account",
      description: "Enter your Australian bank details to receive payments from buyers.",
      showForm: true
    }
  },
  
  // Status Logic
  statusLogic: {
    checkConnectionStatus: (user) => {
      return user?.bank_account_name && 
             user?.bank_bsb && 
             user?.bank_account_number;
    },
    
    getStatusDisplay: (isConnected) => {
      return isConnected ? 'connected' : 'notConnected';
    }
  }
};
```

#### Connected Account Display
```javascript
const connectedAccountDisplay = {
  // Account Details
  accountDetails: {
    accountName: "Display account name",
    bsb: "Display formatted BSB",
    accountNumber: "Display masked account number",
    status: "Connected status indicator"
  },
  
  // Actions
  actions: {
    updateDetails: "Update bank account details",
    viewTransactions: "View payment history",
    manageSettings: "Manage payment settings"
  }
};
```

### 4. Form Validation System

#### Validation Logic
```javascript
const formValidationSystem = {
  // Field Validation
  fieldValidation: {
    validateAccountName: (name) => {
      if (!name.trim()) {
        return { valid: false, message: "Please enter the account name." };
      }
      return { valid: true };
    },
    
    validateBSB: (bsb) => {
      const cleanBSB = bsb.replace(/\D/g, '');
      if (cleanBSB.length !== 6) {
        return { valid: false, message: "BSB must be 6 digits (e.g., 062-000)." };
      }
      return { valid: true };
    },
    
    validateAccountNumber: (accountNumber) => {
      if (accountNumber.length < 6 || accountNumber.length > 9) {
        return { valid: false, message: "Account number must be between 6-9 digits." };
      }
      return { valid: true };
    }
  },
  
  // Form Validation
  formValidation: {
    validateForm: (bankDetails) => {
      const errors = [];
      
      // Validate account name
      const nameValidation = validateAccountName(bankDetails.account_name);
      if (!nameValidation.valid) {
        errors.push(nameValidation.message);
      }
      
      // Validate BSB
      const bsbValidation = validateBSB(bankDetails.bsb);
      if (!bsbValidation.valid) {
        errors.push(bsbValidation.message);
      }
      
      // Validate account number
      const accountValidation = validateAccountNumber(bankDetails.account_number);
      if (!accountValidation.valid) {
        errors.push(accountValidation.message);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
    }
  }
};
```

#### Error Handling
```javascript
const errorHandling = {
  // Error Display
  errorDisplay: {
    showErrors: (errors) => {
      // Display validation errors
      // Highlight invalid fields
      // Show error messages
    },
    
    clearErrors: () => {
      // Clear validation errors
      // Reset error state
    }
  },
  
  // Toast Notifications
  toastNotifications: {
    success: "Your bank account details have been saved.",
    error: "Failed to save your bank details. Please try again.",
    validation: "Please complete all required fields."
  }
};
```

### 5. Data Management System

#### Data Loading
```javascript
const dataManagementSystem = {
  // User Data Loading
  userDataLoading: {
    loadUserData: async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        // Load existing bank details if available
        if (currentUser.bank_account_name) {
          setBankDetails({
            account_name: currentUser.bank_account_name || '',
            bsb: currentUser.bank_bsb || '',
            account_number: currentUser.bank_account_number || '',
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Handle error
      }
    }
  },
  
  // Data Saving
  dataSaving: {
    saveBankDetails: async (bankDetails) => {
      try {
        await User.updateMyUserData({
          bank_account_name: bankDetails.account_name,
          bank_bsb: bankDetails.bsb,
          bank_account_number: bankDetails.account_number,
        });
        
        // Reload user data
        await fetchData();
      } catch (error) {
        console.error("Error saving bank details:", error);
        // Handle error
      }
    }
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Component State
  componentState: {
    user: "current user object",
    loading: "boolean loading state",
    saving: "boolean saving state",
    bankDetails: {
      account_name: "string",
      bsb: "string",
      account_number: "string"
    }
  },
  
  // State Updates
  stateUpdates: {
    updateBankDetails: (field, value) => {
      // Update specific bank detail field
      // Apply formatting
      // Update state
    },
    
    resetForm: () => {
      // Reset form to initial state
      // Clear validation errors
    }
  }
};
```

### 6. Seller Profile Integration

#### Seller Profile Features
```javascript
const sellerProfileFeatures = {
  // Profile Information
  profileInformation: {
    accountType: "seller",
    businessName: "string",
    businessType: "individual or business",
    abn: "Australian Business Number",
    businessAddress: "string",
    businessPhone: "string"
  },
  
  // Payment Settings
  paymentSettings: {
    bankAccount: "Bank account details",
    paymentMethods: "Accepted payment methods",
    payoutSchedule: "Payout schedule settings",
    taxSettings: "Tax configuration"
  },
  
  // Business Settings
  businessSettings: {
    collectionDetails: "Collection and delivery settings",
    operatingHours: "Business hours",
    serviceArea: "Delivery radius",
    specialOffers: "Offer management"
  }
};
```

#### Integration Points
```javascript
const integrationPoints = {
  // Account Type Integration
  accountTypeIntegration: {
    checkAccountType: (user) => {
      return user.account_type === 'seller';
    },
    
    redirectIfNotSeller: () => {
      // Redirect to account type selection if not seller
    }
  },
  
  // Payment Integration
  paymentIntegration: {
    stripeIntegration: "Stripe payment processing",
    bankTransfer: "Bank transfer setup",
    payoutManagement: "Payout configuration"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const sellerHubPageState = {
  // Data State
  dataState: {
    user: "current user object",
    loading: "boolean loading state",
    saving: "boolean saving state"
  },
  
  // Form State
  formState: {
    bankDetails: {
      account_name: "string",
      bsb: "string",
      account_number: "string"
    },
    validationErrors: "array of error messages"
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Data Loading
  dataLoading: {
    loadUserData: async () => {
      // Load current user
      // Load existing bank details
      // Set loading state
    },
    
    refreshData: async () => {
      // Refresh user data
      // Update state
    }
  },
  
  // Form Management
  formManagement: {
    updateBankDetails: (field, value) => {
      // Update specific field
      // Apply formatting
      // Update state
    },
    
    validateForm: () => {
      // Validate all fields
      // Return validation result
    }
  }
};
```

### 2. Form Implementation

#### Form Component
```javascript
const formComponent = {
  // Form Structure
  formStructure: {
    accountName: "Text input for account name",
    bsb: "Text input for BSB with formatting",
    accountNumber: "Text input for account number",
    saveButton: "Save button with loading state"
  },
  
  // Form Validation
  formValidation: {
    validateField: (field, value) => {
      // Validate specific field
      // Return validation result
    },
    
    validateForm: (formData) => {
      // Validate entire form
      // Return validation result
    }
  }
};
```

#### Input Handling
```javascript
const inputHandling = {
  // Input Change Handling
  inputChangeHandling: {
    handleAccountNameChange: (value) => {
      // Update account name
      // Clear validation errors
    },
    
    handleBSBChange: (value) => {
      // Format BSB as XXX-XXX
      // Update state
    },
    
    handleAccountNumberChange: (value) => {
      // Remove non-digits
      // Limit to 9 characters
      // Update state
    }
  },
  
  // Input Formatting
  inputFormatting: {
    formatBSB: (value) => {
      // Remove non-digits
      // Add dash after 3 digits
      // Return formatted value
    },
    
    formatAccountNumber: (value) => {
      // Remove non-digits
      // Limit to 9 characters
      // Return formatted value
    }
  }
};
```

### 3. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    formInputs: "Mobile-optimized form inputs",
    buttons: "Touch-friendly buttons",
    keyboard: "Mobile keyboard optimization"
  },
  
  // Performance
  performance: {
    lazyLoading: "Load data on demand",
    caching: "Cache user data locally",
    offline: "Handle offline scenarios"
  },
  
  // Mobile Features
  mobileFeatures: {
    pushNotifications: "Push notifications for updates",
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

### 4. Payment Integration

#### Payment Setup
```javascript
const paymentSetup = {
  // Bank Account Setup
  bankAccountSetup: {
    collectDetails: "Collect bank account details",
    validateDetails: "Validate bank account information",
    saveDetails: "Save bank account to database",
    confirmSetup: "Confirm successful setup"
  },
  
  // Payment Processing
  paymentProcessing: {
    stripeIntegration: "Stripe payment processing",
    bankTransfer: "Bank transfer setup",
    payoutManagement: "Payout configuration"
  }
};
```

#### Payment Status
```javascript
const paymentStatus = {
  // Status Display
  statusDisplay: {
    connected: "Show connected status",
    notConnected: "Show setup form",
    pending: "Show pending status",
    error: "Show error status"
  },
  
  // Status Actions
  statusActions: {
    updateDetails: "Update bank details",
    viewTransactions: "View payment history",
    manageSettings: "Manage payment settings"
  }
};
```

### 5. Error Handling

#### Error Management
```javascript
const errorManagement = {
  // Validation Errors
  validationErrors: {
    displayErrors: (errors) => {
      // Display validation errors
      // Highlight invalid fields
      // Show error messages
    },
    
    clearErrors: () => {
      // Clear validation errors
      // Reset error state
    }
  },
  
  // Network Errors
  networkErrors: {
    handleNetworkError: (error) => {
      // Handle network errors
      // Show retry options
      // Log error details
    },
    
    handleSaveError: (error) => {
      // Handle save errors
      // Show error message
      // Allow retry
    }
  }
};
```

#### Toast Notifications
```javascript
const toastNotifications = {
  // Success Messages
  successMessages: {
    bankDetailsSaved: "Your bank account details have been saved.",
    profileUpdated: "Your profile has been updated.",
    settingsSaved: "Your settings have been saved."
  },
  
  // Error Messages
  errorMessages: {
    saveError: "Failed to save your details. Please try again.",
    validationError: "Please complete all required fields.",
    networkError: "Network error. Please check your connection."
  }
};
```

## Configuration Options

### 1. Bank Account Configuration

#### Bank Account Settings
```javascript
const bankAccountSettings = {
  // Required Fields
  requiredFields: {
    account_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      description: "The name on your bank account"
    },
    bsb: {
      required: true,
      pattern: /^\d{3}-\d{3}$/,
      description: "6-digit Bank-State-Branch number"
    },
    account_number: {
      required: true,
      minLength: 6,
      maxLength: 9,
      pattern: /^\d+$/,
      description: "6-9 digit account number"
    }
  },
  
  // Validation Rules
  validationRules: {
    bsb: {
      pattern: /^\d{3}-\d{3}$/,
      length: 7,
      message: "BSB must be 6 digits (e.g., 062-000)"
    },
    account_number: {
      minLength: 6,
      maxLength: 9,
      pattern: /^\d+$/,
      message: "Account number must be between 6-9 digits"
    }
  }
};
```

#### Input Formatting
```javascript
const inputFormatting = {
  // BSB Formatting
  bsbFormatting: {
    format: "XXX-XXX",
    maxLength: 7,
    pattern: /^\d{3}-\d{3}$/
  },
  
  // Account Number Formatting
  accountNumberFormatting: {
    format: "digits only",
    maxLength: 9,
    pattern: /^\d+$/
  }
};
```

### 2. Mobile Configuration

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
    bankDetailsUpdated: true,
    paymentReceived: true,
    profileUpdated: false
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

### 3. Database Configuration

#### Database Schema
```javascript
const databaseSchema = {
  // Profiles Table
  profiles: {
    id: "UUID primary key",
    bank_account_name: "string (optional)",
    bank_bsb: "string (optional)",
    bank_account_number: "string (optional)",
    account_type: "enum (individual, seller)",
    created_at: "timestamp",
    updated_at: "timestamp"
  }
};
```

#### Database Operations
```javascript
const databaseOperations = {
  // Update Operations
  updateOperations: {
    updateBankDetails: "Update bank account details",
    updateProfile: "Update seller profile",
    updateSettings: "Update seller settings"
  },
  
  // Read Operations
  readOperations: {
    loadUser: "Load current user data",
    loadBankDetails: "Load bank account details",
    loadProfile: "Load seller profile"
  }
};
```

### 4. Integration Configuration

#### Payment Integration
```javascript
const paymentIntegration = {
  // Stripe Integration
  stripeIntegration: {
    enabled: true,
    testMode: true,
    webhookEndpoint: "/api/stripe/webhook",
    payoutSchedule: "daily"
  },
  
  // Bank Transfer Integration
  bankTransferIntegration: {
    enabled: true,
    supportedBanks: ["Commonwealth Bank", "ANZ", "Westpac", "NAB"],
    processingTime: "1-2 business days"
  }
};
```

#### Account Type Integration
```javascript
const accountTypeIntegration = {
  // Account Type Checks
  accountTypeChecks: {
    isSeller: (user) => user.account_type === 'seller',
    isIndividual: (user) => user.account_type === 'individual',
    hasBankDetails: (user) => user.bank_account_name && user.bank_bsb && user.bank_account_number
  },
  
  // Access Control
  accessControl: {
    sellerOnly: "Only sellers can access seller hub",
    individualRedirect: "Redirect individuals to account type selection",
    adminOverride: "Admins can access all features"
  }
};
```

This comprehensive Seller Hub page configuration provides everything needed for a complete mobile app implementation, including bank account setup, payment configuration, seller profile management, mobile optimizations, and all the technical details required for the mobile app builder! 🚀
