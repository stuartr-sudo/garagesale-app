// Simple test script to verify Stripe configuration
// Run this with: node test-stripe-config.js

import https from 'https';

async function testStripeConfig() {
  console.log('🧪 Testing Stripe Configuration...\n');
  
  try {
    // Test the Stripe config endpoint
    const response = await fetch('https://garage-sale-40afc1f5.vercel.app/api/test/stripe-config');
    const data = await response.json();
    
    console.log('📊 Test Results:');
    console.log('================');
    console.log(`Total Tests: ${data.summary.totalTests}`);
    console.log(`Passed: ${data.summary.passedTests}`);
    console.log(`Failed: ${data.summary.failedTests}`);
    console.log(`Success Rate: ${data.summary.successRate}\n`);
    
    console.log('🔍 Detailed Results:');
    data.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⏭️';
      console.log(`${index + 1}. ${status} ${test.name}`);
      
      if (test.status === 'FAILED' && test.error) {
        console.log(`   Error: ${test.error}`);
      }
      
      if (test.details) {
        if (typeof test.details === 'object') {
          Object.entries(test.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        } else {
          console.log(`   Details: ${test.details}`);
        }
      }
      console.log('');
    });
    
    if (data.summary.failedTests === 0) {
      console.log('🎉 All tests passed! Your Stripe configuration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the details above.');
    }
    
  } catch (error) {
    console.error('❌ Error testing Stripe configuration:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Your Vercel deployment is up to date');
    console.log('2. Environment variables are set correctly');
    console.log('3. The API endpoint is accessible');
  }
}

// Run the test
testStripeConfig();
