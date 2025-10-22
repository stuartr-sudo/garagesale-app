import { supabase } from './supabase'

/**
 * Email Service for Gmail OAuth Integration
 * Handles sending emails via Supabase Edge Functions
 */

// Email templates
export const emailTemplates = {
  // Welcome email for new users
  welcome: (userName, userEmail) => ({
    subject: 'Welcome to GarageSale! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #06b6d4; font-size: 32px; margin: 0;">🏪 GarageSale</h1>
          <p style="color: #6b7280; font-size: 18px; margin: 10px 0 0 0;">Your Local Marketplace</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
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
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.VITE_APP_URL || 'https://garagesale.com'}/marketplace" 
             style="background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Start Shopping Now
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Need help? Contact us at <a href="mailto:support@garagesale.com" style="color: #06b6d4;">support@garagesale.com</a>
          </p>
        </div>
      </div>
    `,
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
