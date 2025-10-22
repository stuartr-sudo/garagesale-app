import { supabase } from '../lib/supabase'
import { 
  sendEmail, 
  sendWelcomeEmail, 
  sendPaymentConfirmationEmail, 
  sendOrderConfirmationEmail, 
  sendAccountRestrictionEmail,
  sendTestEmail 
} from '../lib/emailService'

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
    // Send welcome email
    const emailResult = await sendWelcomeEmail(userEmail, userName)
    
    if (emailResult.success) {
      // Log email sent in database
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          to_email: userEmail,
          subject: 'Welcome to GarageSale! 🎉',
          status: 'sent',
          template_name: 'welcome'
        })
    }
    
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
    
    // Calculate confirmation deadline (12 hours from now)
    const confirmationDeadline = new Date()
    confirmationDeadline.setHours(confirmationDeadline.getHours() + 12)
    
    // Send payment confirmation email
    const emailResult = await sendPaymentConfirmationEmail(
      seller.email,
      seller.full_name,
      buyer.full_name,
      item.title,
      amount,
      confirmationDeadline.toISOString()
    )
    
    if (emailResult.success) {
      // Log email sent
      await supabase
        .from('email_logs')
        .insert({
          user_id: sellerId,
          to_email: seller.email,
          subject: '💰 Payment Confirmation Required - Action Needed',
          status: 'sent',
          template_name: 'payment_confirmation'
        })
    }
    
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
    
    // Send order confirmation email
    const emailResult = await sendOrderConfirmationEmail(
      buyer.email,
      buyer.full_name,
      item.title,
      amount,
      seller.full_name
    )
    
    if (emailResult.success) {
      // Log email sent
      await supabase
        .from('email_logs')
        .insert({
          user_id: buyerId,
          to_email: buyer.email,
          subject: '✅ Order Confirmed - Payment Details',
          status: 'sent',
          template_name: 'order_confirmation'
        })
    }
    
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
    
    // Send account restriction email
    const emailResult = await sendAccountRestrictionEmail(
      user.email,
      user.full_name,
      restrictionReason,
      pendingCount
    )
    
    if (emailResult.success) {
      // Log email sent
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          to_email: user.email,
          subject: '⚠️ Account Restricted - Payment Confirmations Required',
          status: 'sent',
          template_name: 'account_restriction'
        })
    }
    
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
    const result = await sendTestEmail(testEmail)
    
    if (result.success) {
      // Log test email
      await supabase
        .from('email_logs')
        .insert({
          to_email: testEmail,
          subject: '🧪 GarageSale Email Test',
          status: 'sent',
          template_name: 'test'
        })
    }
    
    return result
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
