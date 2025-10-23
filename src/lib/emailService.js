import { supabase } from './supabase'

/**
 * Email Service for Gmail OAuth Integration
 * Handles sending emails via Supabase Edge Functions
 */

// ============================================
// COMPREHENSIVE EMAIL TEMPLATE SYSTEM
// ============================================

// Base email template with consistent styling
const baseEmailTemplate = (content, actionButton = null) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding: 20px 0; border-bottom: 3px solid #06b6d4;">
      <h1 style="color: #06b6d4; font-size: 32px; margin: 0; font-weight: bold;">🏪 GarageSale</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">Your Local Marketplace</p>
    </div>
    
    <!-- Content -->
    ${content}
    
    <!-- Action Button -->
    ${actionButton ? `
      <div style="text-align: center; margin: 30px 0;">
        ${actionButton}
      </div>
    ` : ''}
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        Need help? Contact us at <a href="mailto:support@thevillageway.com" style="color: #06b6d4; text-decoration: none;">support@thevillageway.com</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2024 GarageSale. All rights reserved.
      </p>
    </div>
  </div>
`;

// Email templates for different user actions
export const emailTemplates = {
  // ============================================
  // USER REGISTRATION & ONBOARDING
  // ============================================
  
  welcome: (userName, userEmail) => ({
    subject: 'Welcome to GarageSale! 🎉',
    html: baseEmailTemplate(`
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 30px; border-radius: 12px; margin-bottom: 30px; color: white;">
        <h2 style="color: white; margin: 0 0 15px 0; font-size: 24px;">Welcome ${userName}! 👋</h2>
        <p style="color: white; margin: 0; font-size: 16px; line-height: 1.5;">
          Thanks for joining our community marketplace! You're now ready to buy and sell items locally.
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">What's Next?</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">📱 Browse items in your local area</li>
          <li style="margin-bottom: 8px;">🛒 Add items to your cart and checkout</li>
          <li style="margin-bottom: 8px;">📦 List your own items for sale</li>
          <li style="margin-bottom: 8px;">💬 Chat with buyers and sellers</li>
        </ul>
      </div>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/marketplace" 
         style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Start Shopping Now
      </a>
    `),
    text: `Welcome to GarageSale, ${userName}!\n\nThanks for joining our community marketplace! You're now ready to buy and sell items locally.\n\nWhat's Next?\n- Browse items in your local area\n- Add items to your cart and checkout\n- List your own items for sale\n- Chat with buyers and sellers\n\nStart shopping: ${process.env.VITE_APP_URL || 'https://thevillageway.com'}/marketplace`
  }),

  emailVerification: (userName, verificationLink) => ({
    subject: 'Verify Your Email Address - GarageSale',
    html: baseEmailTemplate(`
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #92400e; margin: 0 0 10px 0;">📧 Email Verification Required</h3>
        <p style="color: #92400e; margin: 0;">Please verify your email address to complete your account setup.</p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        To complete your GarageSale account setup, please verify your email address by clicking the button below.
      </p>
    `, `
      <a href="${verificationLink}" 
         style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    `),
    text: `Hi ${userName},\n\nTo complete your GarageSale account setup, please verify your email address by clicking this link: ${verificationLink}`
  }),

  // ============================================
  // MARKETPLACE TRANSACTIONS
  // ============================================
  
  purchaseConfirmation: (buyerName, itemName, amount, orderId, sellerName) => ({
    subject: `Order Confirmed - ${itemName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #065f46; margin: 0 0 10px 0;">✅ Order Confirmed!</h3>
        <p style="color: #065f46; margin: 0;">Your purchase has been confirmed and the seller has been notified.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Order Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Order ID:</span>
          <span style="color: #1f2937; font-weight: bold;">#${orderId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Item:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Amount:</span>
          <span style="color: #1f2937; font-weight: bold;">$${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Seller:</span>
          <span style="color: #1f2937; font-weight: bold;">${sellerName}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        The seller has been notified of your purchase and will confirm payment receipt shortly. 
        You'll receive updates on your order status.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/my-orders" 
         style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View My Orders
      </a>
    `),
    text: `Order Confirmed!\n\nOrder ID: #${orderId}\nItem: ${itemName}\nAmount: $${amount}\nSeller: ${sellerName}\n\nThe seller has been notified of your purchase and will confirm payment receipt shortly.`
  }),

  saleNotification: (sellerName, itemName, amount, buyerName, orderId) => ({
    subject: `New Sale - ${itemName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0;">💰 New Sale!</h3>
        <p style="color: #1e40af; margin: 0;">Someone has purchased your item and confirmed payment.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Sale Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Order ID:</span>
          <span style="color: #1f2937; font-weight: bold;">#${orderId}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Item:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Amount:</span>
          <span style="color: #1f2937; font-weight: bold;">$${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Buyer:</span>
          <span style="color: #1f2937; font-weight: bold;">${buyerName}</span>
        </div>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #92400e; margin: 0; font-weight: bold;">⚠️ Action Required</p>
        <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">
          Please confirm you've received payment within 12 hours to avoid account restrictions.
        </p>
      </div>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/payment-confirmations" 
         style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Confirm Payment Received
      </a>
    `),
    text: `New Sale!\n\nOrder ID: #${orderId}\nItem: ${itemName}\nAmount: $${amount}\nBuyer: ${buyerName}\n\nPlease confirm you've received payment within 12 hours to avoid account restrictions.`
  }),

  offerReceived: (sellerName, itemName, offerAmount, buyerName, originalPrice) => ({
    subject: `New Offer for ${itemName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">🤝 New Offer Received!</h3>
        <p style="color: #0c4a6e; margin: 0;">Someone has made an offer on your item.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Offer Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Item:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Original Price:</span>
          <span style="color: #1f2937; font-weight: bold;">$${originalPrice}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Offer Amount:</span>
          <span style="color: #10b981; font-weight: bold; font-size: 18px;">$${offerAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">From:</span>
          <span style="color: #1f2937; font-weight: bold;">${buyerName}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        You can accept this offer, make a counter-offer, or decline it. The buyer will be notified of your decision.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/my-items" 
         style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Review Offer
      </a>
    `),
    text: `New Offer Received!\n\nItem: ${itemName}\nOriginal Price: $${originalPrice}\nOffer Amount: $${offerAmount}\nFrom: ${buyerName}\n\nYou can accept this offer, make a counter-offer, or decline it.`
  }),

  offerAccepted: (buyerName, itemName, acceptedAmount, sellerName) => ({
    subject: `Offer Accepted - ${itemName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #065f46; margin: 0 0 10px 0;">🎉 Offer Accepted!</h3>
        <p style="color: #065f46; margin: 0;">The seller has accepted your offer!</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Accepted Offer Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Item:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Accepted Amount:</span>
          <span style="color: #10b981; font-weight: bold; font-size: 18px;">$${acceptedAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Seller:</span>
          <span style="color: #1f2937; font-weight: bold;">${sellerName}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Great news! The seller has accepted your offer. You can now proceed to complete the purchase.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/cart" 
         style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Complete Purchase
      </a>
    `),
    text: `Offer Accepted!\n\nItem: ${itemName}\nAccepted Amount: $${acceptedAmount}\nSeller: ${sellerName}\n\nGreat news! The seller has accepted your offer. You can now proceed to complete the purchase.`
  }),

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================
  
  accountSuspended: (userName, reason, suspensionEndDate) => ({
    subject: 'Account Suspended - GarageSale',
    html: baseEmailTemplate(`
      <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Account Suspended</h3>
        <p style="color: #dc2626; margin: 0;">Your account has been temporarily suspended.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Suspension Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Reason:</span>
          <span style="color: #1f2937; font-weight: bold;">${reason}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Suspension Ends:</span>
          <span style="color: #1f2937; font-weight: bold;">${suspensionEndDate}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        During this suspension, you cannot list new items or make purchases. 
        Please review our terms of service and contact support if you have questions.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/contact" 
         style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Contact Support
      </a>
    `),
    text: `Account Suspended\n\nReason: ${reason}\nSuspension Ends: ${suspensionEndDate}\n\nDuring this suspension, you cannot list new items or make purchases. Please review our terms of service and contact support if you have questions.`
  }),

  accountRestricted: (userName, reason, pendingConfirmations) => ({
    subject: 'Account Restricted - Payment Confirmation Required',
    html: baseEmailTemplate(`
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #92400e; margin: 0 0 10px 0;">🔒 Account Restricted</h3>
        <p style="color: #92400e; margin: 0;">Your account has been restricted due to pending payment confirmations.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Restriction Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Reason:</span>
          <span style="color: #1f2937; font-weight: bold;">${reason}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Pending Confirmations:</span>
          <span style="color: #1f2937; font-weight: bold;">${pendingConfirmations}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        To restore your account access, please confirm all pending payment receipts. 
        This restriction will be lifted once all confirmations are completed.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/payment-confirmations" 
         style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Confirm Payments
      </a>
    `),
    text: `Account Restricted\n\nReason: ${reason}\nPending Confirmations: ${pendingConfirmations}\n\nTo restore your account access, please confirm all pending payment receipts.`
  }),

  // ============================================
  // NOTIFICATIONS & UPDATES
  // ============================================
  
  newMessage: (recipientName, senderName, messagePreview, itemName) => ({
    subject: `New Message from ${senderName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">💬 New Message</h3>
        <p style="color: #0c4a6e; margin: 0;">You have received a new message from ${senderName}.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Message Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">From:</span>
          <span style="color: #1f2937; font-weight: bold;">${senderName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">About:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="margin-top: 15px;">
          <span style="color: #6b7280; font-size: 14px;">Message Preview:</span>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin-top: 8px; font-style: italic; color: #374151;">
            "${messagePreview}"
          </div>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Reply to this message to continue the conversation with ${senderName}.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/messages" 
         style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View Message
      </a>
    `),
    text: `New Message from ${senderName}\n\nAbout: ${itemName}\nMessage: "${messagePreview}"\n\nReply to this message to continue the conversation.`
  }),

  itemSold: (sellerName, itemName, amount, buyerName) => ({
    subject: `Item Sold - ${itemName} | GarageSale`,
    html: baseEmailTemplate(`
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #065f46; margin: 0 0 10px 0;">🎉 Item Sold!</h3>
        <p style="color: #065f46; margin: 0;">Congratulations! Your item has been sold.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1f2937; margin: 0 0 15px 0;">Sale Details</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Item:</span>
          <span style="color: #1f2937; font-weight: bold;">${itemName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Sale Price:</span>
          <span style="color: #10b981; font-weight: bold; font-size: 18px;">$${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #6b7280;">Buyer:</span>
          <span style="color: #1f2937; font-weight: bold;">${buyerName}</span>
        </div>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Great job! Your item has been successfully sold. The buyer has been notified and will arrange pickup or delivery.
      </p>
    `, `
      <a href="${process.env.VITE_APP_URL || 'https://thevillageway.com'}/my-items" 
         style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        View My Items
      </a>
    `),
    text: `Item Sold!\n\nItem: ${itemName}\nSale Price: $${amount}\nBuyer: ${buyerName}\n\nGreat job! Your item has been successfully sold.`
  }),

  // ============================================
  // SYSTEM & ADMIN
  // ============================================
  
  testEmail: (recipientEmail) => ({
    subject: 'GarageSale Test Email - Success!',
    html: baseEmailTemplate(`
      <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0;">✅ Test Email Successful!</h3>
        <p style="color: #1e40af; margin: 0;">Your email system is working perfectly.</p>
      </div>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        This is a test email sent to <strong>${recipientEmail}</strong> to confirm your email system is working correctly.
      </p>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1e40af; margin: 0 0 10px 0;">System Status</h4>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
          <li>✅ Resend integration working</li>
          <li>✅ Edge Functions deployed</li>
          <li>✅ Email templates configured</li>
          <li>✅ Delivery system active</li>
        </ul>
      </div>
    `),
    text: `Test Email Successful!\n\nThis is a test email sent to ${recipientEmail} to confirm your email system is working correctly.\n\nSystem Status:\n- Resend integration working\n- Edge Functions deployed\n- Email templates configured\n- Delivery system active`
  })
};
    text: `Welcome to GarageSale, ${userName}!\n\nThanks for joining our community marketplace. You're now ready to buy and sell items locally.\n\nWhat's Next?\n- Browse items in your local area\n- Add items to your cart and checkout\n- List your own items for sale\n- Chat with buyers and sellers\n\nStart shopping: ${process.env.VITE_APP_URL || 'https://garagesale.com'}/marketplace\n\nNeed help? Contact us at support@garagesale.com`
  }),

  // Payment confirmation email for sellers
  paymentConfirmation: (sellerName, buyerName, itemName, amount, confirmationDeadline) => ({
    subject: '💰 Payment Confirmation Required - Action Needed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #06b6d4; font-size: 32px; margin: 0;">🏪 GarageSale</h1>
        </div>
        
        <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 20px;">⚠️ Payment Confirmation Required</h2>
          <p style="color: #92400e; margin: 0; font-size: 16px;">
            A buyer has confirmed payment for your item. Please verify receipt within the deadline.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0;">Transaction Details</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Item:</span>
            <span style="color: #1f2937;">${itemName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Buyer:</span>
            <span style="color: #1f2937;">${buyerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Amount:</span>
            <span style="color: #1f2937; font-weight: bold; font-size: 18px;">$${amount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Confirm by:</span>
            <span style="color: #dc2626; font-weight: bold;">${new Date(confirmationDeadline).toLocaleString()}</span>
          </div>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0;">What You Need to Do</h3>
          <p style="color: #065f46; margin: 0; font-size: 14px;">
            1. Verify that you have received the payment<br>
            2. Click "Confirm Payment Received" in your dashboard<br>
            3. Complete the transaction within the deadline
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.VITE_APP_URL || 'https://garagesale.com'}/PaymentConfirmations" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Confirm Payment Received
          </a>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 25px;">
          <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: bold;">
            ⚠️ Important: If you don't confirm payment within the deadline, your account will be restricted.
          </p>
        </div>
      </div>
    `,
    text: `Payment Confirmation Required - Action Needed\n\nA buyer has confirmed payment for your item. Please verify receipt within the deadline.\n\nTransaction Details:\n- Item: ${itemName}\n- Buyer: ${buyerName}\n- Amount: $${amount}\n- Confirm by: ${new Date(confirmationDeadline).toLocaleString()}\n\nWhat You Need to Do:\n1. Verify that you have received the payment\n2. Click "Confirm Payment Received" in your dashboard\n3. Complete the transaction within the deadline\n\nConfirm Payment: ${process.env.VITE_APP_URL || 'https://garagesale.com'}/PaymentConfirmations\n\nImportant: If you don't confirm payment within the deadline, your account will be restricted.`
  }),

  // Order confirmation email for buyers
  orderConfirmation: (buyerName, itemName, amount, sellerName) => ({
    subject: '✅ Order Confirmed - Payment Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #06b6d4; font-size: 32px; margin: 0;">🏪 GarageSale</h1>
        </div>
        
        <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px;">✅ Order Confirmed!</h2>
          <p style="color: #065f46; margin: 0; font-size: 16px;">
            Your order has been confirmed. Please complete payment to the seller.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0;">Order Details</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Item:</span>
            <span style="color: #1f2937;">${itemName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Seller:</span>
            <span style="color: #1f2937;">${sellerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Amount:</span>
            <span style="color: #1f2937; font-weight: bold; font-size: 18px;">$${amount}</span>
          </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">Next Steps</h3>
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            1. Contact the seller to arrange payment and pickup<br>
            2. Complete payment within 24 hours<br>
            3. Arrange item pickup or delivery
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.VITE_APP_URL || 'https://garagesale.com'}/MyOrders" 
             style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View My Orders
          </a>
        </div>
      </div>
    `,
    text: `Order Confirmed - Payment Details\n\nYour order has been confirmed. Please complete payment to the seller.\n\nOrder Details:\n- Item: ${itemName}\n- Seller: ${sellerName}\n- Amount: $${amount}\n\nNext Steps:\n1. Contact the seller to arrange payment and pickup\n2. Complete payment within 24 hours\n3. Arrange item pickup or delivery\n\nView My Orders: ${process.env.VITE_APP_URL || 'https://garagesale.com'}/MyOrders`
  }),

  // Account restriction warning
  accountRestriction: (userName, restrictionReason, pendingCount) => ({
    subject: '⚠️ Account Restricted - Payment Confirmations Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #06b6d4; font-size: 32px; margin: 0;">🏪 GarageSale</h1>
        </div>
        
        <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 20px;">⚠️ Account Restricted</h2>
          <p style="color: #dc2626; margin: 0; font-size: 16px;">
            Your account has been restricted due to pending payment confirmations.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0;">Restriction Details</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Reason:</span>
            <span style="color: #1f2937;">${restrictionReason}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280; font-weight: bold;">Pending Confirmations:</span>
            <span style="color: #dc2626; font-weight: bold;">${pendingCount}</span>
          </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">What This Means</h3>
          <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
            <li style="margin-bottom: 5px;">You cannot access the marketplace</li>
            <li style="margin-bottom: 5px;">All your listings are hidden</li>
            <li style="margin-bottom: 5px;">You cannot create new listings</li>
            <li style="margin-bottom: 5px;">Restrictions will be lifted once you confirm all pending payments</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.VITE_APP_URL || 'https://garagesale.com'}/PaymentConfirmations" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Confirm Pending Payments
          </a>
        </div>
      </div>
    `,
    text: `Account Restricted - Payment Confirmations Required\n\nYour account has been restricted due to pending payment confirmations.\n\nRestriction Details:\n- Reason: ${restrictionReason}\n- Pending Confirmations: ${pendingCount}\n\nWhat This Means:\n- You cannot access the marketplace\n- All your listings are hidden\n- You cannot create new listings\n- Restrictions will be lifted once you confirm all pending payments\n\nConfirm Pending Payments: ${process.env.VITE_APP_URL || 'https://garagesale.com'}/PaymentConfirmations`
  })
}

/**
 * Send email via Gmail OAuth
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML content
 * @param {string} emailData.text - Text content
 * @param {string} emailData.from - Sender email (optional)
 * @param {string} emailData.replyTo - Reply-to email (optional)
 * @returns {Promise<Object>} - Result object with success status
 */
export async function sendEmail(emailData) {
  try {
    const { data, error } = await supabase.functions.invoke('send-gmail', {
      body: emailData
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send welcome email to new user
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @returns {Promise<Object>} - Result object
 */
export async function sendWelcomeEmail(userEmail, userName) {
  const template = emailTemplates.welcome(userName, userEmail)
  return await sendEmail({
    to: userEmail,
    ...template
  })
}

/**
 * Send payment confirmation email to seller
 * @param {string} sellerEmail - Seller's email
 * @param {string} sellerName - Seller's name
 * @param {string} buyerName - Buyer's name
 * @param {string} itemName - Item name
 * @param {number} amount - Payment amount
 * @param {string} confirmationDeadline - Confirmation deadline
 * @returns {Promise<Object>} - Result object
 */
export async function sendPaymentConfirmationEmail(sellerEmail, sellerName, buyerName, itemName, amount, confirmationDeadline) {
  const template = emailTemplates.paymentConfirmation(sellerName, buyerName, itemName, amount, confirmationDeadline)
  return await sendEmail({
    to: sellerEmail,
    ...template
  })
}

/**
 * Send order confirmation email to buyer
 * @param {string} buyerEmail - Buyer's email
 * @param {string} buyerName - Buyer's name
 * @param {string} itemName - Item name
 * @param {number} amount - Payment amount
 * @param {string} sellerName - Seller's name
 * @returns {Promise<Object>} - Result object
 */
export async function sendOrderConfirmationEmail(buyerEmail, buyerName, itemName, amount, sellerName) {
  const template = emailTemplates.orderConfirmation(buyerName, itemName, amount, sellerName)
  return await sendEmail({
    to: buyerEmail,
    ...template
  })
}

/**
 * Send account restriction email
 * @param {string} userEmail - User's email
 * @param {string} userName - User's name
 * @param {string} restrictionReason - Reason for restriction
 * @param {number} pendingCount - Number of pending confirmations
 * @returns {Promise<Object>} - Result object
 */
export async function sendAccountRestrictionEmail(userEmail, userName, restrictionReason, pendingCount) {
  const template = emailTemplates.accountRestriction(userName, restrictionReason, pendingCount)
  return await sendEmail({
    to: userEmail,
    ...template
  })
}

/**
 * Test email functionality
 * @param {string} testEmail - Email to send test to
 * @returns {Promise<Object>} - Result object
 */
export async function sendTestEmail(testEmail) {
  return await sendEmail({
    to: testEmail,
    subject: '🧪 GarageSale Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #06b6d4;">Email Test Successful! ✅</h1>
        <p>Your Gmail OAuth integration is working correctly.</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      </div>
    `,
    text: `Email Test Successful!\n\nYour Gmail OAuth integration is working correctly.\n\nTimestamp: ${new Date().toLocaleString()}`
  })
}
