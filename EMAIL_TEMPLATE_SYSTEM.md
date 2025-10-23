# 📧 Email Template System Documentation

## **Overview**
Your GarageSale platform now has a comprehensive email template system that automatically sends beautifully designed emails for different user actions. All templates are professionally designed with consistent branding and responsive layouts.

## **📋 Available Email Templates**

### **1. User Registration & Onboarding**

#### **Welcome Email** (`welcome`)
- **Trigger:** New user registration
- **Recipient:** New user
- **Features:** 
  - Personalized welcome message
  - Platform introduction
  - "What's Next" guide
  - Direct link to marketplace
- **Template Variables:** `userName`, `userEmail`

#### **Email Verification** (`emailVerification`)
- **Trigger:** Email verification required
- **Recipient:** User needing verification
- **Features:**
  - Clear verification instructions
  - Security notice
  - Verification button
- **Template Variables:** `userName`, `verificationLink`

### **2. Marketplace Transactions**

#### **Purchase Confirmation** (`purchaseConfirmation`)
- **Trigger:** Buyer completes purchase
- **Recipient:** Buyer
- **Features:**
  - Order details summary
  - Payment confirmation
  - Seller information
  - Link to order tracking
- **Template Variables:** `buyerName`, `itemName`, `amount`, `orderId`, `sellerName`

#### **Sale Notification** (`saleNotification`)
- **Trigger:** Item sold, payment confirmed
- **Recipient:** Seller
- **Features:**
  - Sale celebration
  - Transaction details
  - Payment confirmation requirement
  - Urgent action notice (12-hour deadline)
- **Template Variables:** `sellerName`, `itemName`, `amount`, `buyerName`, `orderId`

#### **Offer Received** (`offerReceived`)
- **Trigger:** Buyer makes offer on item
- **Recipient:** Seller
- **Features:**
  - Offer details comparison
  - Original vs. offer price
  - Buyer information
  - Action buttons (accept/decline)
- **Template Variables:** `sellerName`, `itemName`, `offerAmount`, `buyerName`, `originalPrice`

#### **Offer Accepted** (`offerAccepted`)
- **Trigger:** Seller accepts buyer's offer
- **Recipient:** Buyer
- **Features:**
  - Success celebration
  - Accepted offer details
  - Next steps guidance
  - Purchase completion link
- **Template Variables:** `buyerName`, `itemName`, `acceptedAmount`, `sellerName`

### **3. Account Management**

#### **Account Suspended** (`accountSuspended`)
- **Trigger:** User account suspended
- **Recipient:** Suspended user
- **Features:**
  - Clear suspension notice
  - Reason explanation
  - Suspension duration
  - Support contact information
- **Template Variables:** `userName`, `reason`, `suspensionEndDate`

#### **Account Restricted** (`accountRestricted`)
- **Trigger:** Account restricted due to payment confirmations
- **Recipient:** Restricted user
- **Features:**
  - Restriction explanation
  - Pending confirmations count
  - Resolution instructions
  - Payment confirmation link
- **Template Variables:** `userName`, `reason`, `pendingConfirmations`

### **4. Notifications & Updates**

#### **New Message** (`newMessage`)
- **Trigger:** User receives new message
- **Recipient:** Message recipient
- **Features:**
  - Sender information
  - Message preview
  - Item context
  - Reply link
- **Template Variables:** `recipientName`, `senderName`, `messagePreview`, `itemName`

#### **Item Sold** (`itemSold`)
- **Trigger:** Item successfully sold
- **Recipient:** Seller
- **Features:**
  - Sale celebration
  - Transaction summary
  - Buyer information
  - Next steps
- **Template Variables:** `sellerName`, `itemName`, `amount`, `buyerName`

### **5. System & Admin**

#### **Test Email** (`testEmail`)
- **Trigger:** Manual testing
- **Recipient:** Test email address
- **Features:**
  - System status confirmation
  - Integration verification
  - Technical details
- **Template Variables:** `recipientEmail`

## **🎨 Design Features**

### **Consistent Branding**
- **Logo:** 🏪 GarageSale with cyan (#06b6d4) color scheme
- **Typography:** Segoe UI font family for professional appearance
- **Colors:** 
  - Primary: #06b6d4 (Cyan)
  - Success: #10b981 (Green)
  - Warning: #f59e0b (Amber)
  - Error: #ef4444 (Red)
  - Info: #3b82f6 (Blue)

### **Responsive Design**
- **Mobile-friendly:** Optimized for all screen sizes
- **Email client compatibility:** Works across Gmail, Outlook, Apple Mail
- **Accessibility:** High contrast, readable fonts

### **Interactive Elements**
- **Action Buttons:** Prominent, branded call-to-action buttons
- **Status Indicators:** Color-coded status messages
- **Information Cards:** Clean, organized data presentation

## **🔧 Technical Implementation**

### **Template System Architecture**
```javascript
// Base template with consistent styling
const baseEmailTemplate = (content, actionButton) => {
  // Header, content, action button, footer
}

// Individual templates
export const emailTemplates = {
  welcome: (userName, userEmail) => ({ subject, html, text }),
  purchaseConfirmation: (buyerName, itemName, amount, orderId, sellerName) => ({ subject, html, text }),
  // ... more templates
}
```

### **Email API Functions**
```javascript
// Core sending function
export async function sendEmail({ to, subject, html, text, templateName, userId })

// Specific action functions
export async function sendUserWelcomeEmail(userId, userEmail, userName)
export async function sendSellerPaymentConfirmation(orderId, sellerId, buyerId, itemId, amount)
export async function sendBuyerOrderConfirmation(orderId, buyerId, sellerId, itemId, amount)
// ... more functions
```

### **Database Integration**
- **Email Logs:** All emails are logged in `email_logs` table
- **Template Tracking:** Each email includes `template_name` for analytics
- **User Association:** Emails linked to user accounts for personalization

## **📊 Analytics & Monitoring**

### **Email Statistics Available**
- **Total emails sent**
- **Success/failure rates**
- **Template usage statistics**
- **User engagement metrics**

### **Resend Dashboard Features**
- **Delivery tracking:** Monitor email delivery rates
- **Open rates:** Track email open statistics
- **Click rates:** Measure button/link clicks
- **Bounce handling:** Automatic bounce management

## **🚀 Usage Examples**

### **Sending a Welcome Email**
```javascript
import { sendUserWelcomeEmail } from '@/api/email'

// After user registration
await sendUserWelcomeEmail(userId, userEmail, userName)
```

### **Sending a Sale Notification**
```javascript
import { sendSellerPaymentConfirmation } from '@/api/email'

// After purchase completion
await sendSellerPaymentConfirmation(orderId, sellerId, buyerId, itemId, amount)
```

### **Sending an Offer Notification**
```javascript
import { sendOfferReceivedEmail } from '@/api/email'

// When buyer makes offer
await sendOfferReceivedEmail(sellerId, buyerId, itemId, offerAmount, originalPrice)
```

## **🎯 Customization Options**

### **Template Modifications**
1. **Edit templates** in `/src/lib/emailService.js`
2. **Update styling** in the `baseEmailTemplate` function
3. **Add new templates** following the existing pattern
4. **Modify content** for specific business needs

### **Brand Customization**
- **Colors:** Update color scheme in template CSS
- **Logo:** Change branding elements
- **Footer:** Modify contact information
- **Domain:** Update links to your domain

### **Content Personalization**
- **Dynamic data:** All templates support variable substitution
- **User context:** Personalized based on user profile
- **Transaction details:** Real-time order/item information
- **Action buttons:** Contextual call-to-action links

## **📈 Best Practices**

### **Email Deliverability**
- **Resend integration:** Professional email service
- **Domain verification:** Proper SPF/DKIM setup
- **Content optimization:** Avoid spam triggers
- **List management:** Clean, engaged subscriber base

### **User Experience**
- **Clear subject lines:** Descriptive, action-oriented
- **Mobile optimization:** Responsive design
- **Fast loading:** Optimized images and content
- **Accessibility:** Screen reader friendly

### **Analytics & Optimization**
- **A/B testing:** Test different subject lines and content
- **Performance monitoring:** Track delivery and engagement
- **Template optimization:** Improve based on metrics
- **User feedback:** Gather and implement improvements

## **🔍 Troubleshooting**

### **Common Issues**
1. **Emails not sending:** Check Resend API key configuration
2. **Template errors:** Verify template syntax and variables
3. **Delivery issues:** Check domain verification in Resend
4. **Styling problems:** Test across different email clients

### **Debug Tools**
- **Email logs:** Check `email_logs` table for delivery status
- **Resend dashboard:** Monitor delivery and engagement
- **Test emails:** Use test template for debugging
- **Console logs:** Check browser console for errors

## **📞 Support**

For email template customization or technical support:
- **Email:** support@thevillageway.com
- **Documentation:** This file and inline code comments
- **Resend Support:** [resend.com/support](https://resend.com/support)

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Production Ready ✅
