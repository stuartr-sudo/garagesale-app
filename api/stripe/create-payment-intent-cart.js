import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'aud', items } = req.body;

    console.log('Creating payment intent for cart:', { amount, currency, itemCount: items?.length });

    if (!amount) {
      return res.status(400).json({ 
        error: 'Amount is required' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items array is required' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency.toLowerCase(),
      metadata: {
        cart_items: JSON.stringify(items.map(i => ({
          id: i.id,
          title: i.title,
          price: i.price
        }))),
        item_count: items.length.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
}

