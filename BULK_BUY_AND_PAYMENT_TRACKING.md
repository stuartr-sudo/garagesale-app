# 🛒 Bulk Buy & Payment Tracking Features

## ✅ Sidebar Fixed
- **Collapsed by default** on both desktop and mobile
- **Toggle button** in header to open/close
- Icons show when collapsed for quick navigation

---

## 🛍️ Shopping Cart System

### Features Implemented:
1. **Add to Cart** - Users can add multiple items before checkout
2. **Quantity Selection** - Buy multiple of the same item
3. **Cart Total Calculation** - Automatic subtotal, discounts, and total
4. **Persistent Cart** - Saved in database, not lost on refresh

### Database Schema:
```sql
cart_items:
- id (UUID)
- buyer_id (UUID) → references auth.users
- item_id (UUID) → references items
- quantity (INTEGER)
- added_at (TIMESTAMP)
```

---

## 💰 Special Offers & Discounts

### Offer Types Supported:

#### 1. **BOGO (Buy One Get One)**
```json
{
  "offer_type": "bogo",
  "config": {
    "buy_quantity": 1,
    "get_quantity": 1,
    "discount_percent": 100  // 100% = free, 50% = half price
  }
}
```

**Example:** Buy 1 iPhone, Get 1 Free

#### 2. **Bulk Discount**
```json
{
  "offer_type": "bulk_discount",
  "config": {
    "min_quantity": 3,
    "discount_percent": 15
  }
}
```

**Example:** Buy 3+ items, Get 15% off

#### 3. **Percentage Off**
```json
{
  "offer_type": "percentage_off",
  "config": {
    "discount_percent": 20
  }
}
```

**Example:** 20% off selected items

#### 4. **Bundle Deals**
```json
{
  "offer_type": "bundle",
  "config": {
    "item_ids": ["uuid1", "uuid2", "uuid3"],
    "bundle_price": 500
  }
}
```

**Example:** Gaming PC + Monitor + Keyboard for $500 (normally $600)

---

## 💳 Payment Tracking (Option A)

### Payment Workflow:

```
1. User adds items to cart
2. Proceeds to checkout
3. Sees total + Commonwealth Bank details
4. Makes bank transfer with unique reference
5. Uploads payment proof (optional)
6. Seller receives notification
7. Seller clicks "Confirm Payment Received"
8. Status changes to "Paid & Confirmed"
9. Seller arranges delivery/pickup
```

### Payment Status Flow:
- **Pending** → Buyer hasn't paid yet
- **Paid** → Buyer claims payment made (optional proof uploaded)
- **Confirmed** → Seller verified payment received
- **Failed** → Payment issue or cancelled

### Enhanced Transactions Table:
```sql
transactions:
- items_purchased (JSONB) → Array of items in this transaction
- special_offer_id (UUID) → If discount applied
- subtotal (DECIMAL) → Before discounts
- discount_amount (DECIMAL) → Total savings
- payment_status (TEXT) → pending/paid/confirmed/failed
- payment_proof_url (TEXT) → Screenshot/receipt URL
- payment_confirmed_at (TIMESTAMP) → When seller confirmed
- payment_reference (TEXT) → Bank transfer reference
```

---

## 🎯 Implementation Roadmap

### Phase 1: Shopping Cart UI ✅ (Database Ready)
- [ ] Shopping cart icon in header with item count badge
- [ ] Cart sidebar/modal with item list
- [ ] Add to cart button on item cards
- [ ] Quantity selectors
- [ ] Remove from cart button
- [ ] Cart total with breakdown

### Phase 2: Checkout Process
- [ ] Checkout page with cart summary
- [ ] Apply discount codes
- [ ] Special offer detection (automatic)
- [ ] Bank details display
- [ ] Generate unique payment reference
- [ ] Payment proof upload (optional)

### Phase 3: Seller Dashboard
- [ ] Pending payments view
- [ ] "Confirm Payment" button
- [ ] Payment history
- [ ] Bulk order management
- [ ] Email notifications for new orders

### Phase 4: Special Offers UI
- [ ] "Create Offer" page for sellers
- [ ] Offer management dashboard
- [ ] Badge/tag on items with offers
- [ ] Automatic discount calculation
- [ ] BOGO, bulk, bundle offer types

---

## 💡 Smart Features

### 1. **Auto-Applied Discounts**
- System detects if cart qualifies for offers
- Automatically applies best discount
- Shows "You saved $X!" message

### 2. **Bulk Buy Recommendations**
```
Cart: 2 items from same seller
Message: "Add 1 more item for 15% off all items!"
```

### 3. **Bundle Suggestions**
```
Viewing: Gaming PC
Suggestion: "Save $100 - Buy with Monitor & Keyboard Bundle"
```

### 4. **Payment Reminders**
- Email reminder if payment pending >24 hours
- SMS option for payment confirmations

---

## 🚀 API Endpoints (To Be Created)

### Cart Management:
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - Get user's cart
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove` - Remove item
- `POST /api/cart/checkout` - Convert cart to transaction

### Special Offers:
- `GET /api/offers` - List active offers
- `POST /api/offers/create` - Create new offer (sellers)
- `GET /api/offers/applicable` - Check if cart qualifies

### Payment Tracking:
- `POST /api/payment/confirm` - Seller confirms payment
- `POST /api/payment/upload-proof` - Buyer uploads receipt
- `GET /api/payment/status/:id` - Check payment status

---

## 📊 Example Use Cases

### Use Case 1: BOGO Deal
```
Seller: Posts "BOGO - Buy 1 Bookshelf, Get 1 50% Off"
Buyer: Adds 2 bookshelves ($120 each)
Cart: 
  - Bookshelf 1: $120
  - Bookshelf 2: $60 (50% off)
  - Total: $180 (Save $60!)
```

### Use Case 2: Bulk Purchase
```
Buyer: Wants multiple items from same seller
Adds: 4 items ($50, $75, $100, $80)
System: "3+ items = 15% off!"
Original: $305
Discount: -$45.75
Total: $259.25
```

### Use Case 3: Bundle Deal
```
Seller: Gaming Bundle
  - PC ($1500)
  - Monitor ($400)
  - Keyboard + Mouse ($100)
Bundle Price: $1800 (Save $200)
```

---

## 🔔 Notifications

### For Buyers:
- ✉️ Order confirmation email
- 📱 Payment reminder (if unpaid >24hrs)
- ✅ Payment confirmed notification
- 📦 Ready for pickup/delivery notification

### For Sellers:
- 💰 New order received
- 🔔 Payment proof uploaded
- ❓ Payment pending >48hrs reminder

---

## 🎨 UI Components Needed

1. **Cart Icon** - Header, with badge showing item count
2. **Cart Sidebar** - Slide-out panel with items
3. **Checkout Page** - Full checkout experience
4. **Offer Badge** - On item cards ("BOGO!", "15% OFF 3+")
5. **Payment Status Widget** - For sellers to manage orders
6. **Discount Calculator** - Shows savings in real-time

---

## 🔐 Security Considerations

✅ RLS policies ensure:
- Users only see their own cart
- Sellers only manage their own offers
- Payment confirmations require authentication
- No price manipulation (server-side validation)

---

## 📈 Future Enhancements

1. **Wishlist** - Save items for later
2. **Saved Carts** - Multiple carts for different sellers
3. **Price Alerts** - Notify when price drops
4. **Auction Mode** - Time-limited bidding
5. **Group Buying** - Get better price with more buyers
6. **Subscription Offers** - Recurring discounts

---

## ✅ Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Sidebar Collapse | ✅ Complete | Deployed |
| Shopping Cart DB | ✅ Complete | Migration applied |
| Special Offers DB | ✅ Complete | Ready for use |
| Payment Tracking DB | ✅ Complete | Enhanced transactions |
| Cart UI | 📝 Next | Need React components |
| Checkout UI | 📝 Next | Payment flow |
| Offer Management UI | 📝 Next | Seller dashboard |

**Next Steps:** Build the shopping cart React components and checkout flow!

