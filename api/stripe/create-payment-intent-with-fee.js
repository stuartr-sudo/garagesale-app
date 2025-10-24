import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'aud', itemId } = req.body;

    if (!amount || !itemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate processing fee (5% for seller deduction)
    const processingFeeRate = 0.05; // 5%
    const processingFee = Math.round(amount * processingFeeRate);
    
    // Buyer pays the original amount (no additional fees)
    const totalAmount = amount;

    // Create payment intent with the original amount (no buyer fees)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency,
      metadata: {
        itemId: itemId,
        originalAmount: amount,
        sellerProcessingFee: processingFee,
        feeRate: processingFeeRate,
        sellerPayout: amount - processingFee
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntent: paymentIntent,
      sellerFeeInfo: {
        originalAmount: amount,
        processingFee: processingFee,
        sellerPayout: amount - processingFee,
        feeRate: processingFeeRate
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
