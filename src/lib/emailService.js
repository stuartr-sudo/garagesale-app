// Email service for sending notifications
// Supports multiple email providers (SendGrid, AWS SES, etc.)

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid';

/**
 * Send an email using the configured provider
 * @param {Object} emailData - Email configuration
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.template - Template name
 * @param {Object} emailData.data - Template data
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmail(emailData) {
  try {
    switch (EMAIL_PROVIDER.toLowerCase()) {
      case 'sendgrid':
        return await sendWithSendGrid(emailData);
      case 'ses':
        return await sendWithSES(emailData);
      default:
        throw new Error(`Unsupported email provider: ${EMAIL_PROVIDER}`);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(emailData) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const { to, subject, template, data } = emailData;
  
  // Get template ID from environment or use default
  const templateId = process.env.SENDGRID_TEMPLATE_ID || 'd-1234567890abcdef';
  
  const msg = {
    to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@garagesale.com',
      name: process.env.FROM_NAME || 'Garage Sale'
    },
    templateId,
    dynamicTemplateData: {
      ...data,
      subject,
      year: new Date().getFullYear()
    }
  };

  const result = await sgMail.send(msg);
  return {
    success: true,
    messageId: result[0].headers['x-message-id'],
    provider: 'sendgrid'
  };
}

/**
 * Send email using AWS SES
 */
async function sendWithSES(emailData) {
  const AWS = require('aws-sdk');
  
  const ses = new AWS.SES({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  const { to, subject, template, data } = emailData;
  
  // Generate HTML content based on template
  const htmlContent = generateEmailHTML(template, data);
  
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlContent
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: process.env.FROM_EMAIL || 'noreply@garagesale.com'
  };

  const result = await ses.sendEmail(params).promise();
  return {
    success: true,
    messageId: result.MessageId,
    provider: 'ses'
  };
}

/**
 * Generate HTML content for email templates
 */
function generateEmailHTML(template, data) {
  switch (template) {
    case 'collection-reminder':
      return generateCollectionReminderHTML(data);
    default:
      return generateDefaultHTML(data);
  }
}

/**
 * Generate HTML for collection reminder email
 */
function generateCollectionReminderHTML(data) {
  const {
    buyerName,
    itemTitle,
    itemPrice,
    collectionDate,
    collectionAddress,
    sellerName,
    sellerEmail,
    transactionId,
    itemImage
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Collection Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .item-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; float: left; margin-right: 15px; }
        .item-details { overflow: hidden; }
        .price { font-size: 24px; font-weight: bold; color: #059669; }
        .collection-info { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Collection Reminder</h1>
          <p>Your item is ready for collection tomorrow!</p>
        </div>
        
        <div class="content">
          <p>Hi ${buyerName},</p>
          
          <p>This is a friendly reminder that you have an item scheduled for collection tomorrow:</p>
          
          <div class="item-card">
            ${itemImage ? `<img src="${itemImage}" alt="${itemTitle}" class="item-image">` : ''}
            <div class="item-details">
              <h3>${itemTitle}</h3>
              <div class="price">$${itemPrice}</div>
        </div>
            <div style="clear: both;"></div>
      </div>
      
          <div class="collection-info">
            <h3>📅 Collection Details</h3>
            <p><strong>Date & Time:</strong> ${collectionDate}</p>
            <p><strong>Address:</strong> ${collectionAddress}</p>
            <p><strong>Seller:</strong> ${sellerName} (${sellerEmail})</p>
      </div>
      
          <h3>Important Notes:</h3>
          <ul>
            <li>Please arrive on time for your collection</li>
            <li>Bring a valid ID for verification</li>
            <li>Contact the seller if you need to reschedule</li>
            <li>Transaction ID: ${transactionId}</li>
          </ul>
          
          <p>If you have any questions, please contact the seller directly.</p>
          
          <p>Thank you for using Garage Sale!</p>
        </div>
        
        <div class="footer">
          <p>This email was sent by Garage Sale</p>
          <p>© ${new Date().getFullYear()} Garage Sale. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate default HTML template
 */
function generateDefaultHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.subject || 'Notification'}</title>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>${data.subject || 'Notification'}</h2>
        <p>${data.message || 'You have a new notification.'}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email templates for various notifications
 */
export const emailTemplates = {
  welcome: (userName, userEmail) => ({
    subject: `Welcome to Garage Sale, ${userName}!`,
    html: generateWelcomeHTML(userName, userEmail),
    text: `Welcome to Garage Sale, ${userName}! Start selling your items today.`
  }),

  saleNotification: (sellerName, itemTitle, amount, buyerName, orderId) => ({
    subject: `🎉 Your item "${itemTitle}" has been sold!`,
    html: generateSaleNotificationHTML(sellerName, itemTitle, amount, buyerName, orderId),
    text: `Your item "${itemTitle}" has been sold for $${amount} to ${buyerName}. Order ID: ${orderId}`
  }),

  purchaseConfirmation: (buyerName, itemTitle, amount, orderId, sellerName) => ({
    subject: `✅ Purchase Confirmed: ${itemTitle}`,
    html: generatePurchaseConfirmationHTML(buyerName, itemTitle, amount, orderId, sellerName),
    text: `Your purchase of "${itemTitle}" for $${amount} has been confirmed. Order ID: ${orderId}`
  }),

  accountRestricted: (userName, restrictionReason, pendingCount) => ({
    subject: `⚠️ Account Access Restricted`,
    html: generateAccountRestrictedHTML(userName, restrictionReason, pendingCount),
    text: `Your account has been restricted: ${restrictionReason}. You have ${pendingCount} pending confirmations.`
  }),

  testEmail: (testEmail) => ({
    subject: `🧪 Test Email from Garage Sale`,
    html: generateTestEmailHTML(testEmail),
    text: `This is a test email sent to ${testEmail} from Garage Sale.`
  }),

  offerReceived: (sellerName, itemTitle, offerAmount, buyerName, originalPrice) => ({
    subject: `💰 New Offer for "${itemTitle}"`,
    html: generateOfferReceivedHTML(sellerName, itemTitle, offerAmount, buyerName, originalPrice),
    text: `You received a $${offerAmount} offer for "${itemTitle}" from ${buyerName}.`
  }),

  offerAccepted: (buyerName, itemTitle, acceptedAmount, sellerName) => ({
    subject: `✅ Your offer for "${itemTitle}" was accepted!`,
    html: generateOfferAcceptedHTML(buyerName, itemTitle, acceptedAmount, sellerName),
    text: `Your $${acceptedAmount} offer for "${itemTitle}" was accepted by ${sellerName}.`
  }),

  newMessage: (recipientName, senderName, messagePreview, itemTitle) => ({
    subject: `💬 New message about "${itemTitle}"`,
    html: generateNewMessageHTML(recipientName, senderName, messagePreview, itemTitle),
    text: `You received a new message from ${senderName} about "${itemTitle}": ${messagePreview}`
  }),

  itemSold: (sellerName, itemTitle, amount, buyerName) => ({
    subject: `🎉 "${itemTitle}" sold for $${amount}`,
    html: generateItemSoldHTML(sellerName, itemTitle, amount, buyerName),
    text: `Your item "${itemTitle}" has been sold for $${amount} to ${buyerName}.`
  })
};

/**
 * Generate welcome email HTML
 */
function generateWelcomeHTML(userName, userEmail) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Garage Sale</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Garage Sale!</h1>
          <p>Start turning your unwanted items into cash</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>Welcome to Garage Sale! We're excited to have you join our community of smart sellers and savvy buyers.</p>
          
          <h3>🚀 Get Started:</h3>
          <ul>
            <li>📸 Take photos of items you want to sell</li>
            <li>🤖 Let our AI write compelling descriptions</li>
            <li>💰 Set your price and start selling</li>
            <li>🔒 Secure payments with Stripe</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_APP_URL || 'https://garage-sale-40afc1f5.vercel.app'}/add-item" class="button">
              List Your First Item
            </a>
      </div>
      
          <h3>💡 Pro Tips:</h3>
          <ul>
            <li>Use good lighting for photos</li>
            <li>Be honest about condition</li>
            <li>Set competitive prices</li>
            <li>Respond quickly to buyers</li>
          </ul>
          
          <p>Happy selling!</p>
          <p>The Garage Sale Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Garage Sale. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate sale notification HTML
 */
function generateSaleNotificationHTML(sellerName, itemTitle, amount, buyerName, orderId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Item Sold - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>🎉 Congratulations!</h1>
          <p>Your item has been sold!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${sellerName},</p>
          
          <p>Great news! Your item <strong>"${itemTitle}"</strong> has been sold for <strong>$${amount}</strong>.</p>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">Sale Details</h3>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Buyer:</strong> ${buyerName}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
          </div>
          
          <p>Next steps:</p>
          <ul>
            <li>Arrange collection with the buyer</li>
            <li>Complete the transaction</li>
            <li>Rate your experience</li>
          </ul>
          
          <p>Thank you for using Garage Sale!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate purchase confirmation HTML
 */
function generatePurchaseConfirmationHTML(buyerName, itemTitle, amount, orderId, sellerName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Purchase Confirmed - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>✅ Purchase Confirmed!</h1>
          <p>Your order has been processed</p>
      </div>
      
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${buyerName},</p>
          
          <p>Your purchase of <strong>"${itemTitle}"</strong> has been confirmed!</p>
          
          <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Order Details</h3>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Seller:</strong> ${sellerName}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
      </div>
      
          <p>Next steps:</p>
          <ul>
            <li>Contact the seller to arrange collection</li>
            <li>Complete the transaction</li>
            <li>Rate your experience</li>
        </ul>
          
          <p>Thank you for using Garage Sale!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate account restricted HTML
 */
function generateAccountRestrictedHTML(userName, restrictionReason, pendingCount) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Restricted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>⚠️ Account Restricted</h1>
          <p>Action required</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${userName},</p>
          
          <p>Your account has been temporarily restricted due to: <strong>${restrictionReason}</strong></p>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Pending Confirmations</h3>
            <p>You have <strong>${pendingCount}</strong> pending confirmations that need to be resolved.</p>
          </div>
          
          <p>To restore full access:</p>
          <ul>
            <li>Complete all pending confirmations</li>
            <li>Ensure all transactions are properly documented</li>
            <li>Contact support if you need assistance</li>
          </ul>
          
          <p>If you believe this is an error, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate test email HTML
 */
function generateTestEmailHTML(testEmail) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>🧪 Test Email</h1>
          <p>Email system is working!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>This is a test email sent to <strong>${testEmail}</strong> from Garage Sale.</p>
          
          <div style="background: #f3e8ff; border: 1px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #6b21a8; margin-top: 0;">✅ Email System Status</h3>
            <p>The email notification system is working correctly!</p>
        </div>
        
          <p>You can now receive notifications for:</p>
          <ul>
            <li>New messages</li>
            <li>Item sales</li>
            <li>Offer updates</li>
            <li>Collection reminders</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate offer received HTML
 */
function generateOfferReceivedHTML(sellerName, itemTitle, offerAmount, buyerName, originalPrice) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Offer - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>💰 New Offer Received!</h1>
          <p>Someone wants to buy your item</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${sellerName},</p>
          
          <p>You received a new offer for <strong>"${itemTitle}"</strong>!</p>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Offer Details</h3>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Offer Amount:</strong> $${offerAmount}</p>
            <p><strong>Original Price:</strong> $${originalPrice}</p>
            <p><strong>Buyer:</strong> ${buyerName}</p>
        </div>
        
          <p>You can:</p>
          <ul>
            <li>Accept the offer</li>
            <li>Counter with a different amount</li>
            <li>Decline the offer</li>
          </ul>
          
          <p>Log in to your account to respond to this offer.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate offer accepted HTML
 */
function generateOfferAcceptedHTML(buyerName, itemTitle, acceptedAmount, sellerName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Offer Accepted - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>✅ Offer Accepted!</h1>
          <p>Your offer has been accepted</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${buyerName},</p>
          
          <p>Great news! Your offer for <strong>"${itemTitle}"</strong> has been accepted!</p>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">Accepted Offer</h3>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Accepted Amount:</strong> $${acceptedAmount}</p>
            <p><strong>Seller:</strong> ${sellerName}</p>
        </div>
        
          <p>Next steps:</p>
          <ul>
            <li>Complete the payment</li>
            <li>Arrange collection with the seller</li>
            <li>Rate your experience</li>
          </ul>
          
          <p>Thank you for using Garage Sale!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate new message HTML
 */
function generateNewMessageHTML(recipientName, senderName, messagePreview, itemTitle) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Message - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>💬 New Message</h1>
          <p>You have a new message</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${recipientName},</p>
          
          <p>You received a new message from <strong>${senderName}</strong> about <strong>"${itemTitle}"</strong>.</p>
          
          <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Message Preview</h3>
            <p style="font-style: italic;">"${messagePreview}"</p>
          </div>
          
          <p>Log in to your account to read the full message and respond.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate item sold HTML
 */
function generateItemSoldHTML(sellerName, itemTitle, amount, buyerName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Item Sold - ${itemTitle}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>🎉 Item Sold!</h1>
          <p>Congratulations on your sale</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${sellerName},</p>
          
          <p>Congratulations! Your item <strong>"${itemTitle}"</strong> has been sold for <strong>$${amount}</strong>!</p>
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">Sale Summary</h3>
            <p><strong>Item:</strong> ${itemTitle}</p>
            <p><strong>Sale Amount:</strong> $${amount}</p>
            <p><strong>Buyer:</strong> ${buyerName}</p>
          </div>
          
          <p>Next steps:</p>
          <ul>
            <li>Arrange collection with the buyer</li>
            <li>Complete the transaction</li>
            <li>Rate your experience</li>
          </ul>
          
          <p>Thank you for using Garage Sale!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}