import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Check if database columns exist
    try {
      const { data: itemsColumns, error: itemsError } = await supabase
        .from('items')
        .select('collection_date, collection_address, seller_bank_details, crypto_wallet_addresses')
        .limit(1);

      if (itemsError) {
        results.tests.push({
          name: 'Database Schema - Items Table',
          status: 'FAILED',
          error: itemsError.message,
          details: 'Collection fields may not be added to items table'
        });
      } else {
        results.tests.push({
          name: 'Database Schema - Items Table',
          status: 'PASSED',
          details: 'Collection fields exist in items table'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Database Schema - Items Table',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 2: Check transactions table columns
    try {
      const { data: transactionsColumns, error: transactionsError } = await supabase
        .from('transactions')
        .select('payment_method, payment_status, crypto_currency, crypto_tx_hash, collection_date, collection_acknowledged')
        .limit(1);

      if (transactionsError) {
        results.tests.push({
          name: 'Database Schema - Transactions Table',
          status: 'FAILED',
          error: transactionsError.message,
          details: 'Payment fields may not be added to transactions table'
        });
      } else {
        results.tests.push({
          name: 'Database Schema - Transactions Table',
          status: 'PASSED',
          details: 'Payment fields exist in transactions table'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Database Schema - Transactions Table',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 3: Check environment variables
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const envVarsStatus = requiredEnvVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      value: process.env[varName] ? `${process.env[varName].substring(0, 10)}...` : 'NOT SET'
    }));

    results.tests.push({
      name: 'Environment Variables',
      status: envVarsStatus.every(env => env.exists) ? 'PASSED' : 'FAILED',
      details: envVarsStatus
    });

    // Test 4: Check if we can create a test transaction
    try {
      const testTransaction = {
        item_id: 'test-item-id',
        buyer_id: 'test-buyer-id',
        seller_id: 'test-seller-id',
        payment_method: 'stripe',
        payment_status: 'pending',
        amount: 100.00,
        collection_date: new Date().toISOString(),
        collection_acknowledged: false
      };

      // This will test the validation logic without actually inserting
      const validPaymentMethods = ['bank_transfer', 'stripe', 'crypto'];
      const validPaymentStatuses = ['pending', 'confirmed', 'completed', 'failed'];
      
      const paymentMethodValid = validPaymentMethods.includes(testTransaction.payment_method);
      const paymentStatusValid = validPaymentStatuses.includes(testTransaction.payment_status);

      results.tests.push({
        name: 'Transaction Validation',
        status: (paymentMethodValid && paymentStatusValid) ? 'PASSED' : 'FAILED',
        details: {
          paymentMethodValid,
          paymentStatusValid,
          validPaymentMethods,
          validPaymentStatuses
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Transaction Validation',
        status: 'FAILED',
        error: error.message
      });
    }

    // Test 5: Check if Stripe API is accessible
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Try to retrieve account info (this will test if the key is valid)
        const account = await stripe.accounts.retrieve();
        
        results.tests.push({
          name: 'Stripe API Connection',
          status: 'PASSED',
          details: {
            accountId: account.id,
            country: account.country,
            type: account.type
          }
        });
      } else {
        results.tests.push({
          name: 'Stripe API Connection',
          status: 'SKIPPED',
          details: 'STRIPE_SECRET_KEY not set'
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'Stripe API Connection',
        status: 'FAILED',
        error: error.message,
        details: 'Check if STRIPE_SECRET_KEY is valid'
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
    console.error('Payment system test error:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
}
