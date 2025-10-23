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