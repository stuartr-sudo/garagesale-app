export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Check if Stripe environment variables are set
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const viteStripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

    results.tests.push({
      name: 'Environment Variables',
      status: stripeSecretKey && stripePublishableKey && viteStripeKey ? 'PASSED' : 'FAILED',
      details: {
        STRIPE_SECRET_KEY: stripeSecretKey ? `${stripeSecretKey.substring(0, 10)}...` : 'NOT SET',
        STRIPE_PUBLISHABLE_KEY: stripePublishableKey ? `${stripePublishableKey.substring(0, 10)}...` : 'NOT SET',
        VITE_STRIPE_PUBLISHABLE_KEY: viteStripeKey ? `${viteStripeKey.substring(0, 10)}...` : 'NOT SET'
      }
    });

    // Test 2: Try to initialize Stripe
    if (stripeSecretKey) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey);
        
        // Try to retrieve account info
        const account = await stripe.accounts.retrieve();
        
        results.tests.push({
          name: 'Stripe API Connection',
          status: 'PASSED',
          details: {
            accountId: account.id,
            country: account.country,
            type: account.type,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled
          }
        });
      } catch (error) {
        results.tests.push({
          name: 'Stripe API Connection',
          status: 'FAILED',
          error: error.message,
          details: 'Check if STRIPE_SECRET_KEY is valid'
        });
      }
    } else {
      results.tests.push({
        name: 'Stripe API Connection',
        status: 'SKIPPED',
        details: 'STRIPE_SECRET_KEY not set'
      });
    }

    // Test 3: Check if we can create a test payment intent
    if (stripeSecretKey) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 100, // $1.00 in cents
          currency: 'aud',
          metadata: {
            test: 'true'
          }
        });
        
        results.tests.push({
          name: 'Payment Intent Creation',
          status: 'PASSED',
          details: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
          }
        });
        
        // Cancel the test payment intent
        await stripe.paymentIntents.cancel(paymentIntent.id);
        
      } catch (error) {
        results.tests.push({
          name: 'Payment Intent Creation',
          status: 'FAILED',
          error: error.message,
          details: 'Check if Stripe account is properly configured'
        });
      }
    } else {
      results.tests.push({
        name: 'Payment Intent Creation',
        status: 'SKIPPED',
        details: 'STRIPE_SECRET_KEY not set'
      });
    }

    // Summary
    const passedTests = results.tests.filter(test => test.status === 'PASSED').length;
    const totalTests = results.tests.length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    results.summary = {
      totalTests,
      passedTests,
      failedTests: results.tests.filter(test => test.status === 'FAILED').length,
      skippedTests: results.tests.filter(test => test.status === 'SKIPPED').length,
      successRate: `${successRate}%`
    };

    return res.status(200).json(results);

  } catch (error) {
    console.error('Stripe config test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
}
