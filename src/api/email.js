import { supabase } from '../lib/supabase'
import { emailTemplates, sendEmail } from '../lib/emailService'

/**
 * Email API - Integration with Gmail OAuth
 * Handles all email-related operations for the platform
 */

/**
 * Send welcome email to new user
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {string} userName - User name
 * @returns {Promise<Object>} - Result object
 */
export async function sendUserWelcomeEmail(userId, userEmail, userName) {
  try {
    const { subject, html, text } = emailTemplates.welcome(userName, userEmail)
    const emailResult = await sendEmail({ 
      to: userEmail, 
      subject, 
      html, 
      text, 
      templateName: 'welcome', 
      userId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Welcome email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send payment confirmation email to seller
 * @param {string} orderId - Order ID
 * @param {string} sellerId - Seller ID
 * @param {string} buyerId - Buyer ID
 * @param {string} itemId - Item ID
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} - Result object
 */
export async function sendSellerPaymentConfirmation(orderId, sellerId, buyerId, itemId, amount) {
  try {
    // Get seller and buyer details
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', sellerId)
      .single()
    
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', buyerId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (sellerError || buyerError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.saleNotification(
      seller.full_name, 
      item.title, 
      amount, 
      buyer.full_name, 
      orderId
    )
    
    const emailResult = await sendEmail({ 
      to: seller.email, 
      subject, 
      html, 
      text, 
      templateName: 'sale_notification', 
      userId: sellerId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Payment confirmation email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order confirmation email to buyer
 * @param {string} orderId - Order ID
 * @param {string} buyerId - Buyer ID
 * @param {string} sellerId - Seller ID
 * @param {string} itemId - Item ID
 * @param {number} amount - Payment amount
 * @returns {Promise<Object>} - Result object
 */
export async function sendBuyerOrderConfirmation(orderId, buyerId, sellerId, itemId, amount) {
  try {
    // Get buyer and seller details
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', buyerId)
      .single()
    
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sellerId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (buyerError || sellerError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.purchaseConfirmation(
      buyer.full_name,
      item.title,
      amount,
      orderId,
      seller.full_name
    )
    
    const emailResult = await sendEmail({ 
      to: buyer.email, 
      subject, 
      html, 
      text, 
      templateName: 'purchase_confirmation', 
      userId: buyerId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send account restriction email
 * @param {string} userId - User ID
 * @param {string} restrictionReason - Reason for restriction
 * @param {number} pendingCount - Number of pending confirmations
 * @returns {Promise<Object>} - Result object
 */
export async function sendUserAccountRestriction(userId, restrictionReason, pendingCount) {
  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()
    
    if (userError) {
      throw new Error('Failed to fetch user details')
    }
    
    const { subject, html, text } = emailTemplates.accountRestricted(
      user.full_name,
      restrictionReason,
      pendingCount
    )
    
    const emailResult = await sendEmail({ 
      to: user.email, 
      subject, 
      html, 
      text, 
      templateName: 'account_restricted', 
      userId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Account restriction email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send test email
 * @param {string} testEmail - Email to send test to
 * @returns {Promise<Object>} - Result object
 */
export async function sendTestEmailToUser(testEmail) {
  try {
    const { subject, html, text } = emailTemplates.testEmail(testEmail)
    
    const emailResult = await sendEmail({ 
      to: testEmail, 
      subject, 
      html, 
      text, 
      templateName: 'test_email', 
      userId: null 
    })
    
    return emailResult
  } catch (error) {
    console.error('Test email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get email logs for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of logs to return
 * @returns {Promise<Object>} - Email logs
 */
export async function getUserEmailLogs(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Get email logs error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send offer received email to seller
 * @param {string} sellerId - Seller ID
 * @param {string} buyerId - Buyer ID
 * @param {string} itemId - Item ID
 * @param {number} offerAmount - Offer amount
 * @param {number} originalPrice - Original price
 * @returns {Promise<Object>} - Result object
 */
export async function sendOfferReceivedEmail(sellerId, buyerId, itemId, offerAmount, originalPrice) {
  try {
    // Get seller, buyer, and item details
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', sellerId)
      .single()
    
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', buyerId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (sellerError || buyerError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.offerReceived(
      seller.full_name,
      item.title,
      offerAmount,
      buyer.full_name,
      originalPrice
    )
    
    const emailResult = await sendEmail({ 
      to: seller.email, 
      subject, 
      html, 
      text, 
      templateName: 'offer_received', 
      userId: sellerId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Offer received email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send offer accepted email to buyer
 * @param {string} buyerId - Buyer ID
 * @param {string} sellerId - Seller ID
 * @param {string} itemId - Item ID
 * @param {number} acceptedAmount - Accepted amount
 * @returns {Promise<Object>} - Result object
 */
export async function sendOfferAcceptedEmail(buyerId, sellerId, itemId, acceptedAmount) {
  try {
    // Get buyer, seller, and item details
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', buyerId)
      .single()
    
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sellerId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (buyerError || sellerError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.offerAccepted(
      buyer.full_name,
      item.title,
      acceptedAmount,
      seller.full_name
    )
    
    const emailResult = await sendEmail({ 
      to: buyer.email, 
      subject, 
      html, 
      text, 
      templateName: 'offer_accepted', 
      userId: buyerId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Offer accepted email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send new message notification email
 * @param {string} recipientId - Recipient ID
 * @param {string} senderId - Sender ID
 * @param {string} itemId - Item ID
 * @param {string} messagePreview - Message preview
 * @returns {Promise<Object>} - Result object
 */
export async function sendNewMessageEmail(recipientId, senderId, itemId, messagePreview) {
  try {
    // Get recipient, sender, and item details
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientId)
      .single()
    
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (recipientError || senderError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.newMessage(
      recipient.full_name,
      sender.full_name,
      messagePreview,
      item.title
    )
    
    const emailResult = await sendEmail({ 
      to: recipient.email, 
      subject, 
      html, 
      text, 
      templateName: 'new_message', 
      userId: recipientId 
    })
    
    return emailResult
  } catch (error) {
    console.error('New message email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send item sold notification email
 * @param {string} sellerId - Seller ID
 * @param {string} buyerId - Buyer ID
 * @param {string} itemId - Item ID
 * @param {number} amount - Sale amount
 * @returns {Promise<Object>} - Result object
 */
export async function sendItemSoldEmail(sellerId, buyerId, itemId, amount) {
  try {
    // Get seller, buyer, and item details
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', sellerId)
      .single()
    
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', buyerId)
      .single()
    
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('title')
      .eq('id', itemId)
      .single()
    
    if (sellerError || buyerError || itemError) {
      throw new Error('Failed to fetch user or item details')
    }
    
    const { subject, html, text } = emailTemplates.itemSold(
      seller.full_name,
      item.title,
      amount,
      buyer.full_name
    )
    
    const emailResult = await sendEmail({ 
      to: seller.email, 
      subject, 
      html, 
      text, 
      templateName: 'item_sold', 
      userId: sellerId 
    })
    
    return emailResult
  } catch (error) {
    console.error('Item sold email error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get email statistics
 * @returns {Promise<Object>} - Email statistics
 */
export async function getEmailStatistics() {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('status, template_name, sent_at')
    
    if (error) throw error
    
    // Calculate statistics
    const stats = {
      total: data.length,
      sent: data.filter(log => log.status === 'sent').length,
      failed: data.filter(log => log.status === 'failed').length,
      byTemplate: {},
      byStatus: {}
    }
    
    // Group by template
    data.forEach(log => {
      const template = log.template_name || 'custom'
      stats.byTemplate[template] = (stats.byTemplate[template] || 0) + 1
    })
    
    // Group by status
    data.forEach(log => {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
    })
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('Get email statistics error:', error)
    return { success: false, error: error.message }
  }
}
