# Real-Time Urgency Indicators - Implementation Guide

## ✨ Overview

Added real-time urgency indicators to item detail pages to create FOMO (fear of missing out) and encourage faster purchasing decisions.

## 🎯 What's Shown

### 1. **Total View Count** 👁️
- Cumulative views since item was listed
- Displayed as: "X views"
- Blue badge with eye icon

### 2. **Active Viewers** 🟢 (Real-Time)
- Shows how many people are currently viewing the item
- 5-minute activity window
- Displayed as: "X people looking now"
- Green badge with users icon + pulse animation
- **Excludes current viewer** from count

### 3. **Active Negotiations** 💬
- Shows how many AI agent negotiations are currently active
- 24-hour window
- Displayed as: "X active negotiations"
- Purple badge with message icon

### 4. **Urgency Badges** 🔥
Based on total activity:
- **High Interest**: 5+ active viewers/negotiations - Red with flame icon
- **Trending**: High activity indicator - Pink gradient with trending icon
- Auto-calculated based on real-time data

## 📊 How It Works

### Frontend (UrgencyIndicators.jsx)
```javascript
1. Creates unique session ID per browser session
2. Tracks viewer on component mount
3. Polls every 10 seconds for updated stats
4. Shows animated badges based on activity level
5. Auto-hides if no significant activity
```

### Backend (Database)
```sql
1. item_active_viewers table tracks who's viewing
2. Auto-cleanup of stale data (>5 minutes old)
3. RPC functions for fast queries
4. Real-time count updates
```

## 🗄️ Database Structure

### New Table: `item_active_viewers`
```sql
CREATE TABLE item_active_viewers (
  id UUID PRIMARY KEY,
  item_id UUID,
  session_id TEXT,
  viewer_ip TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

### New Functions:
1. **`upsert_active_viewer(item_id, session_id, ip)`**
   - Tracks/updates viewer activity
   - Auto-cleans old records

2. **`get_active_viewer_count(item_id, session_id)`**
   - Returns count of active viewers
   - Excludes current session

3. **`get_active_negotiations_count(item_id)`**
   - Returns count of active AI negotiations
   - 24-hour window

### Updated Columns on `items` table:
- `view_count` - Total cumulative views
- `active_negotiations_count` - Cached count (updated by trigger)

## 🚀 SQL Migration Required

**Run this in Supabase SQL Editor:**

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/031_add_urgency_tracking.sql
```

## 🎨 Visual Design

### Urgency Levels:
```
High Activity (5+):
  🔥 High Interest (red, pulsing)
  📈 Trending (pink gradient, bouncing)

Medium Activity (2-4):
  ⚠️ Orange indicators

Low Activity (1):
  💛 Yellow indicators

No Activity:
  Hidden (unless >10 total views)
```

### Badge Examples:
```
👁️ 45 views                    (Blue)
👥 3 people looking now         (Green, pulsing)
💬 2 active negotiations        (Purple)
🔥 High Interest               (Red, pulsing)
📈 Trending                    (Pink gradient, bouncing)
```

## ⚙️ Configuration

### Update Frequency
- **Viewer tracking**: Every 10 seconds
- **Cleanup interval**: Auto (in SQL function)
- **Activity window**: 5 minutes

### Thresholds
```javascript
// In UrgencyIndicators.jsx
const getUrgencyLevel = () => {
  const totalActivity = activeViewers + activeNegotiations;
  if (totalActivity >= 5) return 'high';      // 🔥 High Interest
  if (totalActivity >= 2) return 'medium';    // ⚠️ Medium
  if (totalActivity >= 1) return 'low';       // 💛 Low
  return 'none';                              // Hidden
};
```

### Hide Thresholds
```javascript
// Component won't show if:
- No urgency AND less than 10 total views
```

## 🧪 Testing

### Test Scenario 1: Active Viewers
1. Open item detail page in Browser A
2. Open same item in Browser B (different browser/incognito)
3. Browser A should show "1 person looking now"
4. Open in Browser C
5. Browser A/B should show "2 people looking now"

### Test Scenario 2: View Count
1. Refresh item page multiple times
2. View count should increment
3. Check database: `SELECT view_count FROM items WHERE id = 'item_id'`

### Test Scenario 3: Negotiations
1. Start AI agent negotiation on item
2. Item should show "1 active negotiation"
3. Start another negotiation from different account
4. Should show "2 active negotiations"

### Test Scenario 4: Cleanup
1. Open item page
2. Wait 6 minutes without activity
3. Active viewer count should go to 0
4. Check database: `SELECT * FROM item_active_viewers WHERE item_id = 'item_id'`

## 📈 Benefits

### For Buyers:
- ✅ See real-time interest in items
- ✅ Understand competition for popular items
- ✅ Encouraged to act quickly on hot items

### For Sellers:
- ✅ Items with activity get more visibility
- ✅ Creates urgency for buyers
- ✅ Faster sales on popular items

### For Platform:
- ✅ Increased conversion rates
- ✅ Reduced time-to-sale
- ✅ More engaging user experience
- ✅ Social proof mechanism

## 🔒 Privacy

- Session IDs are randomly generated (not personally identifiable)
- IP addresses stored but not displayed to users
- Auto-cleanup of old data (5-minute window)
- No user authentication required

## 🎯 Future Enhancements

Potential additions:
1. **Wishlist Count**: "X people have this on their wishlist"
2. **Recent Sales**: "3 similar items sold this week"
3. **Price Drop Alert**: "Price reduced by 20%!"
4. **Expiring Soon**: "Last chance - listing ends in 2 hours"
5. **Limited Stock**: "Only 1 left" (for bundles with quantity)

## 📱 Mobile Responsive

- Badges wrap to multiple lines on mobile
- Icons scale appropriately
- Touch-friendly sizing
- Animations optimized for mobile

## ⚡ Performance

- **Polling**: Every 10 seconds (not too frequent)
- **Indexed queries**: Fast database lookups
- **Auto-cleanup**: Prevents table bloat
- **Lazy loading**: Only loads when item detail viewed
- **Session caching**: Reduces duplicate tracking

---

## 🚀 Deployment Status

- ✅ Frontend component created
- ✅ Database migration file created
- ✅ RPC functions defined
- ✅ Integrated into ItemDetail page
- ✅ Code deployed to Vercel
- ⏳ **SQL migration needs to be run in Supabase**

---

**Ready to create FOMO and boost conversions!** 🎉

