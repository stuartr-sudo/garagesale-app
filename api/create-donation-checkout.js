// Vercel Serverless Function to create Stripe Checkout Session for Donations
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, donor_info } = req.body;

    // Validate amount
    if (!amount || amount < 5) {
      return res.status(400).json({ error: 'Minimum donation amount is $5' });
    }

    // Validate email
    if (!donor_info || !donor_info.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'BlockSwap Platform Donation',
              description: donor_info.message || 'Thank you for supporting BlockSwap!',
              images: ['https://www.blockswap.club/logo.png'], // Optional: Add your logo
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL || 'https://www.blockswap.club'}/success?donation=true&amount=${amount}`,
      cancel_url: `${process.env.VITE_APP_URL || 'https://www.blockswap.club'}/donations`,
      customer_email: donor_info.email,
      metadata: {
        type: 'donation',
        donor_name: donor_info.name || 'Anonymous',
        donor_message: donor_info.message || '',
        amount: amount.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    console.error('Donation checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create donation checkout session',
      message: error.message,
    });
  }
};

