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

    // Calculate processing fee (2.9% + 30 cents for Stripe)
    const processingFeeRate = 0.029; // 2.9%
    const processingFeeFixed = 30; // 30 cents in cents
    const processingFee = Math.round(amount * processingFeeRate) + processingFeeFixed;
    
    // Total amount including fee
    const totalAmount = amount + processingFee;

    // Create payment intent with the total amount (including fee)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency,
      metadata: {
        itemId: itemId,
        originalAmount: amount,
        processingFee: processingFee,
        feeRate: processingFeeRate,
        feeFixed: processingFeeFixed
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntent: paymentIntent,
      feeBreakdown: {
        originalAmount: amount,
        processingFee: processingFee,
        totalAmount: totalAmount,
        feeRate: processingFeeRate,
        feeFixed: processingFeeFixed
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
