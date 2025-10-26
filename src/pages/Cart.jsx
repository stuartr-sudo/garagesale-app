import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CreditCard, Coins, Building2, ArrowLeft, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { User as UserEntity } from '@/api/entities';

export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, [location.state]);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);

      // Get items from location.state (passed from Buy Now / Accept Offer)
      const itemsFromState = location.state?.items || [];
      
      if (itemsFromState.length === 0) {
        // No items passed, check if there are existing cart items from session
        const storedCart = sessionStorage.getItem('cart_items');
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          setCartItems(parsed);
        }
      } else {
        // New items passed from Buy Now / Accept Offer
        setCartItems(itemsFromState);
        // Store in session for persistence
        sessionStorage.setItem('cart_items', JSON.stringify(itemsFromState));
      }

    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    sessionStorage.setItem('cart_items', JSON.stringify(updatedItems));

    // Release reservation
    releaseReservation(itemId);

    toast({
      title: "Item Removed",
      description: "Item removed from cart"
    });
  };

  const releaseReservation = async (itemId) => {
    try {
      await supabase
        .from('item_reservations')
        .delete()
        .eq('item_id', itemId)
        .eq('reservation_type', 'buy_now');
    } catch (error) {
      console.error('Error releasing reservation:', error);
    }
  };

  const clearCart = async () => {
    // Release all reservations
    for (const item of cartItems) {
      await releaseReservation(item.id);
    }
    
    setCartItems([]);
    sessionStorage.removeItem('cart_items');
    
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart"
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const handlePaymentMethodSelect = async (method) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart",
        variant: "destructive"
      });
      return;
    }

    // Store cart and payment method for checkout page
    sessionStorage.setItem('checkout_data', JSON.stringify({
      items: cartItems,
      totalAmount: calculateTotal(),
      paymentMethod: method,
      userId: currentUser.id
    }));

    // Navigate to appropriate checkout page
    switch (method) {
      case 'stripe':
        navigate('/stripe-checkout');
        break;
      case 'crypto':
        navigate('/crypto-checkout');
        break;
      case 'bank':
        navigate('/bank-checkout');
        break;
      default:
        toast({
          title: "Error",
          description: "Invalid payment method",
          variant: "destructive"
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="text-white text-lg">Loading cart...</div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-6 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-cyan-500" />
                Shopping Cart
              </div>
              {cartItems.length > 0 && (
                <Button
                  onClick={clearCart}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
                <Button
                  onClick={() => navigate(createPageUrl('Marketplace'))}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Browse Marketplace
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-700 rounded-lg"
                    >
                      {item.image_urls && item.image_urls[0] && (
                        <img
                          src={item.image_urls[0]}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.category}</p>
                        <p className="text-cyan-400 font-bold mt-1">
                          ${item.price?.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        onClick={() => removeItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-red-600 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-cyan-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold mb-4">Select Payment Method:</h3>
                  
                  <Button
                    onClick={() => handlePaymentMethodSelect('stripe')}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg"
                  >
                    <CreditCard className="w-6 h-6 mr-3" />
                    Pay with Credit Card (Stripe)
                  </Button>

                  <Button
                    onClick={() => handlePaymentMethodSelect('crypto')}
                    className="w-full h-16 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold text-lg"
                  >
                    <Coins className="w-6 h-6 mr-3" />
                    Pay with Cryptocurrency
                  </Button>

                  <Button
                    onClick={() => handlePaymentMethodSelect('bank')}
                    className="w-full h-16 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold text-lg"
                  >
                    <Building2 className="w-6 h-6 mr-3" />
                    Pay with Bank Transfer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

