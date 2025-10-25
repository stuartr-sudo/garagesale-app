# Edit Item Page Configuration for Mobile App

This document provides comprehensive information about the "Edit Item" functionality, including all features, voice-to-text integration, AI-powered content updates, agent knowledge base synchronization, image management, and mobile-specific optimizations for editing existing listings.

## Overview

The Edit Item page allows sellers to update their existing listings with full feature parity to the Add Item page. It includes voice-to-text capabilities, intelligent AI parsing, automatic knowledge base synchronization, image management, and real-time validation. Every change made to an item automatically updates the AI agent's knowledge base to ensure negotiations reflect the latest information.

## Core Features

### 1. Edit Item Interface

#### Page Structure
```javascript
const editItemPageStructure = {
  // Header Section
  header: {
    backButton: "Navigate back to My Items",
    pageTitle: "Edit Listing",
    subtitle: "Update your item information"
  },
  
  // Form Sections
  formSections: [
    "Image Management",
    "Title & Description",
    "Pricing (Price & Minimum Price)",
    "Category & Condition",
    "Location",
    "Tags"
  ],
  
  // Footer Actions
  footerActions: {
    saveButton: "Update listing and sync knowledge base",
    cancelButton: "Discard changes and return"
  }
};
```

#### Load Existing Item
```javascript
const loadExistingItem = {
  // Data Loading Process
  loadingProcess: {
    step1: "Verify user authentication",
    step2: "Fetch item data from database",
    step3: "Verify ownership (seller_id matches user)",
    step4: "Validate and sanitize image URLs",
    step5: "Populate form with existing data",
    step6: "Set loading state to complete"
  },
  
  // Ownership Verification
  ownershipVerification: {
    check: "item.seller_id === currentUser.id",
    onFail: {
      showToast: "Access Denied - You can only edit your own listings",
      redirect: "Navigate to My Items page"
    }
  },
  
  // Data Sanitization
  dataSanitization: {
    ensureArray: "Convert single values to arrays (tags, image_urls)",
    ensureString: "Convert null/undefined to empty strings",
    filterInvalidURLs: "Remove blob URLs and invalid image URLs",
    validateFields: "Ensure all fields have valid default values"
  }
};
```

### 2. Image Management System

#### Image Operations
```javascript
const imageOperations = {
  // Display Existing Images
  displayExisting: {
    loadImages: "Load existing image URLs from database",
    filterValid: "Filter out blob URLs and invalid URLs",
    displayPreviews: "Show image thumbnails with remove buttons",
    setMain: "Allow user to set primary image"
  },
  
  // Upload New Images
  uploadNew: {
    selectFiles: "File picker or camera capture",
    validateFiles: "Check file size and type",
    uploadToStorage: "Upload to Supabase Storage (item-images bucket)",
    generatePublicURL: "Get public URL for uploaded image",
    appendToArray: "Add new URLs to existing image_urls array"
  },
  
  // Remove Images
  removeImage: {
    clickRemove: "User clicks X on image thumbnail",
    updateArray: "Filter out removed image from array",
    noStorageDelete: "Don't delete from storage (keep old versions)",
    updateState: "Update local state immediately"
  },
  
  // Reorder Images
  reorderImages: {
    dragDrop: "Drag and drop to reorder",
    updateArray: "Update image_urls array order",
    firstIsMain: "First image is primary/main image"
  }
};
```

#### Image Upload Implementation
```javascript
const imageUploadImplementation = {
  // Upload Function
  uploadFunction: async (files, currentUser) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  },
  
  // Update State
  updateState: (uploadedUrls) => {
    setItemData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, ...uploadedUrls]
    }));
  }
};
```

### 3. Voice-to-Text Integration

#### Voice Input Features
```javascript
const voiceInputFeatures = {
  // Voice Input Targets
  voiceInputTargets: {
    title: "Add to or replace title",
    description: "Add to or replace description",
    intelligent: "AI parses and updates both fields intelligently"
  },
  
  // Recording Configuration
  recordingConfiguration: {
    maxDuration: 30, // seconds
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1
    },
    mimeTypes: ["audio/webm;codecs=opus", "audio/mp4", "audio/wav"]
  },
  
  // Recording Controls
  recordingControls: {
    startRecording: "Begin audio capture",
    stopRecording: "End audio capture and process",
    cancelRecording: "Abort recording without processing",
    recordingTimer: "Display elapsed time and max duration"
  }
};
```

#### Voice Transcription Process
```javascript
const voiceTranscriptionProcess = {
  // Step 1: Audio Capture
  audioCapture: {
    requestMicrophoneAccess: "getUserMedia with audio constraints",
    createMediaRecorder: "Initialize MediaRecorder with MIME type",
    collectAudioChunks: "Store audio data chunks during recording",
    stopRecording: "Finalize recording and create audio blob"
  },
  
  // Step 2: Audio Processing
  audioProcessing: {
    createBlob: "Combine audio chunks into Blob",
    convertToBase64: "Convert blob to base64 for API transmission",
    validateSize: "Ensure audio size is within limits"
  },
  
  // Step 3: Whisper API Transcription
  whisperAPITranscription: {
    endpoint: "/api/whisper-transcribe",
    method: "POST",
    payload: {
      audioBase64: "base64 encoded audio data"
    },
    response: {
      success: true,
      transcript: "transcribed text"
    }
  },
  
  // Step 4: Apply Transcription
  applyTranscription: async (transcript, targetField) => {
    if (targetField === 'title') {
      // Append to or replace title
      setItemData(prev => ({
        ...prev,
        title: prev.title ? `${prev.title} - ${transcript}` : transcript
      }));
    } else if (targetField === 'description') {
      // Append to or replace description
      setItemData(prev => ({
        ...prev,
        description: prev.description ? `${prev.description}\n\n${transcript}` : transcript
      }));
    } else if (targetField === 'intelligent') {
      // AI-powered intelligent parsing
      const parsed = await parseVoiceInputIntelligently(transcript);
      setItemData(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        description: parsed.description || prev.description
      }));
    }
  }
};
```

#### Intelligent Voice Parsing
```javascript
const intelligentVoiceParsing = {
  // AI-Powered Parsing
  aiParsing: async (voiceText) => {
    const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Parse this voice input about editing an item listing. Extract title updates and description updates separately.

Voice input: "${voiceText}"

Return JSON with:
- title: Any title updates or additions
- description: Any description updates or additions

Example: {
  "title": "Vintage Leather Jacket - Excellent Condition",
  "description": "This is a beautiful vintage leather jacket in excellent condition with minimal wear."
}

Return only JSON, no other text.`
      }],
      temperature: 0.3,
      max_tokens: 200
    });
    
    return JSON.parse(response.choices[0].message.content);
  },
  
  // Fallback Handling
  fallbackHandling: {
    onError: "Use full transcript as description",
    confidence: "Track parsing confidence level",
    userNotification: "Inform user how the voice input was applied"
  }
};
```

### 4. Agent Knowledge Base Synchronization

#### Knowledge Base Update System
```javascript
const knowledgeBaseUpdateSystem = {
  // Automatic Synchronization
  automaticSync: {
    trigger: "Every time item is updated and saved",
    function: "syncItemWithKnowledgeBase(itemId, itemData)",
    fallback: "If sync fails, log warning but don't fail update"
  },
  
  // Core Item Data Sync
  coreDataSync: {
    fields: [
      "minimum_price",
      "title",
      "description",
      "condition",
      "category"
    ],
    operation: "Update or insert into item_knowledge table"
  },
  
  // Voice Data Sync
  voiceDataSync: {
    trigger: "When voice input is used during edit",
    function: "updateKnowledgeWithVoiceData(itemId, transcript)",
    additionalInfo: {
      has_voice_input: true,
      voice_transcription: "full transcript text",
      voice_updated_at: "timestamp"
    }
  }
};
```

#### Knowledge Base Sync Implementation
```javascript
const knowledgeBaseSyncImplementation = {
  // Sync Item with Knowledge Base
  syncItemWithKnowledgeBase: async (itemId, itemData) => {
    try {
      // Check if knowledge entry exists
      const { data: existingKnowledge, error: fetchError } = await supabase
        .from('item_knowledge')
        .select('*')
        .eq('item_id', itemId)
        .single();
      
      // Prepare knowledge data
      const knowledgeData = {
        item_id: itemId,
        minimum_price: itemData.minimum_price || null,
        negotiation_enabled: true,
        updated_at: new Date().toISOString()
      };
      
      // Preserve existing AI-generated content
      if (existingKnowledge?.additional_info) {
        knowledgeData.additional_info = existingKnowledge.additional_info;
      }
      if (existingKnowledge?.selling_points) {
        knowledgeData.selling_points = existingKnowledge.selling_points;
      }
      if (existingKnowledge?.faqs) {
        knowledgeData.faqs = existingKnowledge.faqs;
      }
      
      // Update or insert
      if (existingKnowledge) {
        await supabase
          .from('item_knowledge')
          .update(knowledgeData)
          .eq('item_id', itemId);
      } else {
        await supabase
          .from('item_knowledge')
          .insert([{
            ...knowledgeData,
            created_at: new Date().toISOString()
          }]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Knowledge base sync error:', error);
      return { success: false, error };
    }
  },
  
  // Update with Voice Data
  updateKnowledgeWithVoiceData: async (itemId, voiceTranscription) => {
    try {
      // Get existing knowledge
      const { data: existingKnowledge } = await supabase
        .from('item_knowledge')
        .select('*')
        .eq('item_id', itemId)
        .single();
      
      // Update additional_info with voice data
      const additionalInfo = existingKnowledge?.additional_info || {};
      const updatedAdditionalInfo = {
        ...additionalInfo,
        has_voice_input: true,
        voice_transcription: voiceTranscription,
        voice_updated_at: new Date().toISOString()
      };
      
      const knowledgeData = {
        item_id: itemId,
        additional_info: updatedAdditionalInfo,
        updated_at: new Date().toISOString()
      };
      
      // Preserve existing data
      if (existingKnowledge) {
        knowledgeData.minimum_price = existingKnowledge.minimum_price;
        knowledgeData.selling_points = existingKnowledge.selling_points;
        knowledgeData.faqs = existingKnowledge.faqs;
        knowledgeData.negotiation_enabled = existingKnowledge.negotiation_enabled;
      }
      
      // Update or insert
      if (existingKnowledge) {
        await supabase
          .from('item_knowledge')
          .update(knowledgeData)
          .eq('item_id', itemId);
      } else {
        await supabase
          .from('item_knowledge')
          .insert([{
            ...knowledgeData,
            created_at: new Date().toISOString()
          }]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Voice data sync error:', error);
      return { success: false, error };
    }
  }
};
```

### 5. AI-Generated Content from Voice

#### Selling Points Extraction
```javascript
const sellingPointsExtraction = {
  // Extract Selling Points
  extractSellingPoints: async (voiceTranscription, itemTitle) => {
    try {
      const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract key selling points from this voice transcription about "${itemTitle}".

Voice transcription: "${voiceTranscription}"

Return a JSON array of 3-5 key selling points that would help sell this item. Focus on:
- Unique features
- Condition details
- Value propositions
- Special characteristics

Example format: ["Handcrafted from premium materials", "Excellent condition with minimal wear", "Rare vintage piece from 1980s"]

Return only the JSON array, no other text.`
        }],
        temperature: 0.3,
        max_tokens: 200
      });
      
      const sellingPoints = JSON.parse(response.choices[0].message.content.trim());
      return Array.isArray(sellingPoints) ? sellingPoints : [];
    } catch (error) {
      console.error('Selling points extraction error:', error);
      return [];
    }
  },
  
  // Update Knowledge Base
  updateSellingPoints: async (itemId, sellingPoints) => {
    if (sellingPoints.length > 0) {
      await supabase
        .from('item_knowledge')
        .update({
          selling_points: sellingPoints,
          updated_at: new Date().toISOString()
        })
        .eq('item_id', itemId);
    }
  }
};
```

#### FAQ Generation
```javascript
const faqGeneration = {
  // Generate FAQs
  generateFAQs: async (voiceTranscription, itemTitle) => {
    try {
      const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Generate 3-5 relevant FAQs based on this voice transcription about "${itemTitle}".

Voice transcription: "${voiceTranscription}"

Return a JSON object with questions as keys and answers as values.
Focus on common buyer questions like:
- Condition details
- Authenticity
- Shipping/pickup
- History/provenance
- Care instructions

Example format: {
  "What condition is this item in?": "The item is in excellent condition with only minor wear",
  "Is this authentic?": "Yes, this is an authentic piece with original markings"
}

Return only the JSON object, no other text.`
        }],
        temperature: 0.3,
        max_tokens: 300
      });
      
      const faqs = JSON.parse(response.choices[0].message.content.trim());
      return typeof faqs === 'object' && faqs !== null ? faqs : {};
    } catch (error) {
      console.error('FAQ generation error:', error);
      return {};
    }
  },
  
  // Update Knowledge Base
  updateFAQs: async (itemId, faqs) => {
    if (Object.keys(faqs).length > 0) {
      await supabase
        .from('item_knowledge')
        .update({
          faqs: faqs,
          updated_at: new Date().toISOString()
        })
        .eq('item_id', itemId);
    }
  }
};
```

### 6. Form Fields and Validation

#### All Form Fields
```javascript
const formFields = {
  // Title
  title: {
    type: "text",
    required: true,
    maxLength: 100,
    validation: "Must not be empty",
    characterCount: true
  },
  
  // Description
  description: {
    type: "textarea",
    required: true,
    maxLength: 1000,
    validation: "Must not be empty",
    characterCount: true,
    voiceInput: true
  },
  
  // Price
  price: {
    type: "number",
    required: true,
    min: 0.01,
    validation: "Must be greater than 0",
    prefix: "$"
  },
  
  // Minimum Price (for negotiation)
  minimum_price: {
    type: "number",
    required: false,
    min: 0.01,
    validation: "Must be less than or equal to price",
    helpText: "Lowest price you'll accept in negotiation"
  },
  
  // Condition
  condition: {
    type: "select",
    required: true,
    options: ["new", "like_new", "good", "fair", "poor"],
    defaultValue: "good"
  },
  
  // Category
  category: {
    type: "select",
    required: true,
    options: [
      "electronics", "clothing", "furniture", "books",
      "toys", "sports", "home_garden", "automotive",
      "collectibles", "other"
    ],
    defaultValue: "other"
  },
  
  // Location
  location: {
    type: "text",
    required: false,
    defaultValue: "user.postcode",
    helpText: "Collection location (defaults to your postcode)"
  },
  
  // Tags
  tags: {
    type: "array",
    required: false,
    commaSeparated: true,
    maxTags: 10,
    helpText: "Comma-separated tags for better discoverability"
  },
  
  // Images
  image_urls: {
    type: "array",
    required: true,
    minImages: 1,
    maxImages: 5,
    validation: "At least one image required"
  }
};
```

#### Validation Rules
```javascript
const validationRules = {
  // Pre-Submit Validation
  preSubmitValidation: {
    checkTitle: "Title must not be empty",
    checkDescription: "Description must not be empty",
    checkPrice: "Price must be greater than 0",
    checkImages: "At least one image required",
    checkMinPrice: "Minimum price must be ≤ price (if provided)",
    checkFields: "All required fields must be filled"
  },
  
  // Real-time Validation
  realTimeValidation: {
    titleLength: "Show character count (max 100)",
    descriptionLength: "Show character count (max 1000)",
    priceFormat: "Validate number format",
    minPriceComparison: "Warn if minimum_price > price"
  },
  
  // Error Handling
  errorHandling: {
    showToast: "Display validation errors to user",
    highlightField: "Highlight invalid field",
    preventSubmit: "Disable submit button if invalid"
  }
};
```

### 7. Update Process

#### Complete Update Flow
```javascript
const completeUpdateFlow = {
  // Step 1: Validation
  validation: {
    validateAllFields: "Check all required fields",
    validateImageURLs: "Ensure all image URLs are valid",
    validatePricing: "Ensure price and minimum_price are valid",
    showErrors: "Display validation errors if any"
  },
  
  // Step 2: Update Database
  updateDatabase: {
    updateItems: async (itemId, itemData, userId) => {
      const { error } = await supabase
        .from('items')
        .update({
          title: itemData.title.trim(),
          description: itemData.description.trim(),
          price: parseFloat(itemData.price),
          minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
          condition: itemData.condition,
          category: itemData.category,
          location: itemData.location || null,
          tags: itemData.tags,
          image_urls: itemData.image_urls,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('seller_id', userId); // Extra security check
      
      if (error) throw error;
    }
  },
  
  // Step 3: Sync Knowledge Base
  syncKnowledgeBase: {
    basicSync: async (itemId, itemData) => {
      const result = await syncItemWithKnowledgeBase(itemId, {
        minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
        title: itemData.title.trim(),
        description: itemData.description.trim(),
        condition: itemData.condition,
        category: itemData.category
      });
      
      if (!result.success) {
        console.warn('Knowledge base sync failed:', result.error);
      }
    }
  },
  
  // Step 4: Voice Data Processing
  voiceDataProcessing: {
    condition: "If voice input was used",
    updateVoiceData: async (itemId, voiceTranscription, itemTitle) => {
      // Update knowledge base with voice data
      await updateKnowledgeWithVoiceData(itemId, voiceTranscription);
      
      // Extract selling points
      const sellingPoints = await extractSellingPointsFromVoice(voiceTranscription, itemTitle);
      
      // Generate FAQs
      const faqs = await generateFAQsFromVoice(voiceTranscription, itemTitle);
      
      // Update knowledge base with AI content
      if (sellingPoints.length > 0 || Object.keys(faqs).length > 0) {
        await supabase
          .from('item_knowledge')
          .update({
            selling_points: sellingPoints.length > 0 ? sellingPoints : null,
            faqs: Object.keys(faqs).length > 0 ? faqs : null,
            updated_at: new Date().toISOString()
          })
          .eq('item_id', itemId);
      }
    }
  },
  
  // Step 5: Success Handling
  successHandling: {
    showToast: "Your listing and AI agent knowledge have been updated",
    redirectToMyItems: "Navigate back to My Items page"
  },
  
  // Step 6: Error Handling
  errorHandling: {
    catchErrors: "Catch and log any errors",
    showErrorToast: "Display user-friendly error message",
    keepFormData: "Don't clear form data on error"
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const editItemPageState = {
  // User State
  userState: {
    currentUser: "authenticated user object",
    isLoading: "boolean loading state"
  },
  
  // Item State
  itemState: {
    itemLoaded: "boolean item loaded state",
    itemData: {
      title: "string",
      description: "string",
      price: "string",
      minimum_price: "string",
      condition: "string",
      category: "string",
      location: "string",
      tags: "array",
      image_urls: "array"
    }
  },
  
  // UI State
  uiState: {
    isSubmitting: "boolean submitting state",
    isUploading: "boolean uploading state",
    showVoiceInput: "boolean voice modal visibility",
    isRecording: "boolean recording state",
    recordingTime: "number (seconds)",
    maxRecordingTime: 30
  },
  
  // Voice State
  voiceState: {
    voiceTranscription: "string transcript",
    hasVoiceInput: "boolean voice used",
    voiceTargetField: "title | description | intelligent"
  }
};
```

### 2. Voice Input Implementation

#### Mobile Voice Recording
```javascript
const mobileVoiceRecording = {
  // Request Microphone Permission
  requestPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });
      return { success: true, stream };
    } catch (error) {
      return { success: false, error: 'Microphone permission denied' };
    }
  },
  
  // Start Recording
  startRecording: async () => {
    const { success, stream } = await requestPermission();
    if (!success) {
      showToast('Microphone access denied');
      return;
    }
    
    // Choose MIME type based on support
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }
    
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.start(1000); // Collect data every second
    
    setIsRecording(true);
    setRecordingTime(0);
  },
  
  // Stop Recording
  stopRecording: () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  },
  
  // Process Audio
  processAudio: async (audioBlob) => {
    // Convert to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Send to Whisper API
    const response = await fetch('/api/whisper-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: base64Audio })
    });
    
    const result = await response.json();
    
    if (result.success) {
      applyTranscription(result.transcript);
    }
  }
};
```

### 3. Mobile-Specific Features

#### Touch Optimizations
```javascript
const touchOptimizations = {
  // Touch-Friendly Controls
  touchControls: {
    largeButtons: "Minimum 44x44 touch targets",
    voiceButton: "Large, easy-to-tap voice button",
    imageRemove: "Large X button on image thumbnails",
    dragHandles: "Easy-to-grab drag handles for reordering"
  },
  
  // Gesture Support
  gestureSupport: {
    swipeToRemoveImage: "Swipe left to remove image",
    pinchToZoom: "Pinch to zoom on image preview",
    longPressVoice: "Long press for continuous recording"
  },
  
  // Mobile UI Adaptations
  mobileUIAdaptations: {
    fullScreenVoiceModal: "Full-screen voice input modal",
    bottomSheetPickers: "Bottom sheet for category/condition selection",
    stickyHeader: "Sticky header with save button",
    scrollToError: "Auto-scroll to first validation error"
  }
};
```

#### Native Integrations
```javascript
const nativeIntegrations = {
  // Camera Integration
  cameraIntegration: {
    openCamera: "Native camera for taking new photos",
    photoLibrary: "Access to photo library",
    multipleSelection: "Select multiple images at once"
  },
  
  // Microphone Integration
  microphoneIntegration: {
    nativeAudioRecording: "Native audio recording APIs",
    audioPermissions: "Request microphone permissions",
    audioPlayback: "Playback recorded audio (optional)"
  },
  
  // Haptic Feedback
  hapticFeedback: {
    recordingStart: "Light haptic on recording start",
    recordingStop: "Medium haptic on recording stop",
    imageRemove: "Light haptic on image removal",
    formSubmit: "Success haptic on form submission"
  }
};
```

### 4. Offline Support

#### Offline Capabilities
```javascript
const offlineCapabilities = {
  // Local Draft Saving
  localDraftSaving: {
    autoSave: "Auto-save form data to local storage every 30 seconds",
    restoreOnLoad: "Restore draft on page load if available",
    clearOnSubmit: "Clear draft after successful submission"
  },
  
  // Queue System
  queueSystem: {
    queueUpdates: "Queue item updates when offline",
    syncOnOnline: "Sync queued updates when connection restored",
    conflictResolution: "Handle conflicts if item was updated elsewhere"
  },
  
  // Offline Indicators
  offlineIndicators: {
    showBanner: "Display 'Offline - Changes will be saved' banner",
    disableSubmit: "Disable submit button when offline",
    enableAfterSync: "Enable submit after sync completes"
  }
};
```

## Configuration Options

### 1. Edit Configuration

#### Edit Settings
```javascript
const editSettings = {
  // Form Configuration
  formConfiguration: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    validateOnChange: true,
    showCharacterCounts: true,
    enableVoiceInput: true
  },
  
  // Image Configuration
  imageConfiguration: {
    maxImages: 5,
    minImages: 1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ["image/jpeg", "image/png", "image/webp"],
    compressionEnabled: true
  },
  
  // Voice Configuration
  voiceConfiguration: {
    enabledVoiceInput: true,
    maxRecordingDuration: 30, // seconds
    audioFormat: "webm",
    sampleRate: 16000,
    enableIntelligentParsing: true
  }
};
```

### 2. Knowledge Base Sync Configuration

#### Sync Settings
```javascript
const syncSettings = {
  // Sync Behavior
  syncBehavior: {
    syncOnUpdate: true,
    syncOnVoiceInput: true,
    retryOnFailure: true,
    maxRetries: 3,
    failSilently: true // Don't fail update if sync fails
  },
  
  // Sync Fields
  syncFields: [
    "minimum_price",
    "title",
    "description",
    "condition",
    "category",
    "voice_transcription",
    "selling_points",
    "faqs"
  ],
  
  // AI Content Generation
  aiContentGeneration: {
    generateSellingPoints: true,
    generateFAQs: true,
    useGPT35: true, // Or GPT-4 for higher quality
    maxTokens: 300
  }
};
```

### 3. Mobile Configuration

#### Mobile Settings
```javascript
const mobileSettings = {
  // Performance
  performance: {
    imageCompression: true,
    lazyLoadImages: true,
    throttleValidation: 300, // ms
    debounceAutoSave: 1000 // ms
  },
  
  // User Experience
  userExperience: {
    hapticFeedback: true,
    gestureSupport: true,
    fullScreenModals: true,
    nativeCameraPicker: true
  },
  
  // Offline Support
  offlineSupport: {
    enableOfflineEditing: true,
    localDraftSaving: true,
    syncQueueing: true
  }
};
```

## Database Schema

### Items Table (Updated Fields)
```sql
-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  minimum_price DECIMAL(10, 2), -- For negotiation
  condition TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  tags TEXT[],
  image_urls TEXT[] NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() -- Updated on edit
);

-- Index for seller items
CREATE INDEX idx_items_seller_id ON items(seller_id);

-- Index for updated items
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);
```

### Item Knowledge Table (Synced on Edit)
```sql
-- Item knowledge base table
CREATE TABLE item_knowledge (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  minimum_price DECIMAL(10, 2),
  negotiation_enabled BOOLEAN DEFAULT true,
  additional_info JSONB, -- Includes voice_transcription
  selling_points TEXT[], -- AI-generated from voice
  faqs JSONB, -- AI-generated from voice
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(), -- Updated on edit
  UNIQUE(item_id)
);

-- Index for item knowledge lookups
CREATE INDEX idx_item_knowledge_item_id ON item_knowledge(item_id);
```

## Unique Edit Item Features

### 1. Ownership Verification
- ✅ Verify seller_id matches current user before allowing edit
- ✅ Redirect to My Items if ownership check fails
- ✅ Extra security check in database update (eq('seller_id', userId))

### 2. Voice-to-Text Integration
- ✅ Multiple voice input targets (title, description, intelligent)
- ✅ 30-second recording with real-time timer
- ✅ Whisper API transcription for high accuracy
- ✅ Intelligent AI parsing to extract structured data

### 3. Automatic Knowledge Base Sync
- ✅ Update item_knowledge table on every save
- ✅ Preserve existing AI-generated content
- ✅ Sync voice transcription data
- ✅ Generate selling points and FAQs from voice
- ✅ Ensure AI agent has latest item information

### 4. Image Management
- ✅ Display existing images with thumbnails
- ✅ Upload new images to Supabase Storage
- ✅ Remove images from array (without deleting from storage)
- ✅ Reorder images via drag-and-drop
- ✅ Filter out invalid URLs (blob URLs, broken links)

### 5. Real-time Validation
- ✅ Character count for title (100) and description (1000)
- ✅ Price validation (must be > 0)
- ✅ Minimum price validation (must be ≤ price)
- ✅ Image validation (at least 1 required)
- ✅ Real-time error display

### 6. Mobile Optimizations
- ✅ Touch-friendly controls with large buttons
- ✅ Native camera integration for replacing images
- ✅ Full-screen voice input modal
- ✅ Haptic feedback on actions
- ✅ Offline draft saving
- ✅ Gesture support (swipe to remove)

This comprehensive Edit Item page configuration provides everything needed for a complete mobile app implementation, including ownership verification, voice-to-text, automatic AI agent knowledge base updates, intelligent content generation, image management, real-time validation, and mobile optimizations! 🚀
