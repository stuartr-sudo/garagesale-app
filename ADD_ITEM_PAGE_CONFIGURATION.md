# Add Item Page Configuration for Mobile App

This document provides comprehensive information about the "Add Item" page functionality, including all features, multi-step form process, AI assistance, image upload, voice input, and item creation workflow for both buyers and sellers.

## Overview

The Add Item page is a sophisticated multi-step form that guides users through creating detailed item listings with AI assistance, image upload, voice input, and comprehensive validation. It features intelligent content generation, mobile-optimized image capture, and seamless integration with the marketplace system.

## Core Features

### 1. Multi-Step Form Process

#### Step Configuration
```javascript
const addItemSteps = {
  totalSteps: 7,
  stepNames: [
    "Upload Images",
    "Item Details", 
    "Pricing",
    "Category & Location",
    "Collection Details",
    "Review & Tags",
    "Ownership Confirmation"
  ],
  stepDescriptions: [
    "Add photos of your item",
    "Describe your item",
    "Set your price",
    "Categorize and locate",
    "Collection information",
    "Review and add tags",
    "Confirm ownership"
  ]
};
```

#### Step Validation
```javascript
const stepValidation = {
  step1: "itemData.image_urls.length > 0",
  step2: "itemData.title.trim() && itemData.description.trim()",
  step3: "itemData.price",
  step4: "itemData.category && itemData.condition && itemData.postcode",
  step5: "itemData.collection_date && itemData.collection_address.trim()",
  step6: "true", // Review step
  step7: "ownershipConfirmed"
};
```

### 2. Progress Tracking System

#### Progress Bar Configuration
```javascript
const progressConfig = {
  display: "Step {currentStep} of {totalSteps}",
  percentage: "Math.round((currentStep / totalSteps) * 100)%",
  progressBar: "Progress component with current step percentage",
  navigation: "Back/Next buttons with validation"
};
```

#### Navigation Controls
```javascript
const navigationControls = {
  backButton: {
    enabled: "currentStep > 1",
    action: "handleBack()",
    icon: "ArrowLeft",
    text: "Back"
  },
  nextButton: {
    enabled: "canProceed()",
    action: "handleNext()",
    icon: "ArrowRight", 
    text: "Next"
  },
  submitButton: {
    enabled: "currentStep === totalSteps",
    action: "handleSubmit()",
    icon: "CheckCircle",
    text: "List Item"
  }
};
```

### 3. Image Upload System

#### Image Upload Configuration
```javascript
const imageUploadConfig = {
  // Upload Limits
  maxImages: 8,
  minImages: 1,
  maxFileSize: "10MB per image",
  supportedFormats: ["image/jpeg", "image/png", "image/webp"],
  
  // Upload Methods
  uploadMethods: {
    fileUpload: "Select from device library",
    cameraCapture: "Take photo with camera (mobile only)",
    dragDrop: "Drag and drop files (desktop)"
  },
  
  // Image Management
  imageManagement: {
    reorder: "Drag to reorder images",
    setMain: "Click to set main image",
    remove: "Remove individual images",
    preview: "Thumbnail preview with overlay controls"
  }
};
```

#### Mobile Camera Integration
```javascript
const mobileCameraConfig = {
  // Camera Features
  cameraFeatures: {
    capture: "Take photo directly in app",
    retake: "Retake photo if not satisfied",
    confirm: "Confirm photo before adding",
    quality: "High quality image capture"
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

#### Image Processing
```javascript
const imageProcessing = {
  // Upload Process
  uploadProcess: {
    validation: "Check file size and format",
    compression: "Compress for optimal storage",
    storage: "Upload to Supabase storage",
    urls: "Generate public URLs"
  },
  
  // Image Display
  imageDisplay: {
    grid: "Responsive grid layout",
    aspectRatio: "Square aspect ratio",
    overlay: "Action buttons overlay",
    mainImage: "First image is main image"
  }
};
```

### 4. AI Content Generation System

#### AI Generation Features
```javascript
const aiGenerationFeatures = {
  // Content Generation
  contentGeneration: {
    title: "Generate item title from image",
    description: "Generate detailed description",
    both: "Generate both title and description",
    tags: "Generate relevant tags"
  },
  
  // AI Models
  aiModels: {
    imageAnalysis: "GPT-4o with vision",
    voiceProcessing: "Whisper API",
    contentGeneration: "GPT-4o for text generation"
  },
  
  // Generation Triggers
  generationTriggers: {
    manual: "User clicks AI generation buttons",
    automatic: "Auto-generate tags on step 4",
    voiceEnhanced: "Use voice input for better results"
  }
};
```

#### AI Prompt Engineering
```javascript
const aiPromptEngineering = {
  // Title Generation
  titleGeneration: {
    format: "[Brand] [Model/Product Type] - [1-2 Key Features] ([Condition])",
    guidelines: [
      "Start with brand name if visible",
      "Include specific model numbers",
      "Add distinguishing features",
      "Use marketplace-friendly language",
      "Prioritize searchability"
    ],
    maxLength: 60
  },
  
  // Description Generation
  descriptionGeneration: {
    structure: [
      "OPENING: Main value proposition",
      "SPECIFICATIONS: Technical details",
      "CONDITION: Honest condition assessment",
      "FEATURES: Key features and benefits",
      "USE CASES: Target audience"
    ],
    wordCount: "150-200 words",
    style: "Professional, clear, honest"
  }
};
```

#### Voice-Enhanced AI
```javascript
const voiceEnhancedAI = {
  // Voice Integration
  voiceIntegration: {
    transcription: "Whisper API for voice-to-text",
    context: "Use voice input to enhance AI analysis",
    combination: "Combine visual and verbal information",
    accuracy: "Improved accuracy with seller context"
  },
  
  // Voice Processing
  voiceProcessing: {
    audioCapture: "MediaRecorder API",
    format: "WebM/MP4/WAV support",
    quality: "High quality audio capture",
    processing: "Real-time transcription"
  }
};
```

### 5. Voice Input System

#### Voice Input Configuration
```javascript
const voiceInputConfig = {
  // Voice Features
  voiceFeatures: {
    recording: "Start/stop recording",
    transcription: "Real-time voice-to-text",
    processing: "AI processing of voice input",
    integration: "Enhance AI content generation"
  },
  
  // Voice Controls
  voiceControls: {
    startRecording: "Click microphone to start",
    stopRecording: "Click stop when finished",
    processing: "Show processing indicator",
    result: "Display transcribed text"
  },
  
  // Voice Targets
  voiceTargets: {
    description: "Add voice to description field",
    title: "Add voice to title field",
    both: "Use voice for both title and description"
  }
};
```

#### Voice Processing Workflow
```javascript
const voiceProcessingWorkflow = {
  // Recording Process
  recordingProcess: {
    start: "Request microphone access",
    record: "Capture audio with MediaRecorder",
    stop: "Stop recording and process",
    cleanup: "Clean up audio streams"
  },
  
  // Transcription Process
  transcriptionProcess: {
    convert: "Convert audio to base64",
    send: "Send to Whisper API",
    receive: "Receive transcribed text",
    display: "Show transcribed text to user"
  },
  
  // AI Enhancement
  aiEnhancement: {
    combine: "Combine voice and image data",
    enhance: "Use voice context for better AI results",
    generate: "Generate enhanced content"
  }
};
```

### 6. Form Fields and Validation

#### Step 1: Image Upload
```javascript
const step1Fields = {
  // Required Fields
  required: {
    images: "At least 1 image required",
    maxImages: "Maximum 8 images"
  },
  
  // Image Validation
  validation: {
    fileSize: "Max 10MB per image",
    format: "JPEG, PNG, WebP only",
    quality: "High quality images preferred"
  },
  
  // Image Actions
  actions: {
    upload: "Upload from device",
    camera: "Take photo (mobile)",
    reorder: "Drag to reorder",
    remove: "Remove individual images",
    setMain: "Set main image"
  }
};
```

#### Step 2: Item Details
```javascript
const step2Fields = {
  // Required Fields
  required: {
    title: "Item title (required)",
    description: "Item description (required)"
  },
  
  // AI Assistance
  aiAssistance: {
    generateTitle: "Generate title from image",
    generateDescription: "Generate description from image",
    generateBoth: "Generate both title and description",
    voiceInput: "Add voice input for better results"
  },
  
  // Field Validation
  validation: {
    title: "Non-empty string, max 100 characters",
    description: "Non-empty string, min 50 characters"
  }
};
```

#### Step 3: Pricing
```javascript
const step3Fields = {
  // Required Fields
  required: {
    price: "Item price (required)",
    minimumPrice: "Minimum price (optional)"
  },
  
  // Price Configuration
  priceConfig: {
    currency: "AUD (Australian Dollars)",
    format: "Decimal number input",
    validation: "Positive number required"
  },
  
  // Negotiation Features
  negotiationFeatures: {
    minimumPrice: "Set minimum acceptable price",
    negotiationEnabled: "Enable AI negotiation",
    priceRange: "Display price range to buyers"
  }
};
```

#### Step 4: Category & Location
```javascript
const step4Fields = {
  // Required Fields
  required: {
    category: "Item category (required)",
    condition: "Item condition (required)",
    postcode: "Location postcode (required)"
  },
  
  // Category Options
  categories: [
    "Electronics", "Clothing", "Furniture", "Books",
    "Toys", "Sports", "Home & Garden", "Automotive",
    "Collectibles", "Other"
  ],
  
  // Condition Options
  conditions: [
    "New", "Like New", "Good", "Fair", "Poor"
  ],
  
  // Location Features
  locationFeatures: {
    postcode: "Australian postcode",
    autoFill: "Auto-fill from user profile",
    validation: "Valid Australian postcode"
  }
};
```

#### Step 5: Collection Details
```javascript
const step5Fields = {
  // Required Fields
  required: {
    collectionDate: "Collection date (required)",
    collectionAddress: "Collection address (required)"
  },
  
  // Collection Configuration
  collectionConfig: {
    date: "Date picker for collection date",
    address: "Text input for collection address",
    autoFill: "Auto-fill from user profile"
  },
  
  // Collection Validation
  validation: {
    date: "Future date required",
    address: "Non-empty address required"
  }
};
```

#### Step 6: Review & Tags
```javascript
const step6Fields = {
  // Review Features
  reviewFeatures: {
    summary: "Review all item details",
    edit: "Edit any field before submission",
    tags: "Add or edit tags"
  },
  
  // Tag Management
  tagManagement: {
    aiGenerated: "AI-generated tags",
    manual: "Manual tag addition",
    edit: "Edit existing tags",
    remove: "Remove unwanted tags"
  },
  
  // Tag Generation
  tagGeneration: {
    automatic: "Auto-generate tags on step 4",
    aiPowered: "AI-powered tag suggestions",
    relevant: "Relevant and searchable tags"
  }
};
```

#### Step 7: Ownership Confirmation
```javascript
const step7Fields = {
  // Required Confirmation
  required: {
    ownershipConfirmed: "Confirm item ownership (required)"
  },
  
  // Confirmation Features
  confirmationFeatures: {
    checkbox: "Checkbox to confirm ownership",
    legal: "Legal ownership confirmation",
    responsibility: "Seller responsibility acknowledgment"
  },
  
  // Final Validation
  finalValidation: {
    allFields: "All previous steps completed",
    ownership: "Ownership confirmed",
    ready: "Ready to submit"
  }
};
```

### 7. AI Assistant Integration

#### AI Assistant Features
```javascript
const aiAssistantFeatures = {
  // Content Generation
  contentGeneration: {
    title: "Generate compelling titles",
    description: "Generate detailed descriptions",
    tags: "Generate relevant tags",
    category: "Suggest appropriate category"
  },
  
  // Image Analysis
  imageAnalysis: {
    productRecognition: "Identify product type",
    conditionAssessment: "Assess item condition",
    featureExtraction: "Extract key features",
    qualityCheck: "Check image quality"
  },
  
  // Voice Integration
  voiceIntegration: {
    transcription: "Convert voice to text",
    context: "Use voice for better results",
    enhancement: "Enhance AI with voice input"
  }
};
```

#### AI Processing Workflow
```javascript
const aiProcessingWorkflow = {
  // Image Analysis
  imageAnalysis: {
    upload: "User uploads image",
    analyze: "AI analyzes image content",
    extract: "Extract product information",
    generate: "Generate listing content"
  },
  
  // Voice Processing
  voiceProcessing: {
    record: "User records voice input",
    transcribe: "Convert to text",
    enhance: "Enhance AI analysis",
    generate: "Generate improved content"
  },
  
  // Content Generation
  contentGeneration: {
    combine: "Combine image and voice data",
    generate: "Generate optimized content",
    validate: "Validate generated content",
    apply: "Apply to form fields"
  }
};
```

## Mobile App Implementation

### 1. Form State Management

#### Component State
```javascript
const addItemState = {
  // Form Data
  itemData: {
    title: "string",
    description: "string", 
    price: "number",
    minimum_price: "number",
    condition: "string",
    category: "string",
    postcode: "string",
    tags: "array",
    image_urls: "array",
    collection_date: "string",
    collection_address: "string"
  },
  
  // UI State
  currentStep: "number (1-7)",
  isGeneratingContent: "boolean",
  isGeneratingTags: "boolean",
  isSubmitting: "boolean",
  isUploading: "boolean",
  
  // Voice State
  showVoiceInput: "boolean",
  voiceTargetField: "string",
  voiceTranscription: "string",
  hasVoiceInput: "boolean",
  
  // Confirmation State
  ownershipConfirmed: "boolean"
};
```

#### State Management
```javascript
const stateManagement = {
  // Form Management
  formManagement: {
    updateField: "Update individual form fields",
    validateStep: "Validate current step",
    canProceed: "Check if can proceed to next step",
    resetForm: "Reset form to initial state"
  },
  
  // Step Management
  stepManagement: {
    nextStep: "Move to next step",
    previousStep: "Move to previous step",
    jumpToStep: "Jump to specific step",
    validateStep: "Validate step before proceeding"
  }
};
```

### 2. Image Upload Implementation

#### Image Upload Component
```javascript
const imageUploadComponent = {
  // Upload Methods
  uploadMethods: {
    fileUpload: "Select files from device",
    cameraCapture: "Take photo with camera",
    dragDrop: "Drag and drop files"
  },
  
  // Image Management
  imageManagement: {
    addImages: "Add new images",
    removeImage: "Remove specific image",
    reorderImages: "Change image order",
    setMainImage: "Set primary image"
  },
  
  // Mobile Features
  mobileFeatures: {
    cameraAccess: "Request camera permission",
    photoCapture: "Capture photo directly",
    imagePreview: "Preview captured image",
    retakeOption: "Retake if not satisfied"
  }
};
```

#### Image Processing
```javascript
const imageProcessing = {
  // Upload Process
  uploadProcess: {
    validate: "Validate file size and format",
    compress: "Compress for optimal storage",
    upload: "Upload to cloud storage",
    generateUrls: "Generate public URLs"
  },
  
  // Image Display
  imageDisplay: {
    grid: "Responsive grid layout",
    thumbnails: "Thumbnail previews",
    overlay: "Action buttons overlay",
    mainImage: "Highlight main image"
  }
};
```

### 3. Voice Input Implementation

#### Voice Input Component
```javascript
const voiceInputComponent = {
  // Recording Features
  recordingFeatures: {
    startRecording: "Start voice recording",
    stopRecording: "Stop voice recording",
    processing: "Show processing indicator",
    result: "Display transcribed text"
  },
  
  // Voice Processing
  voiceProcessing: {
    audioCapture: "Capture audio with MediaRecorder",
    formatSupport: "Support multiple audio formats",
    quality: "High quality audio capture",
    transcription: "Real-time voice-to-text"
  },
  
  // Mobile Optimization
  mobileOptimization: {
    permissions: "Request microphone access",
    constraints: "Mobile-friendly audio constraints",
    fallback: "Fallback for unsupported devices",
    errorHandling: "Handle recording errors"
  }
};
```

#### Voice Processing Workflow
```javascript
const voiceProcessingWorkflow = {
  // Recording Process
  recordingProcess: {
    requestAccess: "Request microphone permission",
    startRecording: "Start MediaRecorder",
    captureAudio: "Capture audio chunks",
    stopRecording: "Stop and process audio"
  },
  
  // Transcription Process
  transcriptionProcess: {
    convertToBase64: "Convert audio to base64",
    sendToAPI: "Send to Whisper API",
    receiveText: "Receive transcribed text",
    displayResult: "Show transcribed text"
  },
  
  // AI Enhancement
  aiEnhancement: {
    combineData: "Combine voice and image data",
    enhanceAnalysis: "Use voice for better AI results",
    generateContent: "Generate enhanced content"
  }
};
```

### 4. AI Content Generation

#### AI Generation Implementation
```javascript
const aiGenerationImplementation = {
  // Content Generation
  contentGeneration: {
    title: "Generate item title from image",
    description: "Generate detailed description",
    both: "Generate both title and description",
    tags: "Generate relevant tags"
  },
  
  // AI Models
  aiModels: {
    imageAnalysis: "GPT-4o with vision capabilities",
    voiceProcessing: "Whisper API for transcription",
    contentGeneration: "GPT-4o for text generation"
  },
  
  // Generation Process
  generationProcess: {
    analyzeImage: "Analyze uploaded image",
    processVoice: "Process voice input if available",
    generateContent: "Generate optimized content",
    applyToForm: "Apply generated content to form"
  }
};
```

#### AI Prompt Engineering
```javascript
const aiPromptEngineering = {
  // Title Generation
  titleGeneration: {
    format: "[Brand] [Model/Product Type] - [1-2 Key Features] ([Condition])",
    guidelines: [
      "Start with brand name if visible",
      "Include specific model numbers",
      "Add distinguishing features",
      "Use marketplace-friendly language",
      "Prioritize searchability"
    ],
    maxLength: 60
  },
  
  // Description Generation
  descriptionGeneration: {
    structure: [
      "OPENING: Main value proposition",
      "SPECIFICATIONS: Technical details",
      "CONDITION: Honest condition assessment",
      "FEATURES: Key features and benefits",
      "USE CASES: Target audience"
    ],
    wordCount: "150-200 words",
    style: "Professional, clear, honest"
  }
};
```

### 5. Form Validation System

#### Step Validation
```javascript
const stepValidation = {
  // Step 1: Images
  step1: {
    required: "At least 1 image",
    validation: "Check image format and size",
    maxImages: "Maximum 8 images"
  },
  
  // Step 2: Details
  step2: {
    required: "Title and description",
    validation: "Non-empty strings",
    minLength: "Description minimum 50 characters"
  },
  
  // Step 3: Pricing
  step3: {
    required: "Price required",
    validation: "Positive number",
    format: "Decimal number"
  },
  
  // Step 4: Category
  step4: {
    required: "Category, condition, postcode",
    validation: "Valid selections",
    postcode: "Valid Australian postcode"
  },
  
  // Step 5: Collection
  step5: {
    required: "Collection date and address",
    validation: "Future date, non-empty address"
  },
  
  // Step 6: Review
  step6: {
    required: "Review all details",
    validation: "All previous steps valid"
  },
  
  // Step 7: Confirmation
  step7: {
    required: "Ownership confirmation",
    validation: "Checkbox must be checked"
  }
};
```

#### Validation Implementation
```javascript
const validationImplementation = {
  // Field Validation
  fieldValidation: {
    title: "Non-empty, max 100 characters",
    description: "Non-empty, min 50 characters",
    price: "Positive number, decimal format",
    postcode: "Valid Australian postcode",
    collectionDate: "Future date required",
    collectionAddress: "Non-empty string"
  },
  
  // Step Validation
  stepValidation: {
    canProceed: "Check if current step is valid",
    validateStep: "Validate specific step",
    showErrors: "Display validation errors",
    preventProceed: "Prevent invalid progression"
  }
};
```

### 6. Mobile-Specific Features

#### Mobile Optimization
```javascript
const mobileOptimization = {
  // Touch Interactions
  touchInteractions: {
    imageUpload: "Touch-friendly upload buttons",
    formInputs: "Large, accessible input fields",
    navigation: "Swipe between steps",
    camera: "Native camera integration"
  },
  
  // Performance
  performance: {
    imageCompression: "Compress images for mobile",
    lazyLoading: "Load images on demand",
    caching: "Cache form data locally",
    offline: "Handle offline scenarios"
  },
  
  // Mobile Features
  mobileFeatures: {
    camera: "Native camera access",
    microphone: "Voice recording capabilities",
    gestures: "Swipe and touch gestures",
    orientation: "Handle orientation changes"
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
  },
  
  // Camera UI
  cameraUI: {
    overlay: "Camera overlay with controls",
    preview: "Live camera preview",
    controls: "Capture and cancel buttons",
    feedback: "Visual feedback for actions"
  }
};
```

### 7. Data Submission System

#### Submission Process
```javascript
const submissionProcess = {
  // Data Preparation
  dataPreparation: {
    validate: "Validate all form data",
    format: "Format data for submission",
    prepare: "Prepare item payload",
    knowledge: "Prepare item knowledge data"
  },
  
  // Database Operations
  databaseOperations: {
    insertItem: "Insert item into items table",
    insertKnowledge: "Insert item knowledge data",
    updateUser: "Update user statistics",
    handleErrors: "Handle submission errors"
  },
  
  // Success Handling
  successHandling: {
    redirect: "Redirect to My Items page",
    notification: "Show success message",
    cleanup: "Clean up form state",
    analytics: "Track successful submission"
  }
};
```

#### Item Creation Payload
```javascript
const itemCreationPayload = {
  // Item Data
  itemData: {
    title: "string",
    description: "string",
    price: "number",
    condition: "string",
    category: "string",
    location: "string",
    tags: "array",
    image_urls: "array",
    seller_id: "uuid",
    status: "active",
    collection_date: "string",
    collection_address: "string"
  },
  
  // Knowledge Data
  knowledgeData: {
    item_id: "uuid",
    minimum_price: "number",
    negotiation_enabled: "boolean",
    selling_points: "array",
    additional_info: "object"
  }
};
```

## Configuration Options

### 1. Form Configuration

#### Step Configuration
```javascript
const stepConfiguration = {
  // Step Names
  stepNames: [
    "Upload Images",
    "Item Details",
    "Pricing", 
    "Category & Location",
    "Collection Details",
    "Review & Tags",
    "Ownership Confirmation"
  ],
  
  // Step Descriptions
  stepDescriptions: [
    "Add photos of your item",
    "Describe your item",
    "Set your price",
    "Categorize and locate",
    "Collection information",
    "Review and add tags",
    "Confirm ownership"
  ],
  
  // Step Validation
  stepValidation: {
    step1: "At least 1 image required",
    step2: "Title and description required",
    step3: "Price required",
    step4: "Category, condition, postcode required",
    step5: "Collection date and address required",
    step6: "Review all details",
    step7: "Ownership confirmation required"
  }
};
```

#### Field Configuration
```javascript
const fieldConfiguration = {
  // Required Fields
  requiredFields: {
    images: "At least 1 image",
    title: "Item title",
    description: "Item description",
    price: "Item price",
    category: "Item category",
    condition: "Item condition",
    postcode: "Location postcode",
    collectionDate: "Collection date",
    collectionAddress: "Collection address",
    ownershipConfirmed: "Ownership confirmation"
  },
  
  // Optional Fields
  optionalFields: {
    minimumPrice: "Minimum price for negotiation",
    tags: "Item tags",
    voiceInput: "Voice input for description"
  }
};
```

### 2. AI Configuration

#### AI Generation Settings
```javascript
const aiGenerationSettings = {
  // Content Generation
  contentGeneration: {
    title: {
      maxLength: 60,
      format: "[Brand] [Model] - [Features] ([Condition])",
      guidelines: "Marketplace-friendly, searchable"
    },
    description: {
      wordCount: "150-200 words",
      structure: "Opening, specifications, condition, features, use cases",
      style: "Professional, clear, honest"
    },
    tags: {
      count: "5-10 relevant tags",
      relevance: "Searchable and relevant",
      categories: "Match item category"
    }
  },
  
  // AI Models
  aiModels: {
    imageAnalysis: "GPT-4o with vision",
    voiceProcessing: "Whisper API",
    contentGeneration: "GPT-4o"
  }
};
```

#### AI Prompt Configuration
```javascript
const aiPromptConfiguration = {
  // Title Generation
  titleGeneration: {
    prompt: "Create a concise, searchable title using format: [Brand] [Model/Product Type] - [1-2 Key Features] ([Condition])",
    guidelines: [
      "Start with brand name if visible",
      "Include specific model numbers",
      "Add distinguishing features",
      "Use marketplace-friendly language",
      "Prioritize searchability"
    ]
  },
  
  // Description Generation
  descriptionGeneration: {
    prompt: "Write a compelling, structured description with opening, specifications, condition, features, and use cases",
    structure: [
      "OPENING: Main value proposition",
      "SPECIFICATIONS: Technical details",
      "CONDITION: Honest condition assessment",
      "FEATURES: Key features and benefits",
      "USE CASES: Target audience"
    ]
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
  
  // Voice Input
  voiceInput: {
    enabled: true,
    permissions: "Request microphone access",
    quality: "High quality audio",
    format: "WebM/MP4/WAV",
    transcription: "Real-time transcription"
  },
  
  // Touch Interactions
  touchInteractions: {
    swipe: "Swipe between steps",
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
    caching: "Cache form data locally",
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

This comprehensive Add Item page configuration provides everything needed for a complete mobile app implementation, including multi-step form process, AI assistance, image upload, voice input, and mobile-specific optimizations! 🚀
