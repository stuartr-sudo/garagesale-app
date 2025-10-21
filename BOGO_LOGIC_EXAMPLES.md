# 🎁 BOGO Logic - Lower Priced Item Gets Discount

## ✅ **Rule: The LOWER priced item is ALWAYS the discounted/free item**

---

## 📊 Example Scenarios

### **Example 1: Classic BOGO (Buy 1, Get 1 Free)**

**Seller Offer:**
```json
{
  "offer_type": "bogo",
  "config": {
    "buy_quantity": 1,
    "get_quantity": 1,
    "discount_percent": 100
  },
  "item_ids": ["bookshelf_1_uuid", "bookshelf_2_uuid"]
}
```

**Cart:**
- Bookshelf A: $120.00
- Bookshelf B: $80.00

**Calculation:**
```
Subtotal: $200.00
BOGO Applied: $80.00 discount (lower priced item = FREE)
──────────────
Total: $120.00
You Saved: $80.00! 🎉
```

**Result:** Customer pays for the $120 bookshelf, gets the $80 one FREE!

---

### **Example 2: BOGO 50% Off**

**Seller Offer:**
```json
{
  "offer_type": "bogo",
  "config": {
    "buy_quantity": 1,
    "get_quantity": 1,
    "discount_percent": 50
  }
}
```

**Cart:**
- Chair A (Red): $150.00
- Chair B (Blue): $100.00

**Calculation:**
```
Subtotal: $250.00
BOGO 50% Applied: $50.00 discount (50% off lower priced item)
──────────────
Total: $200.00
You Saved: $50.00! 🎉
```

**Result:** Lower priced chair ($100) becomes $50

---

### **Example 3: Multiple BOGO Sets**

**Cart:**
- T-Shirt A: $30.00
- T-Shirt B: $25.00
- T-Shirt C: $35.00
- T-Shirt D: $20.00

**Sorted by Price (Ascending):**
1. T-Shirt D: $20.00 ← **FREE** (lowest)
2. T-Shirt B: $25.00 ← **FREE** (second lowest)
3. T-Shirt A: $30.00 ← **PAID**
4. T-Shirt C: $35.00 ← **PAID**

**Calculation:**
```
Subtotal: $110.00
BOGO Applied (2 sets):
  - T-Shirt D: $20.00 discount
  - T-Shirt B: $25.00 discount
Total Discount: $45.00
──────────────
Total: $65.00
You Saved: $45.00! 🎉
```

**Result:** Buy 2, Get 2 Free (the 2 lowest priced items are free)

---

### **Example 4: Buy 2, Get 1 Free**

**Seller Offer:**
```json
{
  "offer_type": "bogo",
  "config": {
    "buy_quantity": 2,
    "get_quantity": 1,
    "discount_percent": 100
  }
}
```

**Cart:**
- Gaming Mouse: $80.00
- Keyboard: $120.00
- Headset: $60.00

**Sorted by Price (Ascending):**
1. Headset: $60.00 ← **FREE** (lowest)
2. Gaming Mouse: $80.00 ← **PAID**
3. Keyboard: $120.00 ← **PAID**

**Calculation:**
```
Subtotal: $260.00
Buy 2 Get 1: $60.00 discount (cheapest item free)
──────────────
Total: $200.00
You Saved: $60.00! 🎉
```

**Result:** Customer pays $120 + $80 = $200, gets the $60 headset FREE!

---

### **Example 5: Mixed Pricing with Odd Quantities**

**Cart:**
- Item A: $100.00
- Item B: $50.00
- Item C: $75.00
- Item D: $90.00
- Item E: $60.00

**Sorted by Price (Ascending):**
1. Item B: $50.00 ← **FREE** (lowest)
2. Item E: $60.00 ← **FREE** (second lowest)
3. Item C: $75.00 ← **PAID**
4. Item D: $90.00 ← **PAID**
5. Item A: $100.00 ← **PAID** (highest)

**For Buy 1 Get 1:**
- Total items: 5
- Complete BOGO sets: 2 (4 items)
- Remaining: 1 (paid at full price)

**Calculation:**
```
Subtotal: $375.00
BOGO Applied (2 sets):
  - Item B: $50.00 discount
  - Item E: $60.00 discount
Total Discount: $110.00
──────────────
Total: $265.00
You Saved: $110.00! 🎉
```

---

## 🎯 **Algorithm Logic**

```javascript
// Pseudo-code for BOGO calculation

function calculateBOGO(cartItems, offer) {
  // 1. Filter items that are part of the BOGO offer
  const offerItems = cartItems.filter(item => 
    offer.item_ids.includes(item.id)
  );
  
  // 2. Sort items by price ASCENDING (lowest first)
  offerItems.sort((a, b) => a.price - b.price);
  
  // 3. Calculate eligible sets
  const buyQty = offer.config.buy_quantity;
  const getQty = offer.config.get_quantity;
  const totalQty = offerItems.reduce((sum, item) => sum + item.quantity, 0);
  const eligibleSets = Math.floor(totalQty / (buyQty + getQty));
  
  // 4. Apply discount to LOWEST priced items
  let discount = 0;
  const discountPercent = offer.config.discount_percent / 100;
  const itemsToDiscount = eligibleSets * getQty;
  
  for (let i = 0; i < itemsToDiscount && i < offerItems.length; i++) {
    discount += offerItems[i].price * discountPercent;
  }
  
  return discount;
}
```

---

## ✅ **Key Rules**

1. **Always sort items by price ASCENDING** (lowest first)
2. **Apply discount to the LOWEST priced items**
3. **Calculate complete BOGO sets only** (no partial sets)
4. **Discount percentage is flexible** (50%, 75%, 100% free)
5. **Remaining items are full price** (odd quantities)

---

## 🚫 **What This PREVENTS**

**Without this logic, sellers could lose money:**

❌ **Bad Example:**
```
Cart:
- iPhone: $800
- Phone Case: $20

Without lower-price rule: iPhone becomes FREE (seller loses $800!)
With lower-price rule: Phone case becomes FREE (seller loses $20) ✅
```

**This ensures:**
- ✅ Sellers don't accidentally give away expensive items
- ✅ Customers still get a good deal
- ✅ Fair and transparent pricing
- ✅ Standard retail practice (like supermarkets)

---

## 💡 **UI Display Examples**

### On Item Card:
```
🎁 BOGO: Buy 1, Get 1 Free!
(Lower priced item will be free at checkout)
```

### In Cart:
```
📦 Your Cart (4 items)

Keyboard - $120.00
Gaming Mouse - $80.00
Headset - $60.00 ← 🎉 FREE (BOGO)
Mouse Pad - $15.00 ← 🎉 FREE (BOGO)
────────────────────
Subtotal: $275.00
BOGO Discount: -$75.00
────────────────────
Total: $200.00

💰 You're saving $75.00 with BOGO!
```

### Checkout Summary:
```
✅ BOGO Deal Applied!
You're getting 2 items FREE:
  • Headset ($60)
  • Mouse Pad ($15)

These were the lowest priced items in your cart.
```

---

## 🎓 **Summary**

The BOGO logic **ALWAYS discounts the lower-priced items** to:
- Protect sellers from accidental huge losses
- Match standard retail practice
- Provide clear, fair discounts
- Prevent customer confusion

**Customer perspective:** "I get a discount on the cheaper item, which is still a great deal!"

**Seller perspective:** "I'm giving away the less expensive items, which is sustainable for my business."

**Win-win for everyone!** 🎉

