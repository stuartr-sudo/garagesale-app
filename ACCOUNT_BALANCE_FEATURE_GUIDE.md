# Account Balance Feature - Complete Implementation Guide

## 📊 Overview

The **Account Balance** feature displays the **seller's accumulated earnings** from completed sales. It is **ONLY visible to users with `account_type = 'seller'`** and appears in the **sidebar/navigation area** of the platform.

---

## ❗ IMPORTANT: NOT a Feature Flag System

**The app builder's response mentions "feature flags"** - this is a **MISUNDERSTANDING**. There is **NO feature flag system** in this platform. The account balance simply uses **role-based visibility** (`account_type = 'seller'`).

### What IS Implemented:
✅ **Seller Balance Widget** - displays seller earnings  
✅ **Role-based visibility** - only shown to sellers  
✅ **Privacy toggle** - show/hide balance  
✅ **Database tracking** - automatic balance updates on sale  

### What is NOT Implemented:
❌ **Feature flags system** - no dynamic feature control  
❌ **Complex toggle system** - just simple if/else based on `account_type`  
❌ **Supabase feature flags table** - doesn't exist  

---

## 🎯 What "Account Balance" Represents

### **Seller Earnings Only**

The account balance represents:
- **Total earnings from completed sales**
- **Automatically calculated as 95% of sale price** (5% platform fee)
- **Updated when order status changes to "completed"**
- **Does NOT represent buyer wallet/credit** (no buyer balance exists)

### Example Calculation:
```
Item Price: $100.00
Platform Fee (5%): $5.00
Seller Receives: $95.00
→ seller_balance increases by $95.00
```

---

## 🗄️ Database Schema

### **Profiles Table**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  account_type TEXT CHECK (account_type IN ('individual', 'seller')),
  seller_balance DECIMAL(10,2) DEFAULT 0.00, -- Only for sellers
  -- ... other fields
);
```

### **Orders Table Trigger**
When an order is completed, the seller's balance is automatically updated:

```sql
CREATE OR REPLACE FUNCTION update_seller_balance_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles
    SET seller_balance = seller_balance + (NEW.total_amount * 0.95)
    WHERE id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seller_balance
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_balance_on_sale();
```

---

## 🎨 Current Web Implementation

### **Location: Sidebar (Desktop)**
The balance widget appears in the sidebar, **above the navigation menu**, and is **only visible to sellers**.

### **SellerBalanceWidget Component**
Located at: `src/components/store/SellerBalanceWidget.jsx`

```javascript
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SellerBalanceWidget({ userId }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadBalance();
  }, [userId]);

  const loadBalance = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_balance')
        .eq('id', userId)
        .single();

      setBalance(profile?.seller_balance || 0);
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={createPageUrl("Settings")}>
      <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800 hover:border-green-600 transition-all cursor-pointer group">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Seller Balance</p>
                <p className="text-lg font-bold text-green-400 group-hover:text-green-300 transition-colors">
                  {showBalance ? `$${balance.toFixed(2)}` : '••••'}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowBalance(!showBalance);
              }}
              className="p-1 hover:bg-green-800/30 rounded transition-colors"
            >
              {showBalance ? (
                <Eye className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {balance > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>Click to view earnings</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

### **Integration in Layout**
Located at: `src/pages/Layout.jsx` (lines 365-368)

```javascript
{/* Seller Balance Widget */}
{currentUser?.account_type === 'seller' && (
  <div className="mb-3">
    <SellerBalanceWidget userId={currentUser.id} />
  </div>
)}
```

---

## 📱 Mobile App Implementation

### **Option 1: Navigation Header (Recommended for Mobile)**

Display balance in the top navigation bar:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from './supabase';
import { DollarSign, Eye, EyeOff } from 'lucide-react-native';

export default function SellerBalanceHeader({ userId, navigation }) {
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
    
    // Set up real-time subscription for balance updates
    const subscription = supabase
      .channel('seller_balance_updates')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, 
        (payload) => {
          if (payload.new.seller_balance !== undefined) {
            setBalance(payload.new.seller_balance);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadBalance = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_balance')
        .eq('id', userId)
        .single();

      setBalance(profile?.seller_balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = () => {
    setShowBalance(!showBalance);
  };

  const navigateToEarnings = () => {
    navigation.navigate('Settings', { tab: 'earnings' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={navigateToEarnings}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <DollarSign color="#10B981" size={20} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.amount}>
          {showBalance ? `$${balance.toFixed(2)}` : '••••'}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={(e) => {
          e.stopPropagation();
          toggleVisibility();
        }}
        style={styles.toggleButton}
      >
        {showBalance ? (
          <Eye color="#9CA3AF" size={18} />
        ) : (
          <EyeOff color="#9CA3AF" size={18} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#047857',
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  toggleButton: {
    padding: 8,
  },
});
```

### **Option 2: Profile Screen**

Display balance prominently on the seller's profile:

```javascript
// In SellerProfileScreen.jsx
<View style={styles.balanceCard}>
  <View style={styles.balanceHeader}>
    <Text style={styles.balanceTitle}>Available Balance</Text>
    <TouchableOpacity onPress={toggleBalance}>
      {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
    </TouchableOpacity>
  </View>
  <Text style={styles.balanceAmount}>
    {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
  </Text>
  <Text style={styles.balanceSubtext}>
    From {completedSalesCount} completed sales
  </Text>
  <TouchableOpacity style={styles.withdrawButton}>
    <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
  </TouchableOpacity>
</View>
```

### **Option 3: Seller Hub/Dashboard**

Create a dedicated earnings screen:

```javascript
// In SellerHubScreen.jsx or EarningsScreen.jsx
export default function EarningsScreen({ userId }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    averageOrderValue: 0
  });

  // Load balance, transactions, and calculate stats
  // Display in a detailed dashboard format

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatsCard title="This Month" value={`$${stats.thisMonth}`} />
        <StatsCard title="Last Month" value={`$${stats.lastMonth}`} />
        <StatsCard title="Avg. Order" value={`$${stats.averageOrderValue}`} />
      </View>

      {/* Transaction History */}
      <View style={styles.transactionList}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.map(tx => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </View>
    </ScrollView>
  );
}
```

---

## 🔧 Key Implementation Details

### **1. Role-Based Visibility**

```javascript
// Check if user is a seller before displaying balance
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type, seller_balance')
      .eq('id', user.id)
      .single();
    
    setCurrentUser({ ...user, ...profile });
  };
  loadUser();
}, []);

// Conditionally render balance widget
{currentUser?.account_type === 'seller' && (
  <SellerBalanceWidget userId={currentUser.id} />
)}
```

### **2. Real-Time Balance Updates**

```javascript
// Subscribe to balance changes
useEffect(() => {
  const subscription = supabase
    .channel('balance_updates')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, (payload) => {
      if (payload.new.seller_balance !== undefined) {
        setBalance(payload.new.seller_balance);
        // Show toast notification
        showNotification(`Balance updated: $${payload.new.seller_balance.toFixed(2)}`);
      }
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [userId]);
```

### **3. Privacy Toggle (Show/Hide)**

```javascript
const [showBalance, setShowBalance] = useState(true);

// Store preference in AsyncStorage (React Native)
const toggleBalance = async () => {
  const newState = !showBalance;
  setShowBalance(newState);
  await AsyncStorage.setItem('show_seller_balance', JSON.stringify(newState));
};

// Load preference on mount
useEffect(() => {
  const loadPreference = async () => {
    const saved = await AsyncStorage.getItem('show_seller_balance');
    if (saved !== null) {
      setShowBalance(JSON.parse(saved));
    }
  };
  loadPreference();
}, []);
```

### **4. Balance Breakdown / Detailed View**

```javascript
// Fetch transaction history for detailed earnings view
const loadTransactionHistory = async () => {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      created_at,
      status,
      items:item_id (
        id,
        title,
        price,
        image_urls
      ),
      buyers:buyer_id (
        id,
        full_name
      )
    `)
    .eq('seller_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  // Calculate seller earnings (95% of total_amount)
  const transactions = orders.map(order => ({
    ...order,
    seller_earnings: order.total_amount * 0.95,
    platform_fee: order.total_amount * 0.05
  }));

  return transactions;
};
```

---

## 🎨 UI/UX Design Patterns

### **Visual Design**
- **Color**: Green (`#10B981`, `#047857`) - represents money/earnings
- **Icon**: Dollar sign ($) or wallet icon
- **Typography**: Bold for amount, small for label
- **Animation**: Smooth transitions, celebratory animation on balance increase

### **Mobile Best Practices**
1. **Prominent but Not Intrusive**: Display in header or top of profile, not blocking content
2. **Tap to View Details**: Tapping balance navigates to full earnings breakdown
3. **Privacy First**: Default to showing balance, but easy toggle to hide
4. **Real-Time Updates**: Use Supabase Realtime to update without refresh
5. **Loading States**: Show skeleton or spinner while loading
6. **Error Handling**: Gracefully handle failed balance fetch

---

## 🔐 Security Considerations

### **RLS Policies**
Ensure users can only see their own balance:

```sql
-- Existing RLS policy (already in place)
CREATE POLICY "users_see_own_balance" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### **Mobile API Security**
```javascript
// Always fetch with authenticated user
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  throw new Error('User not authenticated');
}

// Supabase will automatically enforce RLS
const { data: profile } = await supabase
  .from('profiles')
  .select('seller_balance')
  .eq('id', session.user.id)
  .single();
```

---

## 📊 Analytics & Tracking

### **Events to Track**
1. **Balance Viewed** - when balance widget is displayed
2. **Balance Hidden** - when user toggles visibility off
3. **Balance Clicked** - when user taps to view details
4. **Earnings Screen Viewed** - when detailed earnings page is opened

### **Implementation**
```javascript
import analytics from '@react-native-firebase/analytics';

const trackBalanceView = async () => {
  await analytics().logEvent('balance_viewed', {
    user_id: userId,
    balance_amount: balance,
    timestamp: new Date().toISOString()
  });
};

const trackBalanceClick = async () => {
  await analytics().logEvent('balance_clicked', {
    user_id: userId,
    balance_amount: balance,
    destination: 'earnings_screen'
  });
};
```

---

## 🧪 Testing Scenarios

### **Test 1: Seller with $0 Balance**
```javascript
// Mock user
const mockUser = {
  id: 'seller_123',
  account_type: 'seller',
  seller_balance: 0.00
};

// Expected behavior:
// 1. Widget displays "$0.00"
// 2. No "Request Withdrawal" button (balance too low)
// 3. Prompts to "Start selling to earn!"
```

### **Test 2: Seller with Positive Balance**
```javascript
// Mock user
const mockUser = {
  id: 'seller_456',
  account_type: 'seller',
  seller_balance: 247.50
};

// Expected behavior:
// 1. Widget displays "$247.50"
// 2. "Request Withdrawal" button available
// 3. Clicking navigates to earnings detail
// 4. Toggle button hides/shows amount
```

### **Test 3: Individual (Buyer) Account**
```javascript
// Mock user
const mockUser = {
  id: 'buyer_789',
  account_type: 'individual',
  seller_balance: 0.00
};

// Expected behavior:
// 1. Balance widget NOT displayed
// 2. No earnings-related UI elements
// 3. Only buyer features visible
```

### **Test 4: Balance Update (Real-Time)**
```javascript
// Simulate order completion
const simulateOrderCompletion = async () => {
  // Complete an order (trigger database update)
  await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', 'order_123');
  
  // Expected behavior:
  // 1. seller_balance increases automatically (trigger)
  // 2. Real-time subscription detects change
  // 3. Balance widget updates without refresh
  // 4. Optional: Show toast notification
};
```

---

## 🚀 Recommended Implementation for Mobile App

### **Step 1: Add Balance to Navigation Header**
Place the balance widget in the top navigation bar (similar to cart icon):

```javascript
// In MainNavigator.jsx or AppHeader.jsx
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
    <Logo />
  </TouchableOpacity>
  
  <View style={styles.headerRight}>
    {/* Seller Balance (if seller) */}
    {currentUser?.account_type === 'seller' && (
      <SellerBalanceHeader 
        userId={currentUser.id} 
        navigation={navigation} 
      />
    )}
    
    {/* Cart Icon */}
    <CartIcon />
    
    {/* Notifications */}
    <NotificationIcon />
  </View>
</View>
```

### **Step 2: Create Detailed Earnings Screen**
Add a dedicated screen for viewing earnings breakdown:

```javascript
// EarningsScreen.jsx
// Full transaction history
// Monthly/yearly stats
// Withdrawal request functionality
```

### **Step 3: Real-Time Updates**
Implement Supabase Realtime subscription to update balance automatically when orders complete.

### **Step 4: Privacy Controls**
Save show/hide preference in AsyncStorage and respect it across app restarts.

---

## 📋 Summary

### **What to Implement:**
✅ **Option 1 (Recommended):** Account Balance in Navigation Header  
✅ **Option 3 (Recommended):** Detailed Earnings Screen in Seller Hub  
✅ Privacy toggle (show/hide balance)  
✅ Real-time balance updates via Supabase Realtime  
✅ Role-based visibility (sellers only)  

### **What NOT to Implement:**
❌ Feature flags system (doesn't exist in this platform)  
❌ Buyer wallet/balance (not a feature)  
❌ Manual balance management (auto-calculated via trigger)  

### **Database Fields Required:**
- `profiles.account_type` (existing - 'individual' or 'seller')
- `profiles.seller_balance` (existing - DECIMAL(10,2))

### **No Additional Database Setup Needed:**
The seller balance system is **already fully configured** in the database with automatic triggers. The mobile app just needs to:
1. Fetch `seller_balance` from `profiles` table
2. Display it conditionally for sellers
3. Subscribe to real-time updates

---

## 🎯 Next Steps for App Builder

**Recommended Action:**
Implement **Option 1 (Navigation Header)** + **Option 3 (Earnings Screen)**:

1. Create `SellerBalanceHeader.jsx` component for top navigation
2. Create `EarningsScreen.jsx` for detailed earnings view
3. Add conditional rendering based on `account_type === 'seller'`
4. Implement privacy toggle with AsyncStorage persistence
5. Set up Supabase Realtime subscription for live updates

**No feature flags system needed** - just simple role-based visibility! 🚀

