# Theme Settings Page Configuration for Mobile App

This document provides comprehensive information about the "Theme Settings" page functionality, including all customization options, role-based access control (admin/super admin only), preset themes, live preview system, color management, and mobile-specific optimizations for the theme customization system.

## Overview

The Theme Settings page is an **admin and super admin only** page that allows authorized users to customize the visual appearance of the marketplace, including colors for item cards, bundle cards, advertisements, AI agent interface, action buttons, and promotional elements. It features a real-time preview system, preset themes, color pickers, and saves settings to localStorage for instant application.

## Access Control

### 1. Role-Based Access Control

#### User Roles
```javascript
const userRoles = {
  // Admin Role
  admin: {
    canAccessThemeSettings: true,
    canModifyThemes: true,
    canApplyPresets: true,
    canSaveThemes: true,
    permissions: ["view", "edit", "save", "reset"]
  },
  
  // Super Admin Role
  super_admin: {
    canAccessThemeSettings: true,
    canModifyThemes: true,
    canApplyPresets: true,
    canSaveThemes: true,
    canManageSystemThemes: true,
    permissions: ["view", "edit", "save", "reset", "manage", "admin"]
  },
  
  // Regular Users (seller, individual, user)
  regularUsers: {
    canAccessThemeSettings: false,
    canModifyThemes: false,
    canApplyPresets: false,
    canSaveThemes: false,
    permissions: []
  }
};
```

#### Access Check Implementation
```javascript
const accessControlImplementation = {
  // Page Load Access Check
  checkPageAccess: async () => {
    try {
      const user = await User.me();
      
      // Check if user is admin or super_admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        toast({
          title: "Access Denied",
          description: "This page is restricted to administrators only.",
          variant: "destructive"
        });
        
        // Redirect to home or appropriate page
        navigate(createPageUrl('Home'));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Access check error:', error);
      navigate(createPageUrl('Home'));
      return false;
    }
  },
  
  // Navigation Menu Filtering
  filterNavigationMenu: (navigationItems, currentUser) => {
    return navigationItems.filter(item => {
      // Filter out admin-only items unless user is admin/super_admin
      if (item.adminOnly && 
          !(currentUser?.role === 'admin' || currentUser?.role === 'super_admin')) {
        return false;
      }
      
      return true;
    });
  }
};
```

#### Database Role Configuration
```sql
-- Profiles table with role column
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'super_admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Check constraint for valid roles
ALTER TABLE profiles
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Comment for documentation
COMMENT ON COLUMN profiles.role IS 'User role for access control. Values: user, admin, super_admin';
```

#### Making a User Super Admin
```sql
-- Update a user to super_admin role
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';

-- Verify the change
SELECT id, email, full_name, role
FROM profiles
WHERE role IN ('admin', 'super_admin');
```

### 2. Navigation Menu Integration

#### Admin-Only Menu Item
```javascript
const navigationMenuIntegration = {
  // Navigation Item Configuration
  themeSettingsMenuItem: {
    name: "Theme Settings",
    icon: "Palette",
    url: createPageUrl("ThemeSettings"),
    adminOnly: true, // This marks it as admin-only
    description: "Customize marketplace appearance"
  },
  
  // Menu Filtering Logic
  filterMenuItems: (items, user) => {
    return items.filter(item => {
      // Show admin-only items only to admin/super_admin
      if (item.adminOnly && 
          !(user?.role === 'admin' || user?.role === 'super_admin')) {
        return false;
      }
      
      return true;
    });
  }
};
```

## Core Features

### 1. Theme Customization System

#### Customizable Elements
```javascript
const customizableElements = {
  // Standard Item Cards
  standardItemCards: {
    cardBackgroundGradient: {
      from: "cardFrom (e.g., #1e3a8a)",
      to: "cardTo (e.g., #581c87)"
    },
    buttonGradient: {
      from: "buttonFrom (e.g., #a855f7)",
      to: "buttonTo (e.g., #db2777)"
    },
    accentColor: "Price and highlight color (e.g., #22d3ee)",
    descriptionColor: "Secondary text color (e.g., #9ca3af)"
  },
  
  // Action Buttons
  actionButtons: {
    addToCartButton: {
      from: "addToCartFrom (e.g., #a855f7)",
      to: "addToCartTo (e.g., #db2777)"
    },
    buyNowButton: {
      from: "buyNowFrom (e.g., #10b981)",
      to: "buyNowTo (e.g., #059669)"
    }
  },
  
  // AI Agent Interface
  aiAgentInterface: {
    background: {
      from: "agentBackgroundFrom (e.g., #581c87)",
      to: "agentBackgroundTo (e.g., #be185d)"
    },
    header: {
      from: "agentHeaderFrom (e.g., #7c3aed)",
      to: "agentHeaderTo (e.g., #ec4899)"
    },
    iconBackground: {
      from: "agentIconFrom (e.g., #a855f7)",
      to: "agentIconTo (e.g., #ec4899)"
    }
  },
  
  // Bundle Cards
  bundleCards: {
    cardBackground: {
      from: "bundleCardFrom (e.g., #059669)",
      to: "bundleCardTo (e.g., #047857)"
    },
    buttonGradient: {
      from: "bundleButtonFrom (e.g., #10b981)",
      to: "bundleButtonTo (e.g., #059669)"
    },
    accentColor: "bundleAccentColor (e.g., #6ee7b7)",
    descriptionColor: "bundleDescriptionColor (e.g., #9ca3af)"
  },
  
  // Advertisement Cards
  advertisementCards: {
    topBanner: {
      background: { from: "adBannerFrom", to: "adBannerTo" },
      border: "adBorderColor",
      button: { from: "adButtonFrom", to: "adButtonTo" }
    },
    localDeals: {
      background: { from: "localDealsFrom", to: "localDealsTo" },
      border: "localDealsBorder",
      button: { from: "localDealsButtonFrom", to: "localDealsButtonTo" }
    },
    bottomBanner: {
      background: { from: "bottomBannerFrom", to: "bottomBannerTo" },
      border: "bottomBannerBorder",
      button: { from: "bottomBannerButtonFrom", to: "bottomBannerButtonTo" }
    },
    specialOffers: {
      background: { from: "specialOffersFrom", to: "specialOffersTo" },
      border: "specialOffersBorder",
      button: { from: "specialOffersButtonFrom", to: "specialOffersButtonTo" }
    },
    featuredItems: {
      background: { from: "featuredFrom", to: "featuredTo" },
      border: "featuredBorder",
      button: { from: "featuredButtonFrom", to: "featuredButtonTo" }
    },
    promotedItems: {
      background: { from: "promotedFrom", to: "promotedTo" },
      border: "promotedBorder",
      button: { from: "promotedButtonFrom", to: "promotedButtonTo" }
    }
  }
};
```

#### Theme Data Structure
```javascript
const themeDataStructure = {
  // Complete Theme Object
  themeObject: {
    // Standard Item Cards
    cardFrom: '#1e3a8a',
    cardTo: '#581c87',
    buttonFrom: '#a855f7',
    buttonTo: '#db2777',
    accentColor: '#22d3ee',
    descriptionColor: '#9ca3af',
    
    // Action Buttons
    addToCartFrom: '#a855f7',
    addToCartTo: '#db2777',
    buyNowFrom: '#10b981',
    buyNowTo: '#059669',
    
    // AI Agent
    agentBackgroundFrom: '#581c87',
    agentBackgroundTo: '#be185d',
    agentHeaderFrom: '#7c3aed',
    agentHeaderTo: '#ec4899',
    agentIconFrom: '#a855f7',
    agentIconTo: '#ec4899',
    
    // Bundle Cards
    bundleCardFrom: '#059669',
    bundleCardTo: '#047857',
    bundleButtonFrom: '#10b981',
    bundleButtonTo: '#059669',
    bundleAccentColor: '#6ee7b7',
    bundleDescriptionColor: '#9ca3af',
    
    // Advertisements (multiple types)
    adBannerFrom: '#701a75',
    adBannerTo: '#1f2937',
    adBorderColor: '#a21caf',
    adButtonFrom: '#22d3ee',
    adButtonTo: '#3b82f6',
    
    localDealsFrom: '#059669',
    localDealsTo: '#047857',
    localDealsBorder: '#10b981',
    localDealsButtonFrom: '#22c55e',
    localDealsButtonTo: '#16a34a',
    
    bottomBannerFrom: '#7c2d12',
    bottomBannerTo: '#9a3412',
    bottomBannerBorder: '#ea580c',
    bottomBannerButtonFrom: '#f97316',
    bottomBannerButtonTo: '#ea580c',
    
    specialOffersFrom: '#be185d',
    specialOffersTo: '#9d174d',
    specialOffersBorder: '#ec4899',
    specialOffersButtonFrom: '#f472b6',
    specialOffersButtonTo: '#ec4899',
    
    featuredFrom: '#7c3aed',
    featuredTo: '#6d28d9',
    featuredBorder: '#8b5cf6',
    featuredButtonFrom: '#a855f7',
    featuredButtonTo: '#9333ea',
    
    promotedFrom: '#0891b2',
    promotedTo: '#0e7490',
    promotedBorder: '#06b6d4',
    promotedButtonFrom: '#22d3ee',
    promotedButtonTo: '#06b6d4'
  }
};
```

### 2. Preset Themes System

#### Available Presets
```javascript
const presetThemes = {
  // Navy to Purple (Default)
  'Navy to Purple': {
    description: "Deep navy blue to purple gradient with cyan accents",
    cardFrom: '#1e3a8a',
    cardTo: '#581c87',
    buttonFrom: '#a855f7',
    buttonTo: '#db2777',
    accentColor: '#22d3ee',
    // ... all other colors
  },
  
  // Dark Slate
  'Dark Slate': {
    description: "Dark slate tones with purple and pink accents",
    cardFrom: '#334155',
    cardTo: '#475569',
    buttonFrom: '#a855f7',
    buttonTo: '#db2777',
    accentColor: '#22d3ee',
    // ... all other colors
  },
  
  // Ocean Blue
  'Ocean Blue': {
    description: "Ocean blue and cyan color scheme",
    cardFrom: '#1e40af',
    cardTo: '#164e63',
    buttonFrom: '#3b82f6',
    buttonTo: '#0891b2',
    accentColor: '#93c5fd',
    // ... all other colors
  },
  
  // Sunset
  'Sunset': {
    description: "Warm orange and pink sunset colors",
    cardFrom: '#9a3412',
    cardTo: '#831843',
    buttonFrom: '#f97316',
    buttonTo: '#db2777',
    accentColor: '#fdba74',
    // ... all other colors
  },
  
  // Forest
  'Forest': {
    description: "Forest greens and emerald tones",
    cardFrom: '#14532d',
    cardTo: '#064e3b',
    buttonFrom: '#22c55e',
    buttonTo: '#10b981',
    accentColor: '#86efac',
    // ... all other colors
  },
  
  // Royal
  'Royal': {
    description: "Royal purple and indigo theme",
    cardFrom: '#581c87',
    cardTo: '#312e81',
    buttonFrom: '#a855f7',
    buttonTo: '#6366f1',
    accentColor: '#c4b5fd',
    // ... all other colors
  }
};
```

#### Preset Application
```javascript
const presetApplication = {
  // Apply Preset
  applyPreset: (presetName) => {
    const preset = THEME_PRESETS[presetName];
    
    if (!preset) {
      toast({
        title: "Error",
        description: "Invalid preset selected",
        variant: "destructive"
      });
      return;
    }
    
    // Update theme state with all preset values
    setTheme(preset);
    
    // Show success notification
    toast({
      title: "Preset Applied",
      description: `"${presetName}" preset has been applied. Click Save to keep it.`
    });
  },
  
  // Preview Preset
  previewPreset: (preset) => {
    // Show mini preview card
    return (
      <div 
        className="p-4 h-48 rounded-lg"
        style={{
          background: `linear-gradient(to bottom right, ${preset.cardFrom}, ${preset.cardTo})`
        }}
      >
        {/* Preview content */}
      </div>
    );
  }
};
```

### 3. Live Preview System

#### Preview Components
```javascript
const previewComponents = {
  // Standard Item Card Preview
  standardItemPreview: {
    component: "ItemCard",
    shows: [
      "Card background gradient",
      "Button gradient",
      "Accent color (price)",
      "Description text color"
    ],
    realTime: true
  },
  
  // Bundle Card Preview
  bundleCardPreview: {
    component: "BundleCard",
    shows: [
      "Bundle card gradient",
      "Bundle button gradient",
      "Bundle accent color",
      "Bundle description color"
    ],
    realTime: true
  },
  
  // Advertisement Previews
  advertisementPreviews: {
    topBanner: "Top banner ad preview",
    localDeals: "Local deals card preview",
    bottomBanner: "Bottom banner ad preview",
    specialOffers: "Special offers card preview",
    featuredItems: "Featured items card preview",
    promotedItems: "Promoted items card preview"
  }
};
```

#### Preview Rendering
```javascript
const previewRendering = {
  // Render Live Preview
  renderPreview: (theme) => {
    return (
      <div className="space-y-8">
        {/* Standard Item Card */}
        <div 
          className="rounded-2xl shadow-2xl p-6 border-2"
          style={{
            background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`,
            borderColor: theme.accentColor + '30'
          }}
        >
          <div className="bg-gray-800 rounded-lg h-48 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sample Item Title</h3>
          <p style={{ color: theme.descriptionColor }}>
            Sample description text
          </p>
          <div 
            className="text-3xl font-bold mb-4"
            style={{ color: theme.accentColor }}
          >
            $99.99
          </div>
          <button
            className="w-full rounded-lg py-2 font-semibold"
            style={{
              background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
            }}
          >
            View Details
          </button>
        </div>
        
        {/* Bundle Card Preview */}
        <div 
          className="rounded-2xl shadow-2xl p-6 border-2"
          style={{
            background: `linear-gradient(to bottom right, ${theme.bundleCardFrom}, ${theme.bundleCardTo})`,
            borderColor: theme.bundleAccentColor + '30'
          }}
        >
          {/* Bundle preview content */}
        </div>
        
        {/* Advertisement Previews */}
        {/* ... multiple ad type previews */}
      </div>
    );
  }
};
```

### 4. Color Management System

#### Color Input Methods
```javascript
const colorInputMethods = {
  // Color Picker
  colorPicker: {
    type: "native HTML color input",
    format: "hex color (#RRGGBB)",
    supports: "Visual color selection",
    onChange: (field, value) => updateThemeField(field, value)
  },
  
  // Text Input
  textInput: {
    type: "text input for hex codes",
    format: "hex string (#1e3a8a)",
    validation: "Regex pattern for hex colors",
    supports: "Direct hex code entry"
  },
  
  // Tailwind Reference
  tailwindReference: {
    type: "visual color palette",
    colors: [
      'slate', 'gray', 'zinc', 'neutral', 'stone',
      'red', 'orange', 'amber', 'yellow', 'lime', 
      'green', 'emerald', 'teal', 'cyan', 'sky', 
      'blue', 'indigo', 'violet', 'purple', 'fuchsia', 
      'pink', 'rose'
    ],
    shades: ['50', '100', '200', '300', '400', '500', 
             '600', '700', '800', '900', '950'],
    copyToClipboard: "Click to copy color class name"
  }
};
```

#### Color Validation
```javascript
const colorValidation = {
  // Validate Hex Color
  validateHexColor: (color) => {
    const hexPattern = /^#[0-9A-F]{6}$/i;
    return hexPattern.test(color);
  },
  
  // Sanitize Color Input
  sanitizeColorInput: (input) => {
    // Remove whitespace
    let sanitized = input.trim();
    
    // Add # if missing
    if (!sanitized.startsWith('#')) {
      sanitized = '#' + sanitized;
    }
    
    // Validate length
    if (sanitized.length !== 7) {
      return null;
    }
    
    // Validate format
    if (!validateHexColor(sanitized)) {
      return null;
    }
    
    return sanitized.toUpperCase();
  },
  
  // Error Handling
  handleInvalidColor: (field) => {
    toast({
      title: "Invalid Color",
      description: `Please enter a valid hex color for ${field} (e.g., #1e3a8a)`,
      variant: "destructive"
    });
  }
};
```

### 5. Theme Persistence System

#### LocalStorage Management
```javascript
const localStorageManagement = {
  // Save Theme
  saveTheme: (theme) => {
    try {
      localStorage.setItem('marketplace-theme', JSON.stringify(theme));
      
      toast({
        title: "Theme Saved!",
        description: "Your theme settings have been saved. Refresh the page to see changes on marketplace cards."
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save theme settings",
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  },
  
  // Load Theme
  loadTheme: () => {
    try {
      const saved = localStorage.getItem('marketplace-theme');
      
      if (saved) {
        const parsedTheme = JSON.parse(saved);
        return parsedTheme;
      }
      
      // Return default theme if none saved
      return THEME_PRESETS['Navy to Purple'];
    } catch (error) {
      console.error('Error loading theme:', error);
      return THEME_PRESETS['Navy to Purple'];
    }
  },
  
  // Reset Theme
  resetTheme: () => {
    const defaultTheme = THEME_PRESETS['Navy to Purple'];
    localStorage.setItem('marketplace-theme', JSON.stringify(defaultTheme));
    
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default. Refresh the page to see changes."
    });
    
    return defaultTheme;
  },
  
  // Clear Theme
  clearTheme: () => {
    localStorage.removeItem('marketplace-theme');
  }
};
```

#### Theme Application
```javascript
const themeApplication = {
  // Apply Theme to Components
  applyThemeToComponents: (theme) => {
    // Theme is loaded from localStorage in components
    // Example in ItemCard component:
    const savedTheme = localStorage.getItem('marketplace-theme');
    const theme = savedTheme ? JSON.parse(savedTheme) : defaultTheme;
    
    // Apply to card background
    const cardStyle = {
      background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`
    };
    
    // Apply to button
    const buttonStyle = {
      background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
    };
    
    // Apply to accent color
    const accentStyle = {
      color: theme.accentColor
    };
    
    return { cardStyle, buttonStyle, accentStyle };
  },
  
  // Refresh After Save
  refreshApplication: () => {
    // User must refresh page to see changes
    // Or implement real-time theme switching via React Context/Redux
    window.location.reload();
  }
};
```

## Mobile App Implementation

### 1. Page State Management

#### Component State
```javascript
const themeSettingsPageState = {
  // Theme State
  themeState: {
    theme: "current theme object",
    savedTheme: "theme from localStorage",
    defaultTheme: "default preset theme"
  },
  
  // UI State
  uiState: {
    isSaving: "boolean save state",
    activeTab: "current preview tab",
    selectedPreset: "currently selected preset"
  },
  
  // User State
  userState: {
    currentUser: "authenticated user",
    isAdmin: "boolean admin check",
    isSuperAdmin: "boolean super admin check"
  }
};
```

#### State Management
```javascript
const stateManagement = {
  // Initialize State
  initializeState: async () => {
    // Load current user
    const user = await User.me();
    setCurrentUser(user);
    
    // Check admin access
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      navigate(createPageUrl('Home'));
      return;
    }
    
    // Load saved theme or default
    const saved = localStorage.getItem('marketplace-theme');
    const theme = saved ? JSON.parse(saved) : THEME_PRESETS['Navy to Purple'];
    setTheme(theme);
  },
  
  // Update Theme Field
  updateThemeField: (field, value) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  },
  
  // Save Theme
  saveTheme: () => {
    setIsSaving(true);
    localStorage.setItem('marketplace-theme', JSON.stringify(theme));
    
    toast({
      title: "Theme Saved!",
      description: "Your theme settings have been saved."
    });
    
    setIsSaving(false);
  }
};
```

### 2. Mobile-Specific Features

#### Touch Optimizations
```javascript
const touchOptimizations = {
  // Touch-Friendly Controls
  touchControls: {
    colorPickers: "Large touch areas for color inputs",
    presetButtons: "Large, tappable preset cards",
    saveButton: "Prominent, easy-to-tap save button",
    scrolling: "Smooth scroll for long color lists"
  },
  
  // Mobile UI Adaptations
  mobileUIAdaptations: {
    responsiveLayout: "Single column on mobile, grid on tablet",
    collapsibleSections: "Collapse color sections to save space",
    stickyHeader: "Sticky header with save button",
    bottomSheet: "Bottom sheet for preset selection"
  },
  
  // Gesture Support
  gestureSupport: {
    swipeBetweenPreviews: "Swipe to view different preview types",
    longPressColorPicker: "Long press to open advanced color picker",
    pinchToZoom: "Pinch to zoom preview cards"
  }
};
```

#### Native Integrations
```javascript
const nativeIntegrations = {
  // Native Color Picker
  nativeColorPicker: {
    iOS: "Use iOS native color picker",
    android: "Use Android native color picker",
    fallback: "HTML5 color input as fallback"
  },
  
  // Haptic Feedback
  hapticFeedback: {
    colorSelect: "Light haptic on color selection",
    presetApply: "Medium haptic on preset application",
    themeSave: "Success haptic on theme save"
  },
  
  // Clipboard Integration
  clipboardIntegration: {
    copyColor: "Copy hex color to clipboard",
    pasteColor: "Paste hex color from clipboard",
    notification: "Show native toast on copy"
  }
};
```

### 3. Offline Support

#### Offline Capabilities
```javascript
const offlineCapabilities = {
  // Theme Caching
  themeCaching: {
    cacheThemes: "Cache all preset themes locally",
    cacheUserTheme: "Cache user's current theme",
    syncOnOnline: "Sync theme changes when online"
  },
  
  // Local Storage
  localStorage: {
    saveTheme: "Save theme to localStorage",
    loadTheme: "Load theme from localStorage",
    clearCache: "Clear cached themes"
  },
  
  // Offline Indicators
  offlineIndicators: {
    showBanner: "Display 'Offline - Using cached themes' banner",
    disableSave: "Disable save if critical sync required",
    enableAfterSync: "Enable save after connection restored"
  }
};
```

## Configuration Options

### 1. Theme Settings Configuration

#### Theme Configuration
```javascript
const themeConfiguration = {
  // Default Theme
  defaultTheme: "Navy to Purple",
  
  // Available Presets
  presets: [
    "Navy to Purple",
    "Dark Slate",
    "Ocean Blue",
    "Sunset",
    "Forest",
    "Royal"
  ],
  
  // Color Format
  colorFormat: "hex",
  
  // Storage Key
  storageKey: "marketplace-theme",
  
  // Auto-Save
  autoSave: false, // Manual save only
  
  // Real-Time Preview
  realTimePreview: true
};
```

### 2. Access Control Configuration

#### Admin Settings
```javascript
const adminSettings = {
  // Access Control
  accessControl: {
    requiredRoles: ["admin", "super_admin"],
    checkOnPageLoad: true,
    redirectOnFailure: createPageUrl('Home'),
    showAccessDeniedMessage: true
  },
  
  // Navigation Visibility
  navigationVisibility: {
    showInMenu: true,
    menuItemAdminOnly: true,
    menuItemIcon: "Palette",
    menuItemLabel: "Theme Settings"
  }
};
```

### 3. Mobile Configuration

#### Mobile Settings
```javascript
const mobileSettings = {
  // Layout
  layout: {
    responsiveColumns: {
      mobile: 1,
      tablet: 2,
      desktop: 2
    },
    previewPosition: "side-by-side on desktop, stacked on mobile",
    stickyControls: true
  },
  
  // Performance
  performance: {
    lazyLoadPreviews: true,
    throttleColorUpdates: 100, // ms
    debounceTextInputs: 300 // ms
  },
  
  // User Experience
  userExperience: {
    hapticFeedback: true,
    nativeColorPickers: true,
    confirmBeforeNavigating: true // If unsaved changes
  }
};
```

## Database Schema (Not Required for Theme Settings)

**Note:** Theme settings are stored in localStorage and do not require database tables. However, for centralized theme management across devices or for multi-user admin teams, you could optionally add:

### Optional: System Themes Table
```sql
-- Optional: System themes table for centralized management
CREATE TABLE IF NOT EXISTS system_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  theme_data JSONB NOT NULL, -- Complete theme object
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for active themes
CREATE INDEX idx_system_themes_active ON system_themes(is_active);

-- RLS policies for system themes
ALTER TABLE system_themes ENABLE ROW LEVEL SECURITY;

-- Only admin and super_admin can view
CREATE POLICY system_themes_select_policy ON system_themes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only admin and super_admin can insert
CREATE POLICY system_themes_insert_policy ON system_themes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only admin and super_admin can update
CREATE POLICY system_themes_update_policy ON system_themes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

## Unique Theme Settings Features

### 1. Admin-Only Access
- ✅ Restricted to admin and super_admin roles only
- ✅ Access check on page load with redirect
- ✅ Menu item filtered based on user role
- ✅ Database role-based permissions

### 2. Comprehensive Color Customization
- ✅ 30+ customizable color fields
- ✅ Separate themes for items, bundles, ads, AI agent
- ✅ Gradient support for backgrounds and buttons
- ✅ Accent and description color control

### 3. Preset Themes System
- ✅ 6 pre-designed theme presets
- ✅ Visual preview cards for each preset
- ✅ One-click preset application
- ✅ Easy comparison between presets

### 4. Real-Time Live Preview
- ✅ Instant preview of all changes
- ✅ Multiple preview types (items, bundles, ads)
- ✅ Side-by-side preview and controls
- ✅ Accurate representation of final appearance

### 5. Color Management Tools
- ✅ Native color pickers
- ✅ Manual hex code input
- ✅ Tailwind color reference palette
- ✅ Copy-to-clipboard functionality

### 6. LocalStorage Persistence
- ✅ Save theme to browser storage
- ✅ Load theme on page refresh
- ✅ Reset to default theme
- ✅ Works offline

### 7. Mobile Optimizations
- ✅ Touch-friendly color pickers
- ✅ Responsive layout (mobile/tablet/desktop)
- ✅ Native color picker integration
- ✅ Haptic feedback on actions
- ✅ Swipe gestures for previews

### 8. Multiple Advertisement Types
- ✅ Top banner ads customization
- ✅ Local deals cards styling
- ✅ Bottom banner ads styling
- ✅ Special offers cards styling
- ✅ Featured items styling
- ✅ Promoted items styling

This comprehensive Theme Settings page configuration provides everything needed for a complete mobile app implementation, including admin/super admin role-based access control, extensive color customization, preset themes, live preview system, mobile optimizations, and all technical details required for the mobile app builder! 🎨
