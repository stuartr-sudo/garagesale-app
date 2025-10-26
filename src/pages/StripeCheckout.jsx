import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, amount, items, userId, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        
        let errorTitle = "Payment Failed";
        let errorDescription = error.message || "Your payment could not be processed.";
        
        if (error.code === 'card_declined') {
          errorTitle = "Card Declined";
          if (error.decline_code === 'insufficient_funds') {
            errorDescription = "Your card has insufficient funds. Please try a different card.";
          } else {
            errorDescription = "Your card was declined. Please try a different card or contact your bank.";
          }
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded - call success handler
        await onPaymentSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-3">
        <h3 className="text-white font-semibold text-lg mb-3">Order Summary</h3>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-400 truncate flex-1">{item.title}</span>
            <span className="text-cyan-400 font-medium ml-4">${item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold text-lg">Total</span>
            <span className="text-cyan-400 font-bold text-xl">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Details
        </label>
        <div className="p-4 bg-gray-900 rounded-lg border-2 border-gray-700 focus-within:border-cyan-500">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-green-400 font-medium mb-1">Secure Payment</h3>
            <p className="text-green-200 text-sm">
              Your payment is processed securely by Stripe. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
};

export default function StripeCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    setIsLoading(true);
    try {
      // Get checkout data from sessionStorage
      const stored = sessionStorage.getItem('checkout_data');
      if (!stored) {
        toast({
          title: "Error",
          description: "No checkout data found",
          variant: "destructive"
        });
        navigate(createPageUrl('Cart'));
        return;
      }

      const data = JSON.parse(stored);
      setCheckoutData(data);

      // Get Supabase credentials
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured');
      }

      // Call Supabase Edge Function to create Payment Intent
      const amountInCents = Math.round(data.totalAmount * 100);
      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: 'aud',
          itemId: data.items[0]?.id || 'cart-checkout'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error:', errorText);
        throw new Error(`Failed to create payment intent: ${response.status} ${response.statusText}`);
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);

    } catch (error) {
      console.error('Error loading checkout:', error);
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive"
      });
      navigate(createPageUrl('Cart'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    setIsProcessingOrder(true);
    
    try {
      console.log('🔥 PAYMENT SUCCEEDED - Processing order...');
      console.log('Payment Intent:', paymentIntent.id);
      
      const { items, userId } = checkoutData;
      const itemIds = items.map(item => item.id);

      console.log('🔥 RPC process_purchase with:', {
        buyerId: userId,
        itemIds: itemIds,
        deliveryMethod: 'collect',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      // Call process_purchase RPC function
      const { data, error } = await supabase.rpc('process_purchase', {
        param_buyer_id: userId,
        param_item_ids: itemIds,
        param_delivery_method: 'collect',
        param_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (error) {
        console.error('❌ RPC process_purchase error:', error);
        throw error;
      }

      console.log('✅ process_purchase successful:', data);

      // Clear session storage
      sessionStorage.removeItem('checkout_data');
      sessionStorage.removeItem('cart_items');

      toast({
        title: "Payment Successful! 🎉",
        description: "Your purchase is complete. Check My Orders for details.",
      });

      // Navigate to My Orders
      navigate(createPageUrl('MyOrders'), { replace: true });

    } catch (error) {
      console.error('❌ Error processing order:', error);
      toast({
        title: "Order Processing Error",
        description: "Payment succeeded but order creation failed. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleBackToCart = () => {
    navigate(createPageUrl('Cart'));
  };

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-white text-lg">Initializing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (isProcessingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="flex flex-col items-center gap-4 bg-gray-800 border border-gray-700 rounded-lg p-8">
          <Loader2 className="w-16 h-16 animate-spin text-emerald-500" />
          <h2 className="text-white text-2xl font-bold">Processing Your Order...</h2>
          <p className="text-gray-400 text-center">
            Please wait while we complete your purchase.
            <br />
            Do not close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={handleBackToCart}
          variant="outline"
          className="mb-6 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="w-6 h-6 text-emerald-500" />
              Stripe Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                clientSecret={clientSecret} 
                amount={checkoutData?.totalAmount || 0}
                items={checkoutData?.items || []}
                userId={checkoutData?.userId}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </Elements>
          </CardContent>
        </Card>

        {/* Test Card Info */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-blue-400 font-medium mb-2">Test Mode</h3>
              <p className="text-blue-200 text-sm mb-2">
                Use test card: <span className="font-mono">4242 4242 4242 4242</span>
              </p>
              <p className="text-blue-200 text-xs">
                Any future expiry, any CVC, any ZIP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
