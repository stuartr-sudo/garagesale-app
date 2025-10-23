import { sendEmail } from '@/lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { to, template = 'collection-reminder' } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Test email data
    const testData = {
      buyerName: 'Test User',
      itemTitle: 'Test Item',
      itemPrice: 50.00,
      collectionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      collectionAddress: '123 Test Street, Test Suburb, 1234',
      sellerName: 'Test Seller',
      sellerEmail: 'seller@example.com',
      transactionId: 'test-123',
      itemImage: null
    };

    const result = await sendEmail({
      to,
      subject: 'Test Collection Reminder',
      template,
      data: testData
    });

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      result
    });

  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      error: 'Failed to send test email',
      details: error.message
    });
  }
}
