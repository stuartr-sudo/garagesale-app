# Transaction Penalty System

## Overview

This document describes the automatic penalty system for users who accept offers but fail to complete transactions. The system is designed to protect sellers from time-wasting buyers and maintain platform integrity.

## Penalty Rules

### First Offense
- **Penalty**: 24-hour suspension
- **What happens**: User cannot access marketplace or make any transactions
- **When**: User accepts an offer but doesn't complete payment within the 24-hour deadline
- **Recovery**: Suspension automatically lifts after 24 hours

### Second Offense
- **Penalty**: Permanent ban from platform
- **What happens**: User loses all access to the platform permanently
- **When**: User fails to complete payment for a second accepted offer
- **Recovery**: No recovery - ban is permanent. User must contact support if they believe it was issued in error.

## How It Works

### 1. Order Creation
When a user accepts an offer:
- An order is created with status `awaiting_payment`
- A `payment_deadline` is set (typically 24 hours from acceptance)
- The item status changes to `pending`

### 2. Deadline Tracking
The system monitors orders and automatically:
- Checks for expired orders when users log in
- Identifies orders that have passed their `payment_deadline`
- Only marks orders as incomplete if they're still in `awaiting_payment` or `payment_pending_seller_confirmation` status

### 3. Penalty Application
When an order expires without payment:
- The order is marked with `marked_incomplete = true` and status updated to `expired`
- The item is returned to `active` status (available for other buyers)
- The buyer's `incomplete_transaction_count` is incremented

**First incomplete transaction:**
- `is_suspended` is set to `true`
- `suspension_end_date` is set to 24 hours from now
- User sees suspension screen when they try to access the platform

**Second incomplete transaction:**
- `is_banned` is set to `true`
- `is_suspended` is cleared (ban overrides suspension)
- `ban_reason` is recorded
- User sees permanent ban screen

### 4. Suspension Lifting
For 24-hour suspensions:
- System automatically checks suspension status when user logs in
- If `suspension_end_date` has passed, suspension is automatically lifted
- User regains full access to the platform
- Warning remains: next incomplete transaction results in permanent ban

## Database Schema

### Profiles Table Additions
```sql
- incomplete_transaction_count: INTEGER (default 0)
- last_incomplete_transaction_date: TIMESTAMPTZ
- is_suspended: BOOLEAN (default false)
- suspension_end_date: TIMESTAMPTZ
- is_banned: BOOLEAN (default false)
- ban_reason: TEXT
```

### Orders Table Additions
```sql
- marked_incomplete: BOOLEAN (default false)
- incomplete_reason: TEXT
```

## API Functions

### `checkUserStatus(userId)`
Checks user's current penalty status, automatically lifts expired suspensions.

**Returns:**
```javascript
{
  isSuspended: boolean,
  isBanned: boolean,
  suspensionEndDate: string|null,
  banReason: string|null,
  incompleteTransactionCount: number
}
```

### `markOrderIncomplete(orderId, buyerId, reason)`
Manually marks an order as incomplete and applies appropriate penalties.

**Returns:**
```javascript
{
  success: boolean,
  penaltyApplied: 'suspension' | 'ban' | 'none',
  newCount: number
}
```

### `checkExpiredOrders()`
Automatically checks for all expired orders and applies penalties.

**Returns:**
```javascript
{
  success: boolean,
  expiredCount: number,
  results: Array
}
```

## User Experience

### Suspended Users
When a suspended user logs in, they see:
- **Suspension Banner**: Clear explanation of why they were suspended
- **Time Remaining**: Countdown showing how long until suspension lifts
- **Warning**: Explicit notice that next offense results in permanent ban
- **Impact Statement**: Explanation of how their actions affected sellers
- **Log Out Button**: Ability to log out

### Banned Users
When a banned user logs in, they see:
- **Ban Banner**: Permanent ban notification
- **Reason**: Detailed explanation of ban reason
- **What Happened**: Step-by-step breakdown of events leading to ban
- **Impact Statement**: Explanation of harm caused to community
- **Support Contact**: Information for appealing if ban was issued in error
- **Log Out Button**: Ability to log out

## Admin Monitoring

Admins can monitor penalty statistics by querying:

```sql
-- Get users with incomplete transactions
SELECT 
  id,
  full_name,
  email,
  incomplete_transaction_count,
  last_incomplete_transaction_date,
  is_suspended,
  suspension_end_date,
  is_banned,
  ban_reason
FROM profiles
WHERE incomplete_transaction_count > 0
ORDER BY incomplete_transaction_count DESC, last_incomplete_transaction_date DESC;

-- Get incomplete orders
SELECT 
  o.id,
  o.buyer_id,
  o.payment_deadline,
  o.incomplete_reason,
  o.created_at,
  p.full_name as buyer_name,
  p.email as buyer_email
FROM orders o
JOIN profiles p ON p.id = o.buyer_id
WHERE o.marked_incomplete = true
ORDER BY o.payment_deadline DESC;
```

## Automatic Enforcement

The penalty system is automatically enforced:
1. **On User Login**: `checkUserStatus()` is called to lift expired suspensions
2. **On User Login**: `checkExpiredOrders()` is called to process any expired orders
3. **Suspension Check**: Layout component prevents suspended/banned users from accessing platform

## Important Notes

1. **Double-Penalty Prevention**: Orders marked as incomplete are tracked to prevent applying penalties twice for the same order.

2. **Grace Period**: Users have 24 hours to complete payment after accepting an offer. This is a reasonable timeframe for bank transfers and other payment methods.

3. **Already Banned**: If a user is already banned, no further penalties are applied.

4. **Manual Override**: Admins can manually update user status in the database if needed (e.g., false positives, technical issues).

5. **Appeal Process**: Banned users are directed to contact support@garagesale.com to appeal their ban.

## Testing

To test the penalty system:

1. Create a test user
2. Have them accept an offer (creates an order with payment deadline)
3. Manually update the order's `payment_deadline` to a past date:
   ```sql
   UPDATE orders 
   SET payment_deadline = NOW() - INTERVAL '1 hour'
   WHERE id = 'order-id';
   ```
4. Log in as the test user - this triggers `checkExpiredOrders()`
5. Verify suspension screen appears
6. For second offense testing, repeat steps 2-4 with another order
7. Verify permanent ban screen appears

## Future Enhancements

Potential improvements to consider:
- Admin dashboard for managing penalties
- Appeal system integrated into the platform
- Configurable penalty thresholds (e.g., 3 strikes instead of 2)
- Warning emails/notifications before applying penalties
- Graduated penalties (e.g., longer suspensions for repeat offenders before permanent ban)

