import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  Sparkles,
  ArrowRight,
  Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);

      // Load cart items with item details
      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          added_at,
          item:items(
            id,
            title,
            description,
            price,
            image_urls,
            condition,
            category,
            seller_id
          )
        `)
        .eq('buyer_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      setCartItems(items || []);
      
      // Check for applicable offers
      await checkApplicableOffers(items || [], user.id);
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

  const checkApplicableOffers = async (items, userId) => {
    if (!items.length) return;

    // Get all item IDs
    const itemIds = items.map(ci => ci.item.id);

    // Find applicable special offers
    const { data: offers, error } = await supabase
      .from('special_offers')
      .select('*')
      .is_active(true)
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .overlaps('item_ids', itemIds);

    if (!error && offers) {
      setAppliedOffers(offers);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(prev => prev.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      
      toast({
        title: "Item Removed",
        description: "Item removed from cart"
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const calculatePricing = () => {
    let subtotal = 0;
    let discountAmount = 0;
    const discountedItems = new Set();

    // Calculate subtotal
    cartItems.forEach(ci => {
      subtotal += parseFloat(ci.item.price) * ci.quantity;
    });

    // Apply special offers
    appliedOffers.forEach(offer => {
      const applicableItems = cartItems.filter(ci => 
        offer.item_ids.includes(ci.item.id)
      );

      if (offer.offer_type === 'bogo') {
        // Buy One Get One Free - lowest priced item free for each pair
        applicableItems.forEach(ci => {
          const pairs = Math.floor(ci.quantity / 2);
          discountAmount += parseFloat(ci.item.price) * pairs;
          discountedItems.add(ci.item.id);
        });
      } else if (offer.offer_type === 'percentage_off') {
        // Percentage discount
        const percentage = offer.config?.percentage || 0;
        applicableItems.forEach(ci => {
          const itemTotal = parseFloat(ci.item.price) * ci.quantity;
          discountAmount += itemTotal * (percentage / 100);
          discountedItems.add(ci.item.id);
        });
      } else if (offer.offer_type === 'bulk_discount') {
        // Bulk discount - requires minimum quantity
        const minQty = offer.config?.min_quantity || 1;
        const discount = offer.config?.discount_amount || 0;
        applicableItems.forEach(ci => {
          if (ci.quantity >= minQty) {
            discountAmount += discount;
            discountedItems.add(ci.item.id);
          }
        });
      }
    });

    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      total: (subtotal - discountAmount).toFixed(2),
      discountedItems
    };
  };

  const handleCheckout = () => {
    // For now, navigate to a checkout page (to be implemented)
    toast({
      title: "Coming Soon",
      description: "Cart checkout integration coming soon!"
    });
  };

  const pricing = calculatePricing();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-cyan-400" />
            Shopping Cart
          </h1>
          <p className="text-gray-400">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="card-gradient card-glow p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-400 mb-6">Add items to your cart to get started</p>
            <Button
              onClick={() => navigate(createPageUrl('Marketplace'))}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              Browse Marketplace
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((cartItem) => {
                const item = cartItem.item;
                const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                const isDiscounted = pricing.discountedItems.has(item.id);

                return (
                  <Card key={cartItem.id} className="card-gradient card-glow rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <img
                          src={primaryImage}
                          alt={item.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg text-white">{item.title}</h3>
                              <p className="text-sm text-gray-400 line-clamp-1">{item.description}</p>
                              <Badge className="mt-2 bg-cyan-900/50 text-cyan-300 border-cyan-700">
                                {item.condition?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(cartItem.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                disabled={cartItem.quantity <= 1}
                                className="h-8 w-8 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-white font-semibold w-8 text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                className="h-8 w-8 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-cyan-400">
                                ${(parseFloat(item.price) * cartItem.quantity).toFixed(2)}
                              </div>
                              {isDiscounted && (
                                <div className="flex items-center gap-1 text-green-400 text-sm">
                                  <Tag className="w-3 h-3" />
                                  <span>Offer applied</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="card-gradient card-glow rounded-xl sticky top-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>

                  {/* Applied Offers */}
                  {appliedOffers.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {appliedOffers.map(offer => (
                        <div key={offer.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />
                            {offer.title}
                          </div>
                          <p className="text-xs text-green-300 mt-1">{offer.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator className="my-4 bg-gray-700" />

                  {/* Pricing */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal:</span>
                      <span>${pricing.subtotal}</span>
                    </div>

                    {parseFloat(pricing.discount) > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          Discounts:
                        </span>
                        <span>-${pricing.discount}</span>
                      </div>
                    )}

                    <Separator className="my-2 bg-gray-700" />

                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-cyan-400">${pricing.total}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mt-6 h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl font-semibold text-lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    Shipping calculated at checkout
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

