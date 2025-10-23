import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ item, onComplete, onPaymentIntent }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
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
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
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
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#1f2937',
      },
      invalid: {
        color: '#ef4444',
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Details
                </label>
                <div className="p-4 border border-gray-600 rounded-lg bg-gray-700/50">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-green-400 font-medium mb-1">Secure Payment</h3>
                    <p className="text-green-200 text-sm">
                      Your payment is processed securely by Stripe. We never store your 
                      card details on our servers.
                    </p>
                  </div>
                </div>
              </div>

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
