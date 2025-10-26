import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, amount, onSuccess }) => {
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
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
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

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-lg"
      >
        {isProcessing ? (
          'Processing...'
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
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentComplete, setPaymentComplete] = useState(false);

  const clientSecret = location.state?.clientSecret;
  const amount = location.state?.amount || 0;

  useEffect(() => {
    if (!clientSecret) {
      toast({
        title: "Error",
        description: "Invalid checkout session",
        variant: "destructive"
      });
      navigate(createPageUrl('Cart'));
    }
  }, [clientSecret, navigate, toast]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Get cart data from session storage
      const pendingCheckout = sessionStorage.getItem('pendingCartCheckout');
      if (!pendingCheckout) {
        throw new Error('No pending checkout found');
      }

      const { cartItems } = JSON.parse(pendingCheckout);

      // Create orders for each cart item
      const orderPromises = cartItems.map(async (cartItem) => {
        const effectivePrice = cartItem.negotiated_price || cartItem.item.price;
        const item = cartItem.item;
        
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            item_id: item.id,
            buyer_id: cartItem.buyer_id,
            seller_id: item.seller_id,
            total_amount: effectivePrice,
            shipping_cost: 0,
            delivery_method: 'collect',
            collection_address: item.collection_address || item.location || null,
            collection_date: item.collection_date || null,
            status: 'payment_confirmed'
          })
          .select()
          .single();

        if (error) throw error;
        return order;
      });

      await Promise.all(orderPromises);

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', cartItems.map(ci => ci.id));

      if (clearError) throw clearError;

      // Clear session storage
      sessionStorage.removeItem('pendingCartCheckout');

      setPaymentComplete(true);

      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed",
      });

      // Redirect to My Orders after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl('MyOrders'));
      }, 2000);

    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Payment succeeded but order creation failed. Please contact support.",
        variant: "destructive"
      });
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-6">
        <Card className="bg-gray-800 border-green-500 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-4">Your order has been confirmed</p>
            <p className="text-sm text-gray-500">Redirecting to your orders...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl('Cart'))}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="w-6 h-6 text-emerald-500" />
              Secure Checkout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-900 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-2xl font-bold text-emerald-500">${amount.toFixed(2)}</span>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <CheckoutForm 
                clientSecret={clientSecret} 
                amount={amount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

