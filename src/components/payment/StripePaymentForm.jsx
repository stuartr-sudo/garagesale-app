import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Shield, AlertCircle, CheckCircle, Lock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ item, onComplete, onPaymentIntent }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [feeBreakdown, setFeeBreakdown] = useState(null);
  const { toast } = useToast();

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
          amount: Math.round(item.price * 100), // Convert to cents
          currency: 'aud',
          itemId: item.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntent(data.paymentIntent);
      setFeeBreakdown(data.feeBreakdown);
      onPaymentIntent(data.paymentIntent);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        
        // Set detailed error state for display in modal
        setPaymentError({
          type: error.type || 'payment_error',
          code: error.code || 'unknown',
          message: error.message || "Your payment could not be processed.",
          declineCode: error.decline_code,
          shouldRetry: error.shouldRetry || false
        });
        
        // Enhanced toast with specific error details
        let errorTitle = "Payment Failed";
        let errorDescription = error.message || "Your payment could not be processed.";
        
        if (error.code === 'card_declined') {
          errorTitle = "Card Declined";
          if (error.decline_code === 'insufficient_funds') {
            errorDescription = "Your card has insufficient funds. Please try a different card or add funds to your account.";
          } else if (error.decline_code === 'expired_card') {
            errorDescription = "Your card has expired. Please use a different card.";
          } else if (error.decline_code === 'incorrect_cvc') {
            errorDescription = "The security code (CVC) you entered is incorrect. Please check and try again.";
          } else {
            errorDescription = "Your card was declined. Please try a different card or contact your bank.";
          }
        } else if (error.code === 'processing_error') {
          errorTitle = "Processing Error";
          errorDescription = "There was an error processing your payment. Please try again.";
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        // Clear any previous errors
        setPaymentError(null);
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        
        onComplete({
          paymentMethod: 'stripe',
          paymentStatus: 'completed',
          stripePaymentIntentId: paymentIntent.id,
          amount: item.price
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
      complete: {
        color: '#10b981',
        iconColor: '#10b981',
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Initializing payment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Credit Card Payment</h2>
        <p className="text-gray-400">Enter your card details to complete the payment.</p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Item</p>
                <p className="text-white font-medium">{item.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-white font-bold text-lg">${item.price.toFixed(2)}</p>
              </div>
            </div>

            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Payment Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Item Price:</span>
                    <span className="text-white">${(feeBreakdown.originalAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing Fee ({(feeBreakdown.feeRate * 100).toFixed(1)}% + ${(feeBreakdown.feeFixed / 100).toFixed(2)}):</span>
                    <span className="text-yellow-400">+${(feeBreakdown.processingFee / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">${(feeBreakdown.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Processing fee covers secure payment processing and fraud protection.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Details
                </label>
                <div className="p-4 border-2 border-gray-500 rounded-lg bg-gray-800/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                  <CardElement options={cardElementOptions} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Enter your card number, expiry date, and CVV
                </p>
              </div>

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-green-400 font-medium mb-1">Secure Payment</h3>
                    <p className="text-green-200 text-sm">
                      Your payment is processed securely by Stripe. We never store your 
                      card details on our servers.
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-green-400" />
                        <span className="text-green-300 text-xs">Encrypted</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-green-400" />
                        <span className="text-green-300 text-xs">3D Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Error Display */}
              {paymentError && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-red-400 font-medium mb-1">
                        {paymentError.code === 'card_declined' ? 'Card Declined' : 'Payment Error'}
                      </h3>
                      <p className="text-red-200 text-sm mb-2">
                        {paymentError.message}
                      </p>
                      {paymentError.declineCode === 'insufficient_funds' && (
                        <div className="text-red-300 text-xs">
                          <p className="font-medium mb-1">What you can do:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Try a different card with sufficient funds</li>
                            <li>Add funds to your current card</li>
                            <li>Contact your bank to increase your limit</li>
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={() => setPaymentError(null)}
                        className="text-red-300 hover:text-red-200 text-xs underline mt-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay ${item.price.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Payment Protection</h3>
            <p className="text-blue-200 text-sm">
              Your payment is protected by Stripe's fraud detection and 3D Secure 
              authentication. You can dispute unauthorized charges through your bank.
            </p>
          </div>
        </div>
      </div>

      {/* Secure Payment Icons */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-4">
        <div className="text-center mb-4">
          <h3 className="text-white font-medium mb-2">Secure Payment Methods</h3>
          <p className="text-gray-400 text-sm">We accept all major credit and debit cards</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Visa */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-600 font-bold text-lg">VISA</div>
          </div>
          
          {/* Mastercard */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <div className="w-6 h-6 bg-yellow-500 rounded-full -ml-2"></div>
            </div>
          </div>
          
          {/* American Express */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-blue-600 font-bold text-sm">AMEX</div>
          </div>
          
          {/* Discover */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-orange-600 font-bold text-sm">DISCOVER</div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-700 rounded-lg px-3 py-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">SSL Secured</span>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-700 rounded-lg px-3 py-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">PCI Compliant</span>
          </div>
          
          <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-700 rounded-lg px-3 py-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">3D Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StripePaymentForm({ item, onComplete, onPaymentIntent }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        item={item} 
        onComplete={onComplete} 
        onPaymentIntent={onPaymentIntent}
      />
    </Elements>
  );
}
