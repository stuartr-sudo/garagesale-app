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

const CheckoutForm = ({ clientSecret, amount, onSuccess, onCancel }) => {
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
        // Payment failed - cleanup reservations
        if (onCancel) await onCancel();
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
  const [clientSecret, setClientSecret] = useState(location.state?.clientSecret || null);
  const [amount, setAmount] = useState(location.state?.amount || 0);

  useEffect(() => {
    // Fallback: recover from sessionStorage if navigation state missing
    if (!clientSecret) {
      const stored = sessionStorage.getItem('pendingCartCheckout');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.clientSecret) setClientSecret(parsed.clientSecret);
          if (typeof parsed?.totalAmount === 'number') setAmount(parsed.totalAmount);
        } catch {}
      }
    }

    if (!clientSecret && !sessionStorage.getItem('pendingCartCheckout')) {
      toast({
        title: "Error",
        description: "Invalid checkout session",
        variant: "destructive"
      });
      navigate(createPageUrl('Cart'));
    }
  }, [clientSecret, navigate, toast]);

  const handlePaymentCancel = async () => {
    try {
      // Cleanup buy_now reservations on cancel/error (matches mobile flow)
      const pendingCheckout = sessionStorage.getItem('pendingCartCheckout');
      if (pendingCheckout) {
        const { cartItems } = JSON.parse(pendingCheckout);
        const itemIds = cartItems.map(ci => ci.item_id || ci.item.id);
        
        const { error } = await supabase
          .from('item_reservations')
          .delete()
          .in('item_id', itemIds)
          .eq('reservation_type', 'buy_now');

        if (error) {
          console.error('Error cleaning up reservations:', error);
        } else {
          console.log('✅ Cleaned up buy_now reservations after payment error');
        }
      }
    } catch (error) {
      console.error('Error in handlePaymentCancel:', error);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Get cart data from session storage
      const pendingCheckout = sessionStorage.getItem('pendingCartCheckout');
      if (!pendingCheckout) {
        throw new Error('No pending checkout found');
      }

      const { cartItems } = JSON.parse(pendingCheckout);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // STEP 1: Immediately mark items SOLD (matches mobile app flow)
      const itemIds = cartItems.map(ci => ci.item_id || ci.item.id);
      const { error: soldError } = await supabase
        .from('items')
        .update({
          status: 'sold',
          is_sold: true,
          sold_at: new Date().toISOString(),
          buyer_id: user.id
        })
        .in('id', itemIds);

      if (soldError) {
        console.error('Error marking items sold:', soldError);
        throw soldError;
      }

      // STEP 2: Create orders with payment_confirmed status
      // This triggers the seller balance update automatically via DB trigger
      const orderPromises = cartItems.map(async (cartItem) => {
        const effectivePrice = cartItem.negotiated_price || cartItem.item.price;
        const item = cartItem.item;
        
        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            item_id: item.id,
            buyer_id: user.id,
            seller_id: item.seller_id,
            total_amount: effectivePrice,
            shipping_cost: 0,
            delivery_method: 'collect',
            collection_address: item.collection_address || item.location || null,
            collection_date: item.collection_date || null,
            status: 'payment_confirmed' // Triggers seller balance update via DB trigger
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating order:', error);
          throw error;
        }
        return order;
      });

      await Promise.all(orderPromises);

      // STEP 3: Disable bundles containing these items
      const { error: bundleError } = await supabase
        .from('bundles')
        .update({ status: 'inactive' })
        .contains('item_ids', itemIds);

      if (bundleError) {
        console.warn('Error disabling bundles:', bundleError);
        // Don't fail on bundle error
      }

      // STEP 4: Delete buy_now reservations for these items
      const { error: reservationError } = await supabase
        .from('item_reservations')
        .delete()
        .in('item_id', itemIds)
        .eq('reservation_type', 'buy_now');

      if (reservationError) {
        console.warn('Error clearing reservations:', reservationError);
        // Don't fail on reservation cleanup
      }

      // STEP 5: Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', cartItems.map(ci => ci.id));

      if (clearError) {
        console.warn('Error clearing cart:', clearError);
        // Don't fail on cart clear
      }

      // Clear session storage
      sessionStorage.removeItem('pendingCartCheckout');

      setPaymentComplete(true);

      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed. Seller has been credited.",
      });

      // Redirect to My Orders after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl('MyOrders'));
      }, 2000);

    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: error.message || "Payment succeeded but order creation failed. Please contact support.",
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

            <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
              <CheckoutForm 
                clientSecret={clientSecret} 
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

