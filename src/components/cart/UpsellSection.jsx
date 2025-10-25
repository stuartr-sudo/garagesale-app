import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { addToCart } from '@/utils/cart';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * UpsellSection Component
 * Shows AI-powered cross-sell/upsell items from sellers who opted into the program
 * Only shows items from sellers with enable_ai_upsell = true
 * Applies discount based on seller's upsell_commission_rate
 */
export default function UpsellSection({ cartItems, currentUserId }) {
  const [upsellItems, setUpsellItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchUpsellItems();
    } else {
      setLoading(false);
    }
  }, [cartItems]);

  const fetchUpsellItems = async () => {
    try {
      setLoading(true);

      // Get seller IDs from current cart items
      const sellerIds = [...new Set(cartItems.map(item => item.seller_id))];
      
      console.log('🛒 Cart seller IDs:', sellerIds);
      
      if (sellerIds.length === 0) {
        console.log('❌ No sellers in cart');
        setUpsellItems([]);
        return;
      }

      // Get item IDs already in cart (to exclude them from upsells)
      const cartItemIds = cartItems.map(item => item.id);
      console.log('🛒 Items already in cart:', cartItemIds);

      // Fetch sellers who have AI upsell enabled
      const { data: enabledSellers, error: sellersError } = await supabase
        .from('profiles')
        .select('id, upsell_commission_rate, full_name')
        .in('id', sellerIds)
        .eq('enable_ai_upsell', true);

      if (sellersError) throw sellersError;

      console.log('✅ Sellers with AI upsell enabled:', enabledSellers);

      if (!enabledSellers || enabledSellers.length === 0) {
        console.log('❌ No sellers have AI upsell enabled');
        setUpsellItems([]);
        return;
      }

      const enabledSellerIds = enabledSellers.map(s => s.id);

      // Fetch active items from these sellers (excluding items already in cart)
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('seller_id', enabledSellerIds)
        .eq('status', 'active')
        .not('id', 'in', `(${cartItemIds.join(',')})`)
        .limit(6);

      if (itemsError) throw itemsError;

      console.log(`📦 Found ${items?.length || 0} potential upsell items`);

      // Enrich items with seller info and calculate discounted price
      const enrichedItems = (items || []).map(item => {
        const seller = enabledSellers.find(s => s.id === item.seller_id);
        const commissionRate = seller?.upsell_commission_rate || 15;
        const discountedPrice = item.price * (1 - commissionRate / 100);
        
        return {
          ...item,
          seller_name: seller?.full_name || 'Seller',
          commission_rate: commissionRate,
          original_price: item.price,
          discounted_price: discountedPrice,
          savings: item.price - discountedPrice
        };
      });

      console.log(`✨ ${enrichedItems.length} upsell items ready to display`);
      setUpsellItems(enrichedItems);

    } catch (error) {
      console.error('Error fetching upsell items:', error);
      setUpsellItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    setAddingToCart(prev => ({ ...prev, [item.id]: true }));

    try {
      await addToCart(item.id, currentUserId, 1);
      
      toast({
        title: "Added to cart! 🎉",
        description: `${item.title} added with ${item.commission_rate}% AI discount!`,
      });

      // Remove item from upsell list
      setUpsellItems(prev => prev.filter(i => i.id !== item.id));

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(prev => ({ ...prev, [item.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        <p className="text-gray-400 text-sm mt-2">Finding great deals for you...</p>
      </div>
    );
  }

  if (upsellItems.length === 0) {
    return null; // Don't show anything if no upsell items
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Complete Your Purchase
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            AI-selected deals from sellers in your cart
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          AI Powered
        </Badge>
      </div>

      {/* Upsell Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upsellItems.map((item) => (
          <Card 
            key={item.id} 
            className="bg-gray-800 border-gray-700 hover:border-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20"
          >
            <CardContent className="p-4">
              {/* Image */}
              <div 
                className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => navigate(createPageUrl(`ItemDetail/${item.id}`))}
              >
                <img
                  src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {/* Discount Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500 text-white font-bold">
                    -{item.commission_rate}%
                  </Badge>
                </div>
              </div>

              {/* Title */}
              <h3 
                className="font-semibold text-white text-sm line-clamp-2 cursor-pointer hover:text-pink-400 transition-colors"
                onClick={() => navigate(createPageUrl(`ItemDetail/${item.id}`))}
              >
                {item.title || 'Untitled Item'}
              </h3>

              {/* Seller */}
              <p className="text-xs text-gray-400 mt-1">
                from {item.seller_name}
              </p>

              {/* Pricing */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 line-through">
                    ${item.original_price.toFixed(2)}
                  </span>
                  <span className="text-xs text-green-400 font-semibold">
                    Save ${item.savings.toFixed(2)}
                  </span>
                </div>
                <div className="text-2xl font-bold text-pink-400">
                  ${item.discounted_price.toFixed(2)}
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAddToCart(item)}
                disabled={addingToCart[item.id]}
                className="w-full mt-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
              >
                {addingToCart[item.id] ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <strong>Why these discounts?</strong> These sellers opted into our AI upselling program. 
          They share a commission with us when you add their items, which becomes your discount. 
          Everyone wins! 🎉
        </div>
      </div>
    </div>
  );
}

