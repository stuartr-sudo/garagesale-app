import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

export default function CryptoCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = () => {
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

    // TODO: Get seller's crypto wallet from profiles
    setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'); // Placeholder
  };

  const handleSubmit = async () => {
    if (!txHash) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter your transaction hash",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { items, userId } = checkoutData;
      const itemIds = items.map(item => item.id);

      // Mark items sold
      await supabase
        .from('items')
        .update({
          status: 'sold',
          is_sold: true,
          sold_at: new Date().toISOString(),
          buyer_id: userId
        })
        .in('id', itemIds);

      // Create orders with pending crypto verification
      const orderPromises = items.map(async (item) => {
        await supabase
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
            status: 'payment_pending_seller_confirmation'
          });
      });

      await Promise.all(orderPromises);

      // Clear reservations
      await supabase
        .from('item_reservations')
        .delete()
        .in('item_id', itemIds)
        .eq('reservation_type', 'buy_now');

      sessionStorage.removeItem('checkout_data');
      sessionStorage.removeItem('cart_items');

      toast({
        title: "Payment Submitted",
        description: "Your crypto payment is pending verification",
      });

      if (items.length === 1) {
        navigate(`/ItemDetail/${items[0].id}`, { replace: true });
      } else {
        navigate(createPageUrl('MyOrders'), { replace: true });
      }

    } catch (error) {
      console.error('Error submitting crypto payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Coins className="w-6 h-6 text-orange-500" />
              Cryptocurrency Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Amount to Pay:</p>
              <p className="text-2xl font-bold text-orange-500">
                ${checkoutData?.totalAmount.toFixed(2)} USD
              </p>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Send payment to:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-white text-sm bg-gray-800 p-2 rounded">
                  {walletAddress}
                </code>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                    toast({ title: "Copied to clipboard" });
                  }}
                  size="sm"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-300 text-sm font-medium">Transaction Hash:</label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter your transaction hash"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !txHash}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold"
            >
              {isSubmitting ? 'Submitting...' : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

