import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

export default function BankCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    accountName: 'BlockSwap Platform',
    bsb: '123-456',
    accountNumber: '12345678',
    reference: ''
  });
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

    // Generate unique reference
    const ref = `BLK${Date.now().toString().slice(-8)}`;
    setBankDetails(prev => ({ ...prev, reference: ref }));
  };

  const handleConfirm = async () => {
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

      // Create orders with pending bank transfer verification
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
        title: "Payment Instructions Sent",
        description: "Please complete the bank transfer using the details provided",
      });

      if (items.length === 1) {
        navigate(`/ItemDetail/${items[0].id}`, { replace: true });
      } else {
        navigate(createPageUrl('MyOrders'), { replace: true });
      }

    } catch (error) {
      console.error('Error submitting bank transfer:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
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
              <Building2 className="w-6 h-6 text-green-500" />
              Bank Transfer Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Amount to Transfer:</p>
              <p className="text-2xl font-bold text-green-500">
                ${checkoutData?.totalAmount.toFixed(2)} AUD
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-white font-semibold mb-4">Bank Details:</h3>
              
              {[
                { label: 'Account Name', value: bankDetails.accountName },
                { label: 'BSB', value: bankDetails.bsb },
                { label: 'Account Number', value: bankDetails.accountNumber },
                { label: 'Reference', value: bankDetails.reference, highlight: true }
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <p className="text-gray-400 text-sm mb-1">{label}:</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 text-white p-2 rounded ${highlight ? 'bg-green-900/30 border border-green-500' : 'bg-gray-800'}`}>
                      {value}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(value, label)}
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {highlight && (
                    <p className="text-green-400 text-xs mt-1">
                      ⚠️ Please include this reference in your transfer
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Important:</strong> Your order will be marked as pending until payment is verified. 
                This usually takes 1-2 business days.
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  I've Made the Transfer
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

