# Payment Confirmations Page Configuration for Mobile App

This document provides comprehensive information about the **Payment Confirmations** page, which is a **critical seller accountability system** that requires sellers to confirm receipt of payments within strict deadlines. This system prevents fraud, ensures transaction transparency, and enforces seller responsibility with automatic account restrictions.

---

## 1. Overview

### Purpose
The Payment Confirmations page is a **seller-only dashboard** where sellers must acknowledge receipt of payments from buyers. This system:

- **Ensures seller accountability** for received payments
- **Prevents payment fraud** and disputes
- **Tracks payment confirmation deadlines** with timezone awareness
- **Automatically restricts accounts** when sellers miss deadlines
- **Provides transparency** to buyers about payment status
- **Enforces business hours logic** for fair deadline calculation

### Key Features
```javascript
const paymentConfirmationsFeatures = {
  sellerDashboard: "View all pending payment confirmations",
  timeBasedDeadlines: "12 hours (business hours) or 24 hours (after hours)",
  automaticRestrictions: "Account restricted if deadlines missed",
  realTimeCountdowns: "Live countdown timers for each confirmation",
  statusTracking: "Pending, Critical, Approaching, Expired statuses",
  supportIntegration: "Contact support for payment issues",
  multiplePaymentMethods: "Bank transfer, crypto, Stripe confirmations",
  timezoneAware: "Deadlines calculated in seller's timezone"
};
```

---

## 2. User Flow

### Complete Payment Confirmation Flow
```javascript
const paymentConfirmationFlow = {
  // Step 1: Buyer completes payment
  step1_BuyerPaysForItem: {
    action: "Buyer completes payment (bank transfer, crypto, or Stripe)",
    triggers: [
      "Create payment_confirmations record",
      "Calculate confirmation deadline (12 or 24 hours)",
      "Email notification sent to seller",
      "Order status: 'payment_pending_seller_confirmation'"
    ]
  },
  
  // Step 2: Seller receives notification
  step2_SellerNotified: {
    email: "Payment confirmation required email",
    dashboard: "Red banner appears on all pages",
    notification: "Push notification (mobile)",
    content: "You have a payment confirmation requiring your attention"
  },
  
  // Step 3: Seller views Payment Confirmations page
  step3_SellerViewsPage: {
    url: "/paymentconfirmations",
    access: "Seller account only",
    displays: [
      "All pending confirmations",
      "Time remaining for each",
      "Buyer details",
      "Item details",
      "Payment amount",
      "Status badges (Pending, Approaching, Critical, Expired)"
    ]
  },
  
  // Step 4: Seller checks their bank account/wallet
  step4_SellerVerifiesPayment: {
    bankTransfer: "Check bank account for deposit with reference number",
    crypto: "Check blockchain explorer for transaction confirmation",
    stripe: "Payment already verified automatically",
    verify: "Amount matches order total"
  },
  
  // Step 5: Seller confirms payment
  step5_SellerConfirms: {
    action: "Click 'Confirm Payment Received' button",
    updates: [
      "payment_confirmations.status = 'confirmed'",
      "payment_confirmations.seller_confirmed_at = NOW()",
      "orders.status = 'payment_confirmed'",
      "Remove from pending list"
    ],
    checks: "If all confirmations complete, remove account restrictions"
  },
  
  // Step 6: Buyer notified
  step6_BuyerNotified: {
    email: "Payment confirmed by seller",
    orderStatus: "Updated to 'payment_confirmed'",
    nextSteps: "Collection/shipping details provided"
  },
  
  // Alternative: Deadline missed
  alternativeStep_DeadlineMissed: {
    cronJob: "check-payment-deadlines runs every hour",
    action: "Mark confirmation as 'expired'",
    restriction: "Set account_restricted = TRUE on profiles",
    reason: "You have missed payment confirmation deadlines",
    effects: [
      "Cannot list new items",
      "Cannot accept new orders",
      "Red warning banner on all pages",
      "Must confirm all payments to restore account"
    ]
  }
};
```

---

## 3. Database Schema

### Payment Confirmations Table
```sql
-- Main table for tracking payment confirmations
CREATE TABLE payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  payment_confirmed_at TIMESTAMPTZ NOT NULL, -- When buyer paid
  confirmation_deadline TIMESTAMPTZ NOT NULL, -- Seller must confirm by this time
  seller_confirmed_at TIMESTAMPTZ, -- When seller confirmed
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_confirmations_seller_id ON payment_confirmations(seller_id);
CREATE INDEX idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX idx_payment_confirmations_deadline ON payment_confirmations(confirmation_deadline);
```

### Profile Restrictions
```sql
-- Add restriction fields to profiles table
ALTER TABLE profiles
ADD COLUMN account_restricted BOOLEAN DEFAULT FALSE,
ADD COLUMN restriction_reason TEXT,
ADD COLUMN restriction_applied_at TIMESTAMPTZ,
ADD COLUMN timezone TEXT DEFAULT 'Australia/Sydney';
```

### Orders Table Updates
```sql
-- Add payment confirmation fields to orders
ALTER TABLE orders
ADD COLUMN payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN payment_confirmation_deadline TIMESTAMPTZ,
ADD COLUMN seller_confirmation_required BOOLEAN DEFAULT FALSE,
ADD COLUMN seller_confirmed_payment_at TIMESTAMPTZ;
```

### Support Requests Table
```sql
-- For sellers to contact support about payment issues
CREATE TABLE support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  item_name TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Deadline Calculation Logic

### Business Hours System
```javascript
const deadlineCalculationRules = {
  businessHours: {
    start: "08:00", // 8 AM
    end: "22:00", // 10 PM
    timezone: "Seller's timezone (from profiles.timezone)"
  },
  
  duringBusinessHours: {
    condition: "Payment confirmed between 8 AM - 10 PM",
    deadline: "12 hours from payment time",
    example: "Payment at 2:00 PM → Deadline at 2:00 AM next day"
  },
  
  outsideBusinessHours: {
    condition: "Payment confirmed between 10 PM - 8 AM",
    deadline: "24 hours from payment time",
    example: "Payment at 11:00 PM → Deadline at 11:00 PM next day"
  },
  
  fairnessRationale: "Sellers get more time if payment arrives overnight"
};
```

### Deadline Calculation Function (Database)
```sql
-- Function: Calculate confirmation deadline based on business hours
CREATE OR REPLACE FUNCTION calculate_confirmation_deadline(
  payment_time TIMESTAMPTZ,
  seller_timezone TEXT DEFAULT 'Australia/Sydney'
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  local_time TIME;
  business_start TIME := '08:00:00';
  business_end TIME := '22:00:00';
  deadline TIMESTAMPTZ;
BEGIN
  -- Convert payment time to seller's timezone
  local_time := (payment_time AT TIME ZONE seller_timezone)::TIME;
  
  -- Check if within business hours (8 AM - 10 PM)
  IF local_time >= business_start AND local_time < business_end THEN
    -- During business hours: 12 hour deadline
    deadline := payment_time + INTERVAL '12 hours';
  ELSE
    -- Outside business hours: 24 hour deadline
    deadline := payment_time + INTERVAL '24 hours';
  END IF;
  
  RETURN deadline;
END;
$$ LANGUAGE plpgsql;
```

### JavaScript Deadline Calculation (Frontend)
```javascript
// utils/timezone.js
export const calculateConfirmationDeadline = (paymentTime, timezone = 'Australia/Sydney') => {
  const businessStart = 8; // 8 AM
  const businessEnd = 22; // 10 PM
  
  // Convert to seller's timezone
  const localTime = new Date(paymentTime).toLocaleString('en-US', {
    timeZone: timezone,
    hour12: false
  });
  
  const hour = parseInt(localTime.split(':')[0]);
  
  // During business hours: 12 hours
  // Outside business hours: 24 hours
  const hoursToAdd = (hour >= businessStart && hour < businessEnd) ? 12 : 24;
  
  const deadline = new Date(paymentTime);
  deadline.setHours(deadline.getHours() + hoursToAdd);
  
  return deadline;
};
```

---

## 5. Automatic Restriction System

### Cron Job: Check Payment Deadlines
```javascript
// api/check-payment-deadlines.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Verify cron authentication
  const authHeader = req.headers.authorization;
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Checking payment confirmation deadlines...');

    // Call database function to check and apply restrictions
    const { data: expiredCount, error } = await supabase
      .rpc('check_payment_confirmation_deadlines');

    if (error) throw error;

    console.log('✅ Deadline check completed:', {
      expiredConfirmations: expiredCount,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      expiredConfirmations: expiredCount,
      message: `Applied restrictions to ${expiredCount} expired confirmations`
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({
      error: 'Cron job failed',
      details: error.message
    });
  }
}
```

### Database Function: Check Deadlines
```sql
-- Function: Check for expired confirmations and apply restrictions
CREATE OR REPLACE FUNCTION check_payment_confirmation_deadlines()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  seller_record RECORD;
BEGIN
  -- Find all pending confirmations past their deadline
  FOR seller_record IN
    SELECT DISTINCT seller_id
    FROM payment_confirmations
    WHERE status = 'pending'
      AND confirmation_deadline < NOW()
  LOOP
    -- Mark confirmations as expired
    UPDATE payment_confirmations
    SET status = 'expired'
    WHERE seller_id = seller_record.seller_id
      AND status = 'pending'
      AND confirmation_deadline < NOW();
    
    -- Apply account restriction
    UPDATE profiles
    SET 
      account_restricted = TRUE,
      restriction_reason = 'You have missed payment confirmation deadlines. Please confirm all pending payments.',
      restriction_applied_at = NOW()
    WHERE id = seller_record.seller_id;
    
    expired_count := expired_count + 1;
    
    -- TODO: Send email notification to seller
    -- TODO: Log restriction event
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
```

### Cron Schedule (Vercel)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/check-payment-deadlines",
      "schedule": "0 * * * *"
    }
  ]
}
```
**Explanation:** Runs every hour (at the top of the hour) to check for expired payment confirmations.

---

## 6. Mobile App Implementation

### Main Page Component
```javascript
// PaymentConfirmationsPage.jsx
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import PaymentConfirmationDashboard from '@/components/PaymentConfirmationDashboard';
import AccountRestrictionBanner from '@/components/AccountRestrictionBanner';

export default function PaymentConfirmationsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      // Redirect to login
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Account Restriction Banner */}
      <AccountRestrictionBanner userId={currentUser.id} />

      {/* Header */}
      <View style={styles.header}>
        <Icon name="clock" size={32} color="#3B82F6" />
        <Text style={styles.title}>Payment Confirmations</Text>
        <Text style={styles.subtitle}>
          Confirm receipt of payments from buyers
        </Text>
      </View>

      {/* Information Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Payment Confirmations Work</Text>
        <Text style={styles.infoText}>
          1. <Text style={styles.bold}>Buyer Payment:</Text> When a buyer completes payment, you'll receive a notification.
        </Text>
        <Text style={styles.infoText}>
          2. <Text style={styles.bold}>Confirmation Required:</Text> You must confirm receipt within the deadline:
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Business Hours (8 AM - 10 PM):</Text> 12 hours to confirm
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Outside Business Hours:</Text> 24 hours to confirm
        </Text>
        <Text style={styles.infoText}>
          3. <Text style={styles.bold}>Consequences:</Text> Missing the deadline will restrict your account until all payments are confirmed.
        </Text>
      </Card>

      {/* Payment Confirmation Dashboard */}
      <PaymentConfirmationDashboard sellerId={currentUser.id} />
    </View>
  );
}
```

### Payment Confirmation Dashboard Component
```javascript
// PaymentConfirmationDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  getPendingConfirmations, 
  confirmPaymentReceived, 
  checkAccountRestrictions 
} from '@/api/paymentConfirmations';
import { formatTimeRemaining } from '@/utils/timezone';

export default function PaymentConfirmationDashboard({ sellerId }) {
  const [confirmations, setConfirmations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');

  useEffect(() => {
    loadData();
    // Refresh every minute to update countdown timers
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const loadData = async () => {
    try {
      // Load pending confirmations
      const confirmationsResult = await getPendingConfirmations(sellerId);
      if (confirmationsResult.success) {
        setConfirmations(confirmationsResult.confirmations);
      }

      // Check account restrictions
      const restrictionsResult = await checkAccountRestrictions(sellerId);
      if (restrictionsResult.success) {
        setIsRestricted(restrictionsResult.isRestricted);
        setRestrictionReason(restrictionsResult.restrictionReason);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async (confirmationId) => {
    try {
      const result = await confirmPaymentReceived(confirmationId, sellerId);
      
      if (result.success) {
        alert('Payment confirmed successfully!');
        await loadData(); // Reload data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    }
  };

  const getStatusColor = (confirmation) => {
    const now = new Date();
    const deadline = new Date(confirmation.confirmation_deadline);
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
    
    if (now > deadline) return '#EF4444'; // Red - Expired
    if (hoursRemaining <= 2) return '#EF4444'; // Red - Critical
    if (hoursRemaining <= 6) return '#F59E0B'; // Yellow - Approaching
    return '#10B981'; // Green - Pending
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Account Restriction Alert */}
      {isRestricted && (
        <Alert severity="error" style={styles.restrictionAlert}>
          <Text style={styles.alertTitle}>Account Restricted</Text>
          <Text style={styles.alertText}>{restrictionReason}</Text>
          <Text style={styles.alertText}>
            Please confirm all pending payments to restore your account.
          </Text>
        </Alert>
      )}

      {/* No Pending Confirmations */}
      {confirmations.length === 0 && !isRestricted && (
        <Card style={styles.emptyCard}>
          <Icon name="check-circle" size={64} color="#10B981" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>
            No pending payment confirmations at this time.
          </Text>
        </Card>
      )}

      {/* Pending Confirmations List */}
      {confirmations.map((confirmation) => {
        const statusColor = getStatusColor(confirmation);
        const timeRemaining = formatTimeRemaining(confirmation.confirmation_deadline);
        
        return (
          <Card key={confirmation.id} style={styles.confirmationCard}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Icon name="dollar-sign" size={24} color="#3B82F6" />
                <View>
                  <Text style={styles.cardTitle}>Payment Confirmation Required</Text>
                  <Text style={styles.cardSubtitle}>
                    Order #{confirmation.order_id.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Badge color={statusColor}>
                {timeRemaining}
              </Badge>
            </View>

            {/* Item & Buyer Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Item:</Text>
                <Text style={styles.detailValue}>{confirmation.item?.title}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Buyer:</Text>
                <Text style={styles.detailValue}>
                  {confirmation.buyer?.full_name || confirmation.buyer?.email}
                </Text>
              </View>
            </View>

            {/* Payment Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  ${confirmation.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Paid:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(confirmation.payment_confirmed_at)}
                </Text>
              </View>
            </View>

            {/* Time Remaining */}
            <View style={[styles.timeRemaining, { backgroundColor: statusColor + '20' }]}>
              <Text style={styles.timeLabel}>Time Remaining:</Text>
              <Text style={[styles.timeValue, { color: statusColor }]}>
                {timeRemaining}
              </Text>
              <Text style={styles.deadline}>
                Deadline: {formatDate(confirmation.confirmation_deadline)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title="Confirm Payment Received"
                onPress={() => handleConfirmPayment(confirmation.id)}
                color="#10B981"
                disabled={new Date() > new Date(confirmation.confirmation_deadline)}
                icon="check-circle"
              />
              <Button
                title="Contact Support"
                onPress={() => handleContactSupport(confirmation)}
                variant="outline"
                icon="mail"
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
```

---

## 7. API Functions

### Payment Confirmations API
```javascript
// api/paymentConfirmations.js
import { supabase } from '@/lib/supabase';
import { calculateConfirmationDeadline } from '@/utils/timezone';

/**
 * Create payment confirmation record
 */
export async function createPaymentConfirmation({
  orderId,
  sellerId,
  buyerId,
  itemId,
  amount,
  sellerTimezone = 'Australia/Sydney'
}) {
  try {
    const { data, error } = await supabase
      .rpc('create_payment_confirmation', {
        p_order_id: orderId,
        p_seller_id: sellerId,
        p_buyer_id: buyerId,
        p_item_id: itemId,
        p_amount: amount,
        p_seller_timezone: sellerTimezone
      });

    if (error) throw error;

    return {
      success: true,
      confirmationId: data
    };
  } catch (error) {
    console.error('Create payment confirmation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get pending payment confirmations for seller
 */
export async function getPendingConfirmations(sellerId) {
  try {
    const { data, error } = await supabase
      .from('payment_confirmations')
      .select(`
        id,
        order_id,
        amount,
        payment_confirmed_at,
        confirmation_deadline,
        status,
        created_at,
        item:items(
          id,
          title,
          image_urls
        ),
        buyer:buyer_id(
          id,
          email,
          full_name
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'pending')
      .order('confirmation_deadline', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      confirmations: data || []
    };
  } catch (error) {
    console.error('Get pending confirmations error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Confirm payment received by seller
 */
export async function confirmPaymentReceived(confirmationId, sellerId) {
  try {
    const { data, error } = await supabase
      .rpc('confirm_payment_received', {
        p_confirmation_id: confirmationId,
        p_seller_id: sellerId
      });

    if (error) throw error;

    return {
      success: true,
      confirmed: data
    };
  } catch (error) {
    console.error('Confirm payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if seller account is restricted
 */
export async function checkAccountRestrictions(sellerId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_restricted, restriction_reason, restriction_applied_at')
      .eq('id', sellerId)
      .single();

    if (error) throw error;

    return {
      success: true,
      isRestricted: data?.account_restricted || false,
      restrictionReason: data?.restriction_reason,
      restrictionAppliedAt: data?.restriction_applied_at
    };
  } catch (error) {
    console.error('Check restrictions error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 8. Utility Functions

### Timezone & Time Formatting
```javascript
// utils/timezone.js

/**
 * Calculate confirmation deadline
 */
export const calculateConfirmationDeadline = (paymentTime, timezone = 'Australia/Sydney') => {
  const businessStart = 8; // 8 AM
  const businessEnd = 22; // 10 PM
  
  const localTime = new Date(paymentTime).toLocaleString('en-US', {
    timeZone: timezone,
    hour12: false
  });
  
  const hour = parseInt(localTime.split(':')[0]);
  
  // During business hours: 12 hours, Outside: 24 hours
  const hoursToAdd = (hour >= businessStart && hour < businessEnd) ? 12 : 24;
  
  const deadline = new Date(paymentTime);
  deadline.setHours(deadline.getHours() + hoursToAdd);
  
  return deadline;
};

/**
 * Format time remaining until deadline
 */
export const formatTimeRemaining = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;
  
  if (diff < 0) {
    return 'EXPIRED';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Check if deadline is approaching (< 6 hours)
 */
export const isDeadlineApproaching = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = (deadlineDate - now) / (1000 * 60 * 60);
  
  return hoursRemaining > 0 && hoursRemaining <= 6;
};

/**
 * Check if deadline is critical (< 2 hours)
 */
export const isDeadlineCritical = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = (deadlineDate - now) / (1000 * 60 * 60);
  
  return hoursRemaining > 0 && hoursRemaining <= 2;
};

/**
 * Get user's timezone (or default)
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Australia/Sydney';
  }
};

/**
 * Format date in user's timezone
 */
export const formatDateInTimezone = (date, timezone = null) => {
  const tz = timezone || getUserTimezone();
  
  return new Date(date).toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

---

## 9. Account Restriction Banner

### Global Banner Component
```javascript
// AccountRestrictionBanner.jsx
import React, { useState, useEffect } from 'react';
import { checkAccountRestrictions, getPendingConfirmations } from '@/api/paymentConfirmations';
import { useNavigate } from 'react-router-dom';

export default function AccountRestrictionBanner({ userId }) {
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      checkRestrictionStatus();
    }
  }, [userId]);

  const checkRestrictionStatus = async () => {
    try {
      // Check restrictions
      const restrictionsResult = await checkAccountRestrictions(userId);
      if (restrictionsResult.success) {
        setIsRestricted(restrictionsResult.isRestricted);
        setRestrictionReason(restrictionsResult.restrictionReason);
      }

      // Get pending count
      const confirmationsResult = await getPendingConfirmations(userId);
      if (confirmationsResult.success) {
        setPendingCount(confirmationsResult.confirmations.length);
      }
    } catch (error) {
      console.error('Error checking restriction status:', error);
    }
  };

  if (!isRestricted) {
    return null;
  }

  return (
    <Alert severity="error" style={styles.banner}>
      <View style={styles.bannerContent}>
        <Icon name="alert-triangle" size={24} color="#EF4444" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Account Restricted</Text>
          <Text style={styles.bannerDescription}>{restrictionReason}</Text>
          <Text style={styles.bannerInfo}>
            You have {pendingCount} pending payment confirmation{pendingCount > 1 ? 's' : ''}.
          </Text>
        </View>
        <View style={styles.bannerButtons}>
          <Button
            title="View Confirmations"
            onPress={() => navigate('/paymentconfirmations')}
            color="#EF4444"
            icon="external-link"
          />
          <Button
            title="Contact Support"
            onPress={() => handleContactSupport()}
            variant="outline"
            icon="mail"
          />
        </View>
      </View>
    </Alert>
  );
}
```

**Implementation Note:** This banner should appear on **all pages** when a seller's account is restricted, not just the Payment Confirmations page.

---

## 10. Integration with Payment Flow

### When to Create Payment Confirmation
```javascript
const paymentConfirmationTriggers = {
  bankTransfer: {
    trigger: "User clicks 'I've Completed the Transfer'",
    timing: "Create confirmation immediately",
    reason: "Needs manual seller verification"
  },
  
  crypto: {
    trigger: "User submits transaction hash",
    timing: "Create confirmation immediately",
    reason: "Needs manual blockchain verification"
  },
  
  stripe: {
    trigger: "Payment intent status = 'succeeded'",
    timing: "DO NOT create confirmation",
    reason: "Stripe verifies automatically - no seller action needed"
  }
};
```

### Payment Completion Handler
```javascript
// In PaymentWizard or order creation logic
const handlePaymentComplete = async (paymentData) => {
  const { 
    paymentMethod, 
    itemId, 
    buyerId, 
    sellerId, 
    amount 
  } = paymentData;
  
  // Create order
  const order = await createOrder({
    item_id: itemId,
    buyer_id: buyerId,
    seller_id: sellerId,
    total_amount: amount,
    payment_method: paymentMethod,
    status: paymentMethod === 'stripe' ? 'payment_confirmed' : 'payment_pending_seller_confirmation'
  });
  
  // Only create payment confirmation for bank_transfer and crypto
  if (paymentMethod === 'bank_transfer' || paymentMethod === 'crypto') {
    // Get seller's timezone
    const { data: seller } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', sellerId)
      .single();
    
    // Create payment confirmation
    await createPaymentConfirmation({
      orderId: order.id,
      sellerId: sellerId,
      buyerId: buyerId,
      itemId: itemId,
      amount: amount,
      sellerTimezone: seller?.timezone || 'Australia/Sydney'
    });
    
    // Send email to seller
    await sendPaymentConfirmationEmail(sellerId, order);
  }
  
  return order;
};
```

---

## 11. Email Notifications

### Payment Confirmation Required Email
```javascript
const paymentConfirmationEmailTemplate = {
  to: "seller@example.com",
  subject: "⏰ Payment Confirmation Required - [Item Title]",
  body: `
    Hi [Seller Name],
    
    A buyer has completed payment for your item "[Item Title]".
    
    CONFIRMATION REQUIRED BY: [Deadline Date & Time]
    
    Order Details:
    - Item: [Item Title]
    - Buyer: [Buyer Name]
    - Amount: $[Amount]
    - Payment Method: [Bank Transfer / Cryptocurrency]
    
    Action Required:
    1. Check your [bank account / crypto wallet] for the payment
    2. Verify the amount matches: $[Amount]
    3. Click below to confirm payment received
    
    [Confirm Payment Button]
    
    Important: You must confirm receipt within [12/24] hours or your account will be restricted.
    
    Questions? Contact support at support@example.com
  `
};
```

### Account Restriction Email
```javascript
const accountRestrictionEmailTemplate = {
  to: "seller@example.com",
  subject: "⚠️ Account Restricted - Payment Confirmation Required",
  body: `
    Hi [Seller Name],
    
    Your account has been restricted due to missed payment confirmation deadlines.
    
    You have [X] pending payment confirmations that need your immediate attention.
    
    Your account restrictions:
    - Cannot list new items
    - Cannot accept new orders
    - Existing orders unaffected
    
    To restore your account:
    1. Visit the Payment Confirmations page
    2. Confirm all pending payments
    3. Your account will be automatically restored
    
    [View Payment Confirmations Button]
    
    Need help? Contact support at support@example.com
  `
};
```

---

## 12. Mobile-Specific Features

### Push Notifications
```javascript
const pushNotificationSetup = {
  // When payment confirmation required
  onPaymentReceived: {
    title: "Payment Confirmation Required",
    body: "A buyer has paid for [Item Title]. Confirm within [12/24] hours.",
    action: "Open Payment Confirmations",
    priority: "high",
    sound: "default"
  },
  
  // 2 hours before deadline
  twoHoursRemaining: {
    title: "⚠️ Payment Deadline Approaching",
    body: "2 hours left to confirm payment for [Item Title]",
    action: "Open Payment Confirmations",
    priority: "high",
    sound: "urgent"
  },
  
  // When account restricted
  accountRestricted: {
    title: "⛔ Account Restricted",
    body: "Your account has been restricted. Confirm payments now.",
    action: "Open Payment Confirmations",
    priority: "max",
    sound: "urgent"
  }
};
```

### Pull-to-Refresh
```javascript
const pullToRefreshImplementation = {
  component: "ScrollView / FlatList with RefreshControl",
  action: "Reload pending confirmations",
  feedback: "Spinner animation",
  updateTimers: "Recalculate all countdown timers",
  checkRestrictions: "Recheck account restriction status"
};
```

### Countdown Timer Updates
```javascript
const countdownTimerSystem = {
  updateFrequency: "Every 60 seconds (1 minute)",
  implementation: "setInterval in useEffect",
  cleanup: "clearInterval on component unmount",
  colorCoding: {
    green: "More than 6 hours remaining",
    yellow: "2-6 hours remaining",
    red: "Less than 2 hours or expired"
  }
};
```

---

## 13. Error Handling & Edge Cases

### Common Errors
```javascript
const errorHandling = {
  // Seller clicks confirm but already expired
  alreadyExpired: {
    check: "confirmation_deadline < NOW()",
    response: "Cannot confirm expired payment. Contact support.",
    display: "Disable 'Confirm' button, show 'Expired' badge"
  },
  
  // Multiple confirmations for same order
  duplicateConfirmation: {
    prevention: "Database unique constraint on order_id",
    handling: "Use existing confirmation record"
  },
  
  // Seller timezone not set
  missingTimezone: {
    fallback: "Use 'Australia/Sydney' as default",
    improvement: "Prompt user to set timezone in Settings"
  },
  
  // Cron job fails
  cronFailure: {
    monitoring: "Log errors to monitoring service",
    recovery: "Retry on next scheduled run (every hour)",
    alerting: "Email admin if 3 consecutive failures"
  },
  
  // Network error during confirmation
  networkError: {
    handling: "Show error message",
    retry: "Provide 'Try Again' button",
    persistence: "Don't reload page, preserve form state"
  }
};
```

---

## 14. Testing

### Test Scenarios
```javascript
const testScenarios = {
  // Scenario 1: Business hours confirmation
  test1_BusinessHours: {
    setup: "Create payment at 2:00 PM",
    expected: "Deadline at 2:00 AM next day (12 hours)",
    test: "Verify deadline calculation is correct"
  },
  
  // Scenario 2: After hours confirmation
  test2_AfterHours: {
    setup: "Create payment at 11:00 PM",
    expected: "Deadline at 11:00 PM next day (24 hours)",
    test: "Verify deadline calculation is correct"
  },
  
  // Scenario 3: Confirm payment
  test3_ConfirmPayment: {
    setup: "Create pending confirmation",
    action: "Seller clicks 'Confirm Payment'",
    expected: "Status = 'confirmed', removed from pending list"
  },
  
  // Scenario 4: Miss deadline
  test4_MissDeadline: {
    setup: "Create confirmation with deadline 1 hour ago",
    action: "Run cron job",
    expected: "Status = 'expired', account_restricted = TRUE"
  },
  
  // Scenario 5: Confirm all payments
  test5_ConfirmAll: {
    setup: "Account restricted with 2 pending confirmations",
    action: "Confirm both payments",
    expected: "account_restricted = FALSE, restrictions lifted"
  },
  
  // Scenario 6: Stripe payment
  test6_StripePayment: {
    setup: "Complete Stripe payment",
    expected: "NO payment confirmation created",
    verify: "Order status directly set to 'payment_confirmed'"
  }
};
```

---

## 15. Configuration Options

### Customizable Settings
```javascript
const configurationOptions = {
  deadlines: {
    businessHoursDeadline: 12, // hours
    afterHoursDeadline: 24, // hours
    businessHoursStart: 8, // 8 AM
    businessHoursEnd: 22, // 10 PM
    defaultTimezone: 'Australia/Sydney'
  },
  
  notifications: {
    emailOnPaymentReceived: true,
    emailOnDeadlineApproaching: true,
    emailOnAccountRestricted: true,
    pushNotifications: true,
    approachingDeadlineHours: 2 // Notify 2 hours before
  },
  
  cronSchedule: {
    checkDeadlinesFrequency: '0 * * * *', // Every hour
    cleanupExpiredFrequency: '0 0 * * *' // Daily at midnight
  },
  
  restrictions: {
    canListNewItems: false,
    canAcceptOrders: false,
    canMessageBuyers: true,
    canEditProfile: true
  },
  
  display: {
    showTimeRemaining: true,
    showBuyerDetails: true,
    showItemImage: true,
    refreshInterval: 60000 // 1 minute
  }
};
```

---

## Summary

The Payment Confirmations page is a **critical accountability system** that:

✅ **Prevents payment fraud** by requiring sellers to confirm receipt
✅ **Enforces strict deadlines** (12 or 24 hours based on business hours)
✅ **Automatically restricts accounts** when deadlines are missed
✅ **Provides real-time countdown timers** for urgency
✅ **Integrates with all payment methods** (bank transfer, crypto, Stripe)
✅ **Supports seller timezones** for fair deadline calculation
✅ **Includes support system** for payment disputes
✅ **Uses automated cron jobs** for deadline enforcement

This system ensures **transparency, accountability, and trust** in the marketplace! 🔒✅⏰
