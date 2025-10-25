# Complete Payment Integration Guide for Mobile App

This document provides comprehensive information about all payment methods: **Stripe (Credit Card) with Dynamic Pricing (NO Price IDs)**, **Cryptocurrency Payments**, and **Bank Transfer Payments**. This guide covers everything needed to implement the complete payment system for the mobile app.

## Overview

The platform supports three payment methods, each with its own integration requirements:

1. **Stripe Credit Card Payments** - Dynamic pricing with Payment Intents API (NO PRICE IDs)
2. **Cryptocurrency Payments** - Bitcoin, Ethereum, USDT, USDC, XRP support
3. **Bank Transfer Payments** - Direct bank-to-bank transfers

**CRITICAL: We use DYNAMIC PRICING - NO Stripe Price IDs are required. All prices are calculated at runtime based on item prices.**

---

## Part 1: Stripe Integration (Dynamic Pricing - NO Price IDs)

### 1. Stripe Setup & Configuration

#### Environment Variables
```javascript
const stripeEnvironmentVariables = {
  // Frontend (Mobile App)
  VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_... or pk_live_...",
  
  // Backend (API)
  STRIPE_SECRET_KEY: "sk_test_... or sk_live_..."
};
```

#### How to Get Stripe Keys
```javascript
const getStripeKeys = {
  step1: "Sign up for Stripe account at https://stripe.com",
  step2: "Go to Developers > API keys",
  step3: "Copy Publishable key for frontend",
  step4: "Copy Secret key for backend (keep this secure!)",
  step5: "For testing, use test keys (starts with pk_test_ and sk_test_)",
  step6: "For production, use live keys (starts with pk_live_ and sk_live_)"
};
```

### 2. Dynamic Pricing with Payment Intents (NO Price IDs!)

#### Why NO Price IDs?
```javascript
const whyNoPriceIds = {
  problem: "Stripe Price IDs require pre-creating products and prices in Stripe dashboard",
  limitations: [
    "Cannot handle dynamic/variable pricing",
    "Requires manual creation for each item",
    "Cannot handle negotiated prices",
    "Not suitable for marketplace with user-generated listings"
  ],
  
  solution: "Use Payment Intents API with dynamic amounts",
  benefits: [
    "Accept any price dynamically",
    "No pre-setup required",
    "Works with negotiated prices",
    "Perfect for marketplaces",
    "Real-time price calculation"
  ]
};
```

#### Payment Intent Creation API
```javascript
// Backend: /api/stripe/create-payment-intent.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'aud', itemId } = req.body;

    // Validate inputs
    if (!amount || !itemId) {
      return res.status(400).json({ 
        error: 'Amount and itemId are required' 
      });
    }

    // Create payment intent with DYNAMIC amount (NO Price ID!)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents (e.g., $50.00 = 5000)
      currency: currency.toLowerCase(), // 'aud', 'usd', 'eur', etc.
      metadata: {
        itemId: itemId,
        // Add any other metadata you need
      },
      automatic_payment_methods: {
        enabled: true, // Enables all available payment methods
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });

  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
```

#### Payment Intent with Platform Fee
```javascript
// Backend: /api/stripe/create-payment-intent-with-fee.js
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

    // Create payment intent with DYNAMIC amount
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
```

### 3. Frontend Stripe Integration (Mobile App)

#### Install Stripe Dependencies
```bash
# For React Native (Mobile)
npm install @stripe/stripe-react-native

# OR for React Web
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### Stripe Provider Setup (React Native)
```javascript
// App.js or Root Component
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  return (
    <StripeProvider
      publishableKey={process.env.VITE_STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.yourapp" // Optional for Apple Pay
    >
      {/* Your app content */}
    </StripeProvider>
  );
}
```

#### Payment Form Component
```javascript
// StripePaymentForm.jsx
import React, { useState, useEffect } from 'react';
import { CardField, useStripe } from '@stripe/stripe-react-native';
// OR for web:
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ item, onComplete }) {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Step 1: Create Payment Intent when component loads
  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent-with-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(item.price * 100), // Convert dollars to cents
          currency: 'aud', // or 'usd', 'eur', etc.
          itemId: item.id,
        }),
      });

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
    }
  };

  // Step 2: Confirm Payment
  const handlePayment = async () => {
    if (!stripe || !clientSecret) return;

    setLoading(true);

    try {
      // React Native
      const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      // OR for Web:
      // const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: elements.getElement(CardElement),
      //   },
      // });

      if (error) {
        alert(`Payment failed: ${error.message}`);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment successful!
        onComplete({
          paymentMethod: 'stripe',
          paymentStatus: 'completed',
          stripePaymentIntentId: paymentIntent.id,
          amount: item.price
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* React Native Card Input */}
      <CardField
        postalCodeEnabled={false}
        placeholder={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 30,
        }}
      />

      {/* OR for Web:
      <CardElement options={{
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
          },
        },
      }} />
      */}

      <Button
        title={loading ? "Processing..." : `Pay $${item.price.toFixed(2)}`}
        onPress={handlePayment}
        disabled={loading || !clientSecret}
      />
    </View>
  );
}
```

### 4. Stripe Payment Flow (Step-by-Step)

#### Complete Payment Flow
```javascript
const stripePaymentFlow = {
  // Step 1: User initiates payment
  step1_UserClicksPay: {
    action: "User clicks 'Pay with Card' button",
    trigger: "Open payment form/modal"
  },
  
  // Step 2: Create Payment Intent
  step2_CreatePaymentIntent: {
    action: "Frontend calls /api/stripe/create-payment-intent",
    parameters: {
      amount: "item.price * 100 (convert to cents)",
      currency: "'aud' or 'usd' or 'eur'",
      itemId: "unique item identifier"
    },
    returns: {
      clientSecret: "Used to confirm payment on frontend",
      paymentIntentId: "Stripe payment intent ID"
    },
    noPriceId: "✅ Dynamic amount calculated from item price - NO Price ID needed!"
  },
  
  // Step 3: User enters card details
  step3_EnterCardDetails: {
    action: "User enters card number, expiry, CVC",
    component: "CardField (React Native) or CardElement (Web)",
    validation: "Stripe automatically validates card details"
  },
  
  // Step 4: Confirm payment
  step4_ConfirmPayment: {
    action: "Frontend calls stripe.confirmPayment(clientSecret)",
    process: [
      "Stripe processes payment",
      "3D Secure authentication if required",
      "Payment approved or declined"
    ],
    returns: {
      success: "paymentIntent.status === 'succeeded'",
      error: "error.message with decline reason"
    }
  },
  
  // Step 5: Handle result
  step5_HandleResult: {
    onSuccess: {
      action: "Call onComplete callback",
      createOrder: "Create order record in database",
      sendEmail: "Send confirmation emails",
      updateItem: "Mark item as sold/pending"
    },
    onError: {
      action: "Show error message to user",
      retry: "Allow user to try again",
      alternatives: "Suggest other payment methods"
    }
  }
};
```

### 5. Supported Currencies

#### Currency Configuration
```javascript
const supportedCurrencies = {
  aud: {
    name: "Australian Dollar",
    symbol: "$",
    decimalPlaces: 2,
    stripeCode: "aud"
  },
  usd: {
    name: "US Dollar",
    symbol: "$",
    decimalPlaces: 2,
    stripeCode: "usd"
  },
  eur: {
    name: "Euro",
    symbol: "€",
    decimalPlaces: 2,
    stripeCode: "eur"
  },
  gbp: {
    name: "British Pound",
    symbol: "£",
    decimalPlaces: 2,
    stripeCode: "gbp"
  },
  cad: {
    name: "Canadian Dollar",
    symbol: "C$",
    decimalPlaces: 2,
    stripeCode: "cad"
  }
};

// Convert price to cents/smallest currency unit
const convertToSmallestUnit = (amount, currency) => {
  const decimalPlaces = supportedCurrencies[currency].decimalPlaces;
  return Math.round(amount * Math.pow(10, decimalPlaces));
};

// Example: $50.00 AUD = 5000 cents
const amountInCents = convertToSmallestUnit(50.00, 'aud'); // 5000
```

### 6. Error Handling

#### Common Stripe Errors
```javascript
const stripeErrorHandling = {
  card_declined: {
    message: "Your card was declined.",
    action: "Try a different card or contact your bank",
    codes: {
      insufficient_funds: "Card has insufficient funds",
      expired_card: "Card has expired",
      incorrect_cvc: "CVC code is incorrect",
      processing_error: "Error processing payment"
    }
  },
  
  invalid_number: {
    message: "Card number is invalid",
    action: "Check card number and try again"
  },
  
  invalid_expiry_month: {
    message: "Expiry month is invalid",
    action: "Check expiry date and try again"
  },
  
  invalid_expiry_year: {
    message: "Expiry year is invalid",
    action: "Check expiry date and try again"
  },
  
  invalid_cvc: {
    message: "CVC code is invalid",
    action: "Check the 3-digit code on the back of your card"
  },
  
  expired_card: {
    message: "Card has expired",
    action: "Use a different card"
  },
  
  processing_error: {
    message: "An error occurred while processing your card",
    action: "Try again or use a different payment method"
  }
};
```

---

## Part 2: Cryptocurrency Payment Integration

### 1. Cryptocurrency Setup

#### Supported Cryptocurrencies
```javascript
const supportedCryptocurrencies = {
  btc: {
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    network: "Bitcoin Mainnet",
    confirmations: 2, // Required confirmations
    estimatedTime: "10-20 minutes",
    explorer: "https://blockstream.info/tx/"
  },
  eth: {
    name: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    network: "Ethereum Mainnet",
    confirmations: 12,
    estimatedTime: "2-5 minutes",
    explorer: "https://etherscan.io/tx/"
  },
  usdt: {
    name: "Tether",
    symbol: "USDT",
    icon: "₮",
    network: "Ethereum (ERC-20)",
    confirmations: 12,
    estimatedTime: "2-5 minutes",
    explorer: "https://etherscan.io/tx/"
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    icon: "◉",
    network: "Ethereum (ERC-20)",
    confirmations: 12,
    estimatedTime: "2-5 minutes",
    explorer: "https://etherscan.io/tx/"
  },
  xrp: {
    name: "XRP",
    symbol: "XRP",
    icon: "✕",
    network: "XRP Ledger",
    confirmations: 1,
    estimatedTime: "3-5 seconds",
    explorer: "https://xrpscan.com/tx/"
  }
};
```

### 2. Seller Wallet Configuration

#### Database Schema
```sql
-- Add crypto wallet addresses to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS crypto_wallet_addresses JSONB DEFAULT '{}';

-- Example wallet addresses structure
-- {
--   "btc": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
--   "eth": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
--   "usdt": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
--   "usdc": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
--   "xrp": "rN7n7otQDd6FczFgLdlqtyMVrn3Q7sPCHGH"
-- }
```

#### Seller Setup Interface
```javascript
const sellerWalletSetup = {
  // Seller adds wallet addresses in Settings
  addWalletAddress: async (currency, address) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('crypto_wallet_addresses')
      .eq('id', userId)
      .single();
    
    const wallets = profile.crypto_wallet_addresses || {};
    wallets[currency.toLowerCase()] = address;
    
    await supabase
      .from('profiles')
      .update({ crypto_wallet_addresses: wallets })
      .eq('id', userId);
  },
  
  // Validate wallet address format
  validateAddress: (currency, address) => {
    const patterns = {
      btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      eth: /^0x[a-fA-F0-9]{40}$/,
      usdt: /^0x[a-fA-F0-9]{40}$/,
      usdc: /^0x[a-fA-F0-9]{40}$/,
      xrp: /^r[0-9a-zA-Z]{24,34}$/
    };
    
    return patterns[currency.toLowerCase()].test(address);
  }
};
```

### 3. Cryptocurrency Payment Flow

#### Complete Crypto Payment Process
```javascript
const cryptoPaymentFlow = {
  // Step 1: Select Cryptocurrency
  step1_SelectCrypto: {
    action: "User selects cryptocurrency (BTC, ETH, USDT, etc.)",
    component: "CryptoPaymentSelector",
    options: "Show available cryptos based on seller's wallet addresses"
  },
  
  // Step 2: Get Current Exchange Rate
  step2_GetExchangeRate: {
    action: "Fetch current exchange rate",
    api: "https://api.coingecko.com/api/v3/simple/price",
    calculate: "Convert item price to crypto amount",
    example: {
      itemPrice: 100, // $100 AUD
      btcRate: 50000, // 1 BTC = $50,000
      btcAmount: 0.002 // 100 / 50000 = 0.002 BTC
    }
  },
  
  // Step 3: Display Payment Details
  step3_DisplayPaymentDetails: {
    show: [
      "Wallet address (with QR code)",
      "Exact amount in cryptocurrency",
      "Exchange rate used",
      "Expiration time (usually 15-30 minutes)"
    ],
    component: "CryptoPaymentDetails"
  },
  
  // Step 4: User sends payment
  step4_UserSendsPayment: {
    action: "User sends crypto from their wallet to seller's address",
    wallet: "External crypto wallet (Coinbase, MetaMask, Trust Wallet, etc.)",
    amount: "Must send EXACT amount displayed"
  },
  
  // Step 5: User submits transaction hash
  step5_SubmitTxHash: {
    action: "User copies and pastes transaction hash",
    validate: "Frontend validates hash format",
    submit: "Save to database as pending payment"
  },
  
  // Step 6: Verification
  step6_Verification: {
    manual: {
      method: "Seller manually verifies transaction",
      tool: "Check blockchain explorer",
      action: "Confirm payment in dashboard"
    },
    automatic: {
      method: "Use blockchain API to verify",
      apis: [
        "Blockchain.com API",
        "Etherscan API",
        "CoinGecko API",
        "BlockCypher API"
      ],
      check: "Transaction exists and amount matches"
    }
  }
};
```

### 4. Crypto Payment Component

#### Payment Interface
```javascript
// CryptoPaymentDetails.jsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // or react-native-qrcode-svg for mobile

export default function CryptoPaymentDetails({ 
  currency, 
  walletAddress, 
  amount, 
  onComplete 
}) {
  const [txHash, setTxHash] = useState('');

  const copyToClipboard = (text) => {
    // Copy wallet address to clipboard
    navigator.clipboard.writeText(text);
    alert('Address copied!');
  };

  const handleSubmit = () => {
    if (!txHash) {
      alert('Please enter transaction hash');
      return;
    }

    onComplete({
      paymentMethod: 'crypto',
      paymentStatus: 'pending',
      cryptoCurrency: currency,
      cryptoTxHash: txHash,
      amount: amount
    });
  };

  return (
    <View>
      {/* Amount */}
      <Text>Send exactly: {amount} {currency}</Text>

      {/* QR Code */}
      <QRCodeSVG 
        value={walletAddress}
        size={200}
      />

      {/* Wallet Address */}
      <View>
        <Text>{walletAddress}</Text>
        <Button title="Copy" onPress={() => copyToClipboard(walletAddress)} />
      </View>

      {/* Transaction Hash Input */}
      <TextInput
        placeholder="Enter transaction hash..."
        value={txHash}
        onChangeText={setTxHash}
        multiline
      />

      {/* Instructions */}
      <Text>
        1. Send exactly {amount} {currency} to the address above
        2. Copy the transaction hash from your wallet
        3. Paste it in the field above
        4. Click Submit Payment
      </Text>

      <Button title="Submit Payment" onPress={handleSubmit} />
    </View>
  );
}
```

### 5. Exchange Rate API Integration

#### Fetch Crypto Prices
```javascript
const fetchCryptoPrice = async (currency, fiatCurrency = 'aud') => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinId(currency)}&vs_currencies=${fiatCurrency}`
    );
    const data = await response.json();
    
    const coinId = getCoinId(currency);
    return data[coinId][fiatCurrency];
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return null;
  }
};

const getCoinId = (currency) => {
  const ids = {
    btc: 'bitcoin',
    eth: 'ethereum',
    usdt: 'tether',
    usdc: 'usd-coin',
    xrp: 'ripple'
  };
  return ids[currency.toLowerCase()];
};

// Calculate crypto amount
const calculateCryptoAmount = async (fiatAmount, currency) => {
  const rate = await fetchCryptoPrice(currency);
  if (!rate) return null;
  
  return (fiatAmount / rate).toFixed(8); // 8 decimal places
};

// Example: Convert $100 AUD to BTC
const btcAmount = await calculateCryptoAmount(100, 'btc');
// Returns: "0.00200000" (if 1 BTC = $50,000)
```

---

## Part 3: Bank Transfer Integration

### 1. Bank Transfer Setup

#### Database Schema
```sql
-- Add bank details to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}';

-- Example bank details structure
-- {
--   "account_name": "John Doe",
--   "bsb": "123-456",
--   "account_number": "12345678",
--   "bank_name": "Commonwealth Bank" (optional)
-- }
```

#### Seller Setup Interface
```javascript
const sellerBankSetup = {
  // Seller adds bank details in Settings
  addBankDetails: async (bankInfo) => {
    const bankDetails = {
      account_name: bankInfo.accountName,
      bsb: bankInfo.bsb,
      account_number: bankInfo.accountNumber,
      bank_name: bankInfo.bankName // Optional
    };
    
    await supabase
      .from('profiles')
      .update({ bank_details: bankDetails })
      .eq('id', userId);
  },
  
  // Validate bank details
  validateBankDetails: (details) => {
    // BSB format: 123-456 or 123456
    const bsbPattern = /^\d{3}-?\d{3}$/;
    // Account number: 6-10 digits
    const accountPattern = /^\d{6,10}$/;
    
    return {
      bsbValid: bsbPattern.test(details.bsb),
      accountValid: accountPattern.test(details.account_number),
      nameValid: details.account_name.length > 0
    };
  }
};
```

### 2. Bank Transfer Payment Flow

#### Complete Bank Transfer Process
```javascript
const bankTransferFlow = {
  // Step 1: Select Bank Transfer
  step1_SelectBankTransfer: {
    action: "User selects 'Bank Transfer' payment method",
    check: "Verify seller has provided bank details"
  },
  
  // Step 2: Display Bank Details
  step2_DisplayBankDetails: {
    show: [
      "Account name",
      "BSB number",
      "Account number",
      "Transfer amount",
      "Reference number (auto-generated)"
    ],
    component: "BankTransferDetails",
    copyButtons: "Allow copying each field"
  },
  
  // Step 3: Generate Reference Number
  step3_GenerateReference: {
    format: "GS{timestamp}", // e.g., GS12345678
    purpose: "Track which payment belongs to which order",
    required: "User MUST include this in transfer reference/description"
  },
  
  // Step 4: User makes transfer
  step4_UserMakesTransfer: {
    action: "User logs into their bank and makes transfer",
    manual: true,
    externalSystem: "User's banking app/website",
    timing: "1-2 business days for transfer to appear"
  },
  
  // Step 5: User confirms transfer
  step5_ConfirmTransfer: {
    action: "User clicks 'I've Completed the Transfer'",
    status: "pending",
    createOrder: "Create order with 'pending_payment' status"
  },
  
  // Step 6: Seller verification
  step6_SellerVerification: {
    action: "Seller checks their bank account",
    verify: [
      "Amount matches order total",
      "Reference number matches",
      "Transfer has cleared"
    ],
    confirm: "Seller clicks 'Confirm Payment' in dashboard",
    status: "Update order to 'payment_confirmed'"
  }
};
```

### 3. Bank Transfer Component

#### Payment Interface
```javascript
// BankTransferDetails.jsx
import React, { useState, useEffect } from 'react';

export default function BankTransferDetails({ seller, amount, onComplete }) {
  const [referenceNumber, setReferenceNumber] = useState('');

  // Generate unique reference number
  useEffect(() => {
    const ref = `GS${Date.now().toString().slice(-8)}`;
    setReferenceNumber(ref);
  }, []);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    alert(`${field} copied to clipboard!`);
  };

  const handleComplete = () => {
    onComplete({
      referenceNumber: referenceNumber,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending'
    });
  };

  // Check if seller has bank details
  if (!seller.bank_details) {
    return (
      <View>
        <Text>Bank details not available</Text>
        <Text>The seller has not provided bank account details.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>Bank Transfer Details</Text>
      
      {/* Account Name */}
      <View>
        <Text>Account Name</Text>
        <TextInput 
          value={seller.bank_details.account_name} 
          editable={false} 
        />
        <Button 
          title="Copy" 
          onPress={() => copyToClipboard(seller.bank_details.account_name, 'Account Name')} 
        />
      </View>

      {/* BSB */}
      <View>
        <Text>BSB</Text>
        <TextInput 
          value={seller.bank_details.bsb} 
          editable={false} 
        />
        <Button 
          title="Copy" 
          onPress={() => copyToClipboard(seller.bank_details.bsb, 'BSB')} 
        />
      </View>

      {/* Account Number */}
      <View>
        <Text>Account Number</Text>
        <TextInput 
          value={seller.bank_details.account_number} 
          editable={false} 
        />
        <Button 
          title="Copy" 
          onPress={() => copyToClipboard(seller.bank_details.account_number, 'Account Number')} 
        />
      </View>

      {/* Amount */}
      <View>
        <Text>Amount</Text>
        <TextInput 
          value={`$${amount.toFixed(2)}`} 
          editable={false} 
        />
        <Button 
          title="Copy" 
          onPress={() => copyToClipboard(amount.toFixed(2), 'Amount')} 
        />
      </View>

      {/* Reference Number */}
      <View>
        <Text>Reference Number</Text>
        <TextInput 
          value={referenceNumber} 
          editable={false} 
        />
        <Button 
          title="Copy" 
          onPress={() => copyToClipboard(referenceNumber, 'Reference')} 
        />
      </View>

      {/* Instructions */}
      <Text>Important Instructions:</Text>
      <Text>• Transfer exactly ${amount.toFixed(2)}</Text>
      <Text>• Use reference number: {referenceNumber}</Text>
      <Text>• Keep your receipt as proof</Text>
      <Text>• Processing takes 1-2 business days</Text>

      <Button 
        title="I've Completed the Transfer" 
        onPress={handleComplete} 
      />
    </View>
  );
}
```

---

## Part 4: Payment Method Selection

### 1. Seller Payment Preferences

#### Database Configuration
```sql
-- Add accepted payment methods to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accepted_payment_methods TEXT[] DEFAULT ARRAY['bank_transfer', 'stripe', 'crypto'];

-- Example: Seller accepts only Stripe and Bank Transfer
UPDATE profiles
SET accepted_payment_methods = ARRAY['stripe', 'bank_transfer']
WHERE id = 'seller_id';
```

### 2. Payment Method Selector Component

```javascript
// PaymentMethodSelector.jsx
import React from 'react';

export default function PaymentMethodSelector({ 
  onSelect, 
  selected, 
  availableMethods = ['bank_transfer', 'stripe', 'crypto'] 
}) {
  const allPaymentMethods = [
    {
      id: 'stripe',
      name: 'Credit Card',
      description: 'Pay securely with credit or debit card',
      icon: 'CreditCard',
      processingTime: 'Instant',
      fees: 'Platform fee may apply'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer to seller\'s account',
      icon: 'Banknote',
      processingTime: '1-2 business days',
      fees: 'No fees'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
      icon: 'Coins',
      processingTime: '10-30 minutes',
      fees: 'Network fees apply'
    }
  ];

  // Filter based on seller's accepted methods
  const paymentMethods = allPaymentMethods.filter(method => 
    availableMethods.includes(method.id)
  );

  return (
    <View>
      <Text>Choose Payment Method</Text>
      
      {paymentMethods.map(method => (
        <TouchableOpacity
          key={method.id}
          onPress={() => onSelect(method.id)}
          style={selected === method.id ? styles.selected : styles.unselected}
        >
          <Icon name={method.icon} />
          <Text>{method.name}</Text>
          <Text>{method.description}</Text>
          <Text>Processing: {method.processingTime}</Text>
          <Text>{method.fees}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Part 5: Order Creation & Status Management

### 1. Database Schema

```sql
-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL, -- 'stripe', 'bank_transfer', 'crypto'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  -- Method-specific fields
  stripe_payment_intent_id TEXT, -- For Stripe
  crypto_currency TEXT, -- For crypto (btc, eth, etc.)
  crypto_tx_hash TEXT, -- For crypto
  bank_reference_number TEXT, -- For bank transfer
  
  -- Order status
  status TEXT DEFAULT 'pending_payment', -- 'pending_payment', 'payment_confirmed', 'completed', 'cancelled'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  payment_confirmed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Index for order lookups
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
```

### 2. Order Creation Logic

```javascript
const createOrder = async (orderData) => {
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{
      item_id: orderData.itemId,
      buyer_id: orderData.buyerId,
      seller_id: orderData.sellerId,
      total_amount: orderData.amount,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentStatus,
      
      // Method-specific fields
      stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
      crypto_currency: orderData.cryptoCurrency || null,
      crypto_tx_hash: orderData.cryptoTxHash || null,
      bank_reference_number: orderData.referenceNumber || null,
      
      status: orderData.paymentMethod === 'stripe' ? 'payment_confirmed' : 'pending_payment',
      payment_confirmed_at: orderData.paymentMethod === 'stripe' ? new Date().toISOString() : null
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }
  
  // Send confirmation emails
  await sendOrderConfirmationEmail(order);
  
  return { success: true, order };
};
```

---

## Part 6: Testing

### 1. Stripe Test Cards

```javascript
const stripeTestCards = {
  success: {
    number: "4242 4242 4242 4242",
    expiry: "Any future date",
    cvc: "Any 3 digits",
    result: "Payment succeeds"
  },
  
  decline_insufficient_funds: {
    number: "4000 0000 0000 9995",
    expiry: "Any future date",
    cvc: "Any 3 digits",
    result: "Card declined - insufficient funds"
  },
  
  decline_generic: {
    number: "4000 0000 0000 0002",
    expiry: "Any future date",
    cvc: "Any 3 digits",
    result: "Card declined - generic decline"
  },
  
  require_3d_secure: {
    number: "4000 0027 6000 3184",
    expiry: "Any future date",
    cvc: "Any 3 digits",
    result: "Requires 3D Secure authentication"
  }
};
```

### 2. Test Cryptocurrency Transactions

```javascript
const cryptoTesting = {
  testnet: {
    btc: "Use Bitcoin Testnet (BTC Testnet faucet)",
    eth: "Use Ethereum Sepolia or Goerli Testnet",
    url: "Get test coins from faucets"
  },
  
  testWallets: {
    btc_testnet: "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    eth_sepolia: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
};
```

---

## Summary

### Stripe (Credit Card) - Dynamic Pricing ✅
- ✅ **NO Price IDs Required** - All amounts are dynamic
- ✅ Payment Intents API with runtime amount calculation
- ✅ Supports all major credit/debit cards
- ✅ 3D Secure authentication
- ✅ Instant payment confirmation
- ✅ Platform fee support (5% default)

### Cryptocurrency 🪙
- ✅ Bitcoin, Ethereum, USDT, USDC, XRP support
- ✅ Seller wallet address configuration
- ✅ Real-time exchange rate conversion
- ✅ QR code for easy scanning
- ✅ Transaction hash verification
- ✅ Blockchain explorer integration

### Bank Transfer 🏦
- ✅ Direct bank-to-bank transfers
- ✅ Seller bank details configuration
- ✅ Unique reference numbers
- ✅ Copy-to-clipboard functionality
- ✅ Manual seller confirmation
- ✅ 1-2 business day processing

This complete guide provides everything needed to implement all three payment methods in your mobile app! 🚀💳🪙🏦
