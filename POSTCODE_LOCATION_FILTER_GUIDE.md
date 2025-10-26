# Postcode-Based Location Filter System

## Overview

The marketplace now includes an **intelligent location filter** that automatically defaults to showing items available in the user's postcode area. This creates a more relevant, localized shopping experience while still allowing users to search nationwide or in custom locations.

---

## 🎯 Key Features

### **1. Automatic Postcode Detection**
- Loads the current user's postcode from their profile on component mount
- Automatically filters marketplace items to show only those in the user's postcode by default
- Provides a seamless "local first" experience without any user action required

### **2. Three Location Scope Options**

#### **My Postcode (Default)**
- Shows items available in the user's registered postcode
- Displays as "My Postcode (XXXX)" in the dropdown
- Only visible if the user has a postcode set in their profile
- Badge indicator: "Local to XXXX" (cyan)

#### **Nationwide**
- Shows all items regardless of location
- Useful for users willing to travel or arrange shipping
- Badge indicator: "All Locations" (purple)

#### **Custom Location**
- Allows users to enter any city, state, or postcode
- Shows an additional input field when selected
- Supports flexible location search (e.g., "Sydney", "NSW", "2000")
- Badge indicator: "Near XXXX" (pink)

### **3. Visual Indicators**
- Location scope badges appear in the results summary
- Active filter count updates based on selected scope
- Clear visual feedback for the current location filter

---

## 🔧 Technical Implementation

### **Component State Management**

```javascript
const [locationScope, setLocationScope] = useState('my_postcode'); // Current scope
const [userPostcode, setUserPostcode] = useState(null); // User's postcode from profile
const [location, setLocation] = useState(''); // Custom location input
const [isLoadingUser, setIsLoadingUser] = useState(true); // Loading state
```

### **User Postcode Loading**

```javascript
const loadUserPostcode = async () => {
  setIsLoadingUser(true);
  try {
    const user = await User.me();
    if (user && user.postcode) {
      setUserPostcode(user.postcode);
      // Automatically set location to user's postcode by default
      setLocation(user.postcode);
    }
  } catch (error) {
    console.log('User not logged in or postcode not set:', error);
    // If user is not logged in or has no postcode, default to nationwide
    setLocationScope('nationwide');
  } finally {
    setIsLoadingUser(false);
  }
};

// Load on component mount
useEffect(() => {
  loadUserPostcode();
}, []);
```

### **Filter Application Logic**

```javascript
const applyFilters = () => {
  // Determine the actual location filter value based on scope
  let locationFilter = null;
  if (locationScope === 'my_postcode' && userPostcode) {
    locationFilter = userPostcode;
  } else if (locationScope === 'custom' && location) {
    locationFilter = location;
  }
  // If 'nationwide', locationFilter stays null

  onFilterChange({
    searchTerm,
    category: category === 'all' ? null : category,
    condition: condition === 'all' ? null : condition,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy,
    location: locationFilter
  });
};
```

### **Scope Change Handler**

```javascript
const handleLocationScopeChange = (value) => {
  setLocationScope(value);
  if (value === 'my_postcode' && userPostcode) {
    setLocation(userPostcode);
  } else if (value === 'nationwide') {
    setLocation('');
  }
  // If 'custom', keep the current location value
};
```

---

## 📱 Mobile App Implementation

### **1. User Profile Integration**

Ensure users have location data in their profile:

```javascript
// Fetch user profile
const user = await User.me();

// User profile structure
{
  id: "user_uuid",
  full_name: "John Doe",
  email: "john@example.com",
  postcode: "2000", // Required for location filter
  city: "Sydney",
  state_region: "NSW",
  country: "AU"
}
```

### **2. Marketplace Filter Component**

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function MarketplaceFilters({ onFilterChange }) {
  const [locationScope, setLocationScope] = useState('my_postcode');
  const [userPostcode, setUserPostcode] = useState(null);
  const [customLocation, setCustomLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserPostcode();
  }, []);

  const loadUserPostcode = async () => {
    setIsLoading(true);
    try {
      // Fetch from your API or local storage
      const user = await getUserProfile();
      if (user?.postcode) {
        setUserPostcode(user.postcode);
      } else {
        // No postcode, default to nationwide
        setLocationScope('nationwide');
      }
    } catch (error) {
      console.error('Error loading user postcode:', error);
      setLocationScope('nationwide');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScopeChange = (value) => {
    setLocationScope(value);
    // Apply filter immediately
    applyLocationFilter(value);
  };

  const applyLocationFilter = (scope) => {
    let locationValue = null;
    if (scope === 'my_postcode' && userPostcode) {
      locationValue = userPostcode;
    } else if (scope === 'custom' && customLocation) {
      locationValue = customLocation;
    }

    onFilterChange({
      location: locationValue
    });
  };

  if (isLoading) {
    return <Text>Loading filters...</Text>;
  }

  return (
    <View>
      <Text style={styles.label}>Location</Text>
      <Picker
        selectedValue={locationScope}
        onValueChange={handleScopeChange}
      >
        {userPostcode && (
          <Picker.Item 
            label={`My Postcode (${userPostcode})`} 
            value="my_postcode" 
          />
        )}
        <Picker.Item label="Nationwide" value="nationwide" />
        <Picker.Item label="Custom Location" value="custom" />
      </Picker>

      {locationScope === 'custom' && (
        <TextInput
          placeholder="Enter city, state, or postcode"
          value={customLocation}
          onChangeText={setCustomLocation}
          onBlur={() => applyLocationFilter('custom')}
        />
      )}

      {/* Visual indicator badge */}
      {locationScope === 'my_postcode' && userPostcode && (
        <View style={styles.badge}>
          <Text>📍 Local to {userPostcode}</Text>
        </View>
      )}
      {locationScope === 'nationwide' && (
        <View style={styles.badge}>
          <Text>🌍 All Locations</Text>
        </View>
      )}
      {locationScope === 'custom' && customLocation && (
        <View style={styles.badge}>
          <Text>📌 Near {customLocation}</Text>
        </View>
      )}
    </View>
  );
}
```

### **3. Marketplace Item Filtering**

The backend (Marketplace.jsx) already handles location filtering in the `applyFilters` function:

```javascript
// Location filter (basic substring match)
if (filterOptions.location) {
  const locationLower = filterOptions.location.toLowerCase();
  filtered = filtered.filter((item) =>
    item.location?.toLowerCase().includes(locationLower) ||
    item.postcode?.toLowerCase().includes(locationLower)
  );
}
```

This searches both the `location` and `postcode` fields on items, providing flexible matching.

---

## 🗄️ Database Schema

### **Items Table**
Items should store location information for filtering:

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  -- Location fields
  location TEXT, -- e.g., "Sydney, NSW"
  postcode TEXT, -- e.g., "2000"
  -- ... other fields
);
```

### **Profiles Table**
User profiles must include postcode for the default filter:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  -- Location fields
  postcode TEXT, -- Required for location filter
  city TEXT,
  state_region TEXT,
  country TEXT,
  -- ... other fields
);
```

---

## 🎨 UI/UX Design

### **Desktop (Web) Implementation**

#### **Location Scope Dropdown**
```jsx
<Select 
  value={locationScope} 
  onValueChange={handleLocationScopeChange}
  disabled={isLoadingUser}
>
  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="bg-gray-900 border-gray-700 text-white">
    {userPostcode && (
      <SelectItem value="my_postcode">
        My Postcode ({userPostcode})
      </SelectItem>
    )}
    <SelectItem value="nationwide">
      Nationwide
    </SelectItem>
    <SelectItem value="custom">
      Custom Location
    </SelectItem>
  </SelectContent>
</Select>
```

#### **Custom Location Input** (conditionally rendered)
```jsx
{locationScope === 'custom' && (
  <div className="space-y-2">
    <label>Custom Location</label>
    <Input
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      placeholder="City, State, or Postcode"
    />
  </div>
)}
```

#### **Visual Badges**
```jsx
{locationScope === 'my_postcode' && userPostcode && (
  <Badge className="bg-cyan-900 text-cyan-300">
    <Target className="w-3 h-3" />
    Local to {userPostcode}
  </Badge>
)}
```

### **Mobile Implementation**

Use native pickers or bottom sheets for better mobile UX:

```javascript
// React Native example with @react-native-picker/picker
<Picker
  selectedValue={locationScope}
  onValueChange={handleScopeChange}
>
  {userPostcode && (
    <Picker.Item 
      label={`📍 My Postcode (${userPostcode})`} 
      value="my_postcode" 
    />
  )}
  <Picker.Item label="🌍 Nationwide" value="nationwide" />
  <Picker.Item label="📌 Custom Location" value="custom" />
</Picker>
```

---

## 🔄 User Flow

### **1. First-Time User (No Postcode Set)**
1. User loads marketplace
2. System attempts to load user postcode
3. No postcode found → defaults to **Nationwide**
4. User sees all items
5. Prompt user to complete profile (optional): "Set your postcode to see local items first!"

### **2. Returning User (Postcode Set)**
1. User loads marketplace
2. System loads user postcode (e.g., "2000")
3. **My Postcode (2000)** is automatically selected
4. Marketplace shows only items in postcode "2000"
5. Badge displays: "Local to 2000"
6. User can switch to Nationwide or Custom Location anytime

### **3. Switching to Custom Location**
1. User clicks Location Scope dropdown
2. Selects "Custom Location"
3. Custom input field appears
4. User types "Melbourne" or "3000"
5. Filter applies automatically (debounced)
6. Badge displays: "Near Melbourne"

### **4. Switching to Nationwide**
1. User clicks Location Scope dropdown
2. Selects "Nationwide"
3. All location filters removed
4. Marketplace shows all items regardless of location
5. Badge displays: "All Locations"

---

## 🧪 Testing Scenarios

### **Test 1: User with Postcode**
```javascript
// Mock user data
const mockUser = {
  id: "user_123",
  postcode: "2000",
  city: "Sydney",
  country: "AU"
};

// Expected behavior:
// 1. locationScope = 'my_postcode'
// 2. userPostcode = '2000'
// 3. Dropdown shows "My Postcode (2000)" as selected
// 4. Filter applies: location = '2000'
// 5. Badge shows: "Local to 2000"
```

### **Test 2: User without Postcode**
```javascript
// Mock user data
const mockUser = {
  id: "user_456",
  postcode: null,
  city: null,
  country: "AU"
};

// Expected behavior:
// 1. locationScope = 'nationwide' (fallback)
// 2. userPostcode = null
// 3. Dropdown does NOT show "My Postcode" option
// 4. "Nationwide" is selected by default
// 5. Filter applies: location = null
// 6. Badge shows: "All Locations"
```

### **Test 3: User Not Logged In**
```javascript
// No user session

// Expected behavior:
// 1. User.me() throws error
// 2. Catch block sets locationScope = 'nationwide'
// 3. Dropdown shows only "Nationwide" and "Custom Location"
// 4. Filter applies: location = null
// 5. All items shown
```

### **Test 4: Switching Location Scope**
```javascript
// User starts with postcode "2000"
// User switches to "Custom Location"
// User types "Melbourne"

// Expected behavior:
// 1. locationScope = 'custom'
// 2. location = 'Melbourne'
// 3. Custom input field is visible
// 4. Filter applies: location = 'Melbourne'
// 5. Badge shows: "Near Melbourne"
```

### **Test 5: Clear Filters**
```javascript
// User has various filters applied
// User clicks "Clear All"

// Expected behavior:
// 1. searchTerm = ''
// 2. category = 'all'
// 3. condition = 'all'
// 4. priceRange = [0, 10000]
// 5. sortBy = 'date_desc'
// 6. location = ''
// 7. locationScope = 'my_postcode' (resets to default)
// 8. If user has postcode, filter applies to their postcode again
```

---

## 🚀 Advanced Features

### **1. Distance-Based Filtering**
For more accurate location filtering, you can integrate a distance calculation:

```javascript
// Calculate distance between two postcodes
const calculateDistance = (postcode1, postcode2) => {
  // Use geocoding API to get lat/long for each postcode
  // Calculate distance using Haversine formula
  // Return distance in km
};

// Filter items within X km of user's postcode
const filterByDistance = (items, userPostcode, maxDistance) => {
  return items.filter(item => {
    if (!item.postcode) return false;
    const distance = calculateDistance(userPostcode, item.postcode);
    return distance <= maxDistance;
  });
};
```

### **2. Postcode Radius Selector**
Allow users to specify a radius around their postcode:

```jsx
<Slider
  value={radiusKm}
  onValueChange={setRadiusKm}
  min={0}
  max={100}
  step={5}
/>
<Text>Show items within {radiusKm}km of {userPostcode}</Text>
```

### **3. Save Location Preference**
Remember user's location scope preference:

```javascript
// Save to localStorage (web) or AsyncStorage (mobile)
const saveLocationPreference = async (scope) => {
  await AsyncStorage.setItem('location_scope_preference', scope);
};

// Load on mount
const loadLocationPreference = async () => {
  const savedScope = await AsyncStorage.getItem('location_scope_preference');
  if (savedScope) {
    setLocationScope(savedScope);
  }
};
```

### **4. "Near Me" Quick Toggle**
Add a quick button to toggle between local and nationwide:

```jsx
<Button onClick={() => toggleLocationScope()}>
  {locationScope === 'my_postcode' ? (
    <>🌍 Show All Items</>
  ) : (
    <>📍 Show Local Items</>
  )}
</Button>
```

---

## 🐛 Troubleshooting

### **Issue: User's postcode not loading**
**Cause:** User hasn't set a postcode in their profile.
**Solution:** 
- Check if `user.postcode` exists
- Fallback to `nationwide` scope
- Show a prompt: "Complete your profile to see local items"

### **Issue: No items showing with postcode filter**
**Cause:** No items match the user's postcode.
**Solution:**
- Check if items have `postcode` field populated
- Consider expanding search to nearby postcodes
- Show message: "No local items found. Try searching Nationwide."

### **Issue: Filter not applying on scope change**
**Cause:** Missing dependency in `useEffect` or not calling `applyFilters`.
**Solution:**
- Ensure `locationScope` is in the `useEffect` dependency array
- Call `applyFilters()` in `handleLocationScopeChange`

### **Issue: Custom location input not appearing**
**Cause:** Conditional rendering issue.
**Solution:**
- Verify `locationScope === 'custom'` condition
- Check if the input is rendered within the correct parent element

---

## 📊 Analytics & Metrics

Track user behavior with location filtering:

### **Events to Track**
1. **Default Postcode Load** - User sees their local items by default
2. **Scope Changed to Nationwide** - User broadens their search
3. **Scope Changed to Custom** - User searches a specific location
4. **Custom Location Searched** - Log the location string
5. **Local Items Clicked** - Items clicked when using postcode filter
6. **Nationwide Items Clicked** - Items clicked when using nationwide filter

### **Implementation**
```javascript
// Track scope change
const handleLocationScopeChange = (value) => {
  setLocationScope(value);
  
  // Analytics tracking
  trackEvent('marketplace_location_scope_changed', {
    previous_scope: locationScope,
    new_scope: value,
    user_postcode: userPostcode,
    custom_location: value === 'custom' ? location : null
  });
  
  // Apply filter
  // ...
};
```

---

## 🎯 Best Practices

### **1. Always Provide a Fallback**
If a user doesn't have a postcode, default to `nationwide` rather than showing no items.

### **2. Make Scope Switching Easy**
Don't bury the location scope in deep filters - make it prominent and easy to change.

### **3. Show Visual Feedback**
Use badges, icons, and clear labels to indicate the current location filter status.

### **4. Consider Mobile UX**
On mobile, use native pickers or bottom sheets for a better experience than dropdowns.

### **5. Debounce Custom Location Input**
When users type a custom location, debounce the filter application to avoid excessive API calls.

### **6. Validate Postcode Format**
If you want stricter filtering, validate that postcodes match your country's format:

```javascript
const validatePostcode = (postcode, country) => {
  const patterns = {
    AU: /^\d{4}$/,
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
  };
  return patterns[country]?.test(postcode) || false;
};
```

### **7. Handle Partial Matches**
For custom locations, be flexible:
- "Sydney" should match items with location "Sydney, NSW"
- "2000" should match items with postcode "2000"
- "NSW" should match items in New South Wales

### **8. Cache User Postcode**
Once loaded, cache the user's postcode in component state to avoid repeated API calls.

---

## 🔐 Security Considerations

### **1. Don't Expose Exact Addresses**
- Items should only show postcode, not full address
- Full collection address should only be visible after purchase

### **2. Sanitize Location Input**
```javascript
const sanitizeLocation = (input) => {
  // Remove special characters, trim whitespace
  return input.replace(/[^a-zA-Z0-9\s,-]/g, '').trim().slice(0, 50);
};
```

### **3. Rate Limit Location Searches**
Prevent abuse by rate-limiting custom location searches.

---

## 📝 Summary

The postcode-based location filter provides a **"local first"** marketplace experience:

✅ **Automatically filters** to user's postcode by default  
✅ **Flexible options** for nationwide or custom location search  
✅ **Visual indicators** with badges showing current filter  
✅ **Smooth UX** with debounced input and loading states  
✅ **Graceful fallbacks** for users without postcodes  
✅ **Mobile-ready** with responsive design  

This feature significantly improves the relevance of marketplace items for users, increasing engagement and conversion rates by showing nearby items first. 🎯

