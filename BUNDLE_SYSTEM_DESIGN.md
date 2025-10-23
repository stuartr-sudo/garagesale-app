# Bundle System Design

## Database Schema

### 1. Create `bundles` table
```sql
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bundle_price DECIMAL(10,2) NOT NULL,
  individual_total DECIMAL(10,2) NOT NULL, -- Sum of individual item prices
  savings DECIMAL(10,2) NOT NULL, -- bundle_price - individual_total
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  collection_date TIMESTAMP WITH TIME ZONE,
  collection_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Create `bundle_items` junction table
```sql
CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, item_id)
);
```

### 3. Update `transactions` table for bundles
```sql
ALTER TABLE transactions ADD COLUMN bundle_id UUID REFERENCES bundles(id);
ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR(20) DEFAULT 'single' 
  CHECK (transaction_type IN ('single', 'bundle'));
```

## Features

### 1. Bundle Creation
- Select multiple items from seller's inventory
- Set bundle price (must be less than sum of individual prices)
- Set collection details for the bundle
- Preview savings for buyers

### 2. Bundle Display
- Show bundle as a group with individual items
- Display savings amount and percentage
- Show "Bundle Deal" badge
- Individual item details within bundle

### 3. Bundle Purchase
- Single transaction for entire bundle
- All items marked as sold when bundle is purchased
- Collection details apply to entire bundle

### 4. Bundle Management
- Edit bundle details
- Add/remove items from bundle
- Deactivate bundle
- View bundle analytics

## UI Components Needed

1. **BundleCreator** - Modal for creating bundles
2. **BundleCard** - Display bundle in marketplace
3. **BundleItemList** - Show items within bundle
4. **BundlePurchaseModal** - Handle bundle purchases
5. **BundleManager** - Manage existing bundles

## API Endpoints

1. `POST /api/bundles` - Create bundle
2. `GET /api/bundles` - List bundles
3. `GET /api/bundles/:id` - Get bundle details
4. `PUT /api/bundles/:id` - Update bundle
5. `DELETE /api/bundles/:id` - Delete bundle
6. `POST /api/bundles/:id/items` - Add item to bundle
7. `DELETE /api/bundles/:id/items/:itemId` - Remove item from bundle
