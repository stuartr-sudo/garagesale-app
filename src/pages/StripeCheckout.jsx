import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, ArrowLeft, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    loadCheckoutData();
    
    // Cleanup reservations if user navigates away
    return () => {
      const stored = sessionStorage.getItem('checkout_data');
      if (stored) {
        const data = JSON.parse(stored);
        // Release reservations on unmount (checkout abandoned)
        releaseReservations(data.items);
      }
    };
  }, []);

  const loadCheckoutData = async () => {
    setIsLoading(true);
    try {
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

      // Create Stripe Payment Intent
      const amountInCents = Math.round(data.totalAmount * 100);
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          currency: 'aud',
          itemId: data.items[0].id // For single item, multi-item will be handled differently
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);

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

  const releaseReservations = async (items) => {
    try {
      const itemIds = items.map(item => item.id);
      await supabase
        .from('item_reservations')
        .delete()
        .in('item_id', itemIds)
        .eq('reservation_type', 'buy_now');
      console.log('✅ Released reservations for items:', itemIds);
    } catch (error) {
      console.error('Error releasing reservations:', error);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      const { items, userId } = checkoutData;

      // STEP 1: Immediately mark items SOLD
      const itemIds = items.map(item => item.id);
      const { error: soldError } = await supabase
        .from('items')
        .update({
          status: 'sold',
          is_sold: true,
          sold_at: new Date().toISOString(),
          buyer_id: userId
        })
        .in('id', itemIds);

      if (soldError) throw soldError;

      // STEP 2: Create orders (triggers seller balance update)
      const orderPromises = items.map(async (item) => {
        const { error } = await supabase
          .from('orders')
          .insert({
            item_id: item.id,
            buyer_id: userId,
            seller_id: item.seller_id,
            total_amount: item.price,
            shipping_cost: 0,
            delivery_method: 'collect',
            collection_address: item.collection_address || null,
            collection_date: item.collection_date || null,
            status: 'payment_confirmed'
          });

        if (error) throw error;
      });

      await Promise.all(orderPromises);

      // STEP 3: Disable bundles
      await supabase
        .from('bundles')
        .update({ status: 'inactive' })
        .contains('item_ids', itemIds);

      // STEP 4: Delete reservations
      await supabase
        .from('item_reservations')
        .delete()
        .in('item_id', itemIds)
        .eq('reservation_type', 'buy_now');

      // Clear session storage
      sessionStorage.removeItem('checkout_data');
      sessionStorage.removeItem('cart_items');

      toast({
        title: "Payment Successful! 🎉",
        description: "Your purchase is complete. Seller has been credited.",
      });

      // Navigate back to item detail page to show "Sold" button
      if (items.length === 1) {
        navigate(`/ItemDetail/${items[0].id}`, { replace: true });
      } else {
        navigate(createPageUrl('MyOrders'), { replace: true });
      }

    } catch (error) {
      console.error('Error completing purchase:', error);
      toast({
        title: "Error",
        description: "Payment succeeded but order creation failed. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async () => {
    if (checkoutData) {
      await releaseReservations(checkoutData.items);
    }
  };

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="ml-3 text-white text-lg">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => {
            handleCancel();
            navigate(createPageUrl('Cart'));
          }}
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
                <span className="text-2xl font-bold text-emerald-500">
                  ${checkoutData?.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <CheckoutForm 
                clientSecret={clientSecret} 
                amount={checkoutData?.totalAmount || 0}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

