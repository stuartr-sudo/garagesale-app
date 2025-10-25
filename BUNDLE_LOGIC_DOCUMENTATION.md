# Bundle System Logic

## Current Behavior

### When a Bundle is Created:
1. Individual items are marked as `status = 'bundled'`
2. This **prevents** items from being sold individually
3. Items can only be purchased as part of the bundle

### When a Bundle is Purchased:
1. All items in the bundle are marked as `status = 'sold'`
2. The bundle status changes to `sold`

### When an Individual Item Should Sell (NEW LOGIC NEEDED):
**Current State:** Items are marked as 'bundled', so they CANNOT be sold individually
**Desired State (per user request):** Items should remain 'available' and sellable individually

## Recommended Changes

### Option 1: Items Stay Available (User's Request)
- Items remain `status = 'available'` when added to bundle
- Items can be sold individually OR as part of bundle
- When item sells individually → ALL bundles containing that item are deactivated
- **Trade-off:** More flexible, but bundles can become invalidated frequently

### Option 2: Items Become Bundled (Current)
- Items are `status = 'bundled'` when added to bundle
- Items CANNOT be sold individually
- Bundle must be explicitly dissolved to free up items
- **Trade-off:** More predictable, but less flexible

## User's Preference
Based on conversation: **Option 1**
- "Bundles can only be comprised of individual items"
- "Bundles are only available whilst all items are not sold"
- Items should be sellable individually, which auto-deactivates bundles

## Implementation Plan
1. ✅ Create trigger to deactivate bundles when items sell
2. ❌ Change bundle creation to NOT mark items as 'bundled'
3. ✅ Add function to check bundle availability based on item status
4. ✅ Filter marketplace to show only available bundles
