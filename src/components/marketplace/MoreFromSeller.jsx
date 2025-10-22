import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Gift } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getItemSpecialOffers, formatOfferText, getOfferBadgeColor } from '@/api/offers';

export default function MoreFromSeller({ sellerId, currentItemId }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedItems, setAddedItems] = useState(new Set());
  const [itemOffers, setItemOffers] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSellerItems();
  }, [sellerId, currentItemId]);

  const loadSellerItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .neq('id', currentItemId)
        .limit(6);

      if (!error && data) {
        setItems(data);
        
        // Load special offers for each item
        const offersData = {};
        for (const item of data) {
          try {
            const offers = await getItemSpecialOffers(item.id);
            if (offers && offers.length > 0) {
              offersData[item.id] = offers;
            }
          } catch (error) {
            console.error(`Error loading offers for item ${item.id}:`, error);
          }
        }
        setItemOffers(offersData);
      }
    } catch (error) {
      console.error('Error loading seller items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    
    try {
      const user = await UserEntity.me();
      
      // Check if already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('buyer_id', user.id)
        .eq('item_id', item.id)
        .single();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('cart_items')
          .insert({
            buyer_id: user.id,
            item_id: item.id,
            quantity: 1
          });

        if (error) throw error;
      }

      setAddedItems(prev => new Set([...prev, item.id]));
      toast({
        title: "Added to Cart!",
        description: `${item.title} has been added to your cart`
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 p-8 bg-slate-900/50 rounded-2xl border-2 border-cyan-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">More from this Seller</h2>
        <div className="text-center py-8">
          <div className="text-gray-400">Loading more items...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 p-8 bg-slate-900/50 rounded-2xl border-2 border-cyan-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">More from this Seller</h2>
        <div className="text-center py-8">
          <div className="text-gray-400">This seller doesn't have any other items listed at the moment.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-slate-900/50 rounded-2xl border-2 border-cyan-500/20">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span>More from this Seller</span>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Badge>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => {
          const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          const isAdded = addedItems.has(item.id);
          const offers = itemOffers[item.id] || [];

          return (
            <Card 
              key={item.id}
              className="card-gradient card-glow rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
              onClick={() => navigate(createPageUrl(`ItemDetail/${item.id}`))}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={primaryImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                  }}
                />
                {item.price === 0 && (
                  <Badge className="absolute top-2 right-2 bg-lime-500 text-black font-bold">
                    Free
                  </Badge>
                )}
                {/* Special Offer Badge */}
                {offers.length > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge 
                      className={`${getOfferBadgeColor(offers[0].offer_type)} text-white font-bold shadow-lg animate-pulse flex items-center gap-1`}
                    >
                      <Gift className="w-3 h-3" />
                      {formatOfferText(offers[0])}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold text-white text-sm line-clamp-2 leading-tight">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-cyan-400">
                    ${item.price}
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(e, item)}
                    disabled={isAdded}
                    className={`h-8 px-2 ${
                      isAdded
                        ? 'bg-green-600 hover:bg-green-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                    }`}
                  >
                    {isAdded ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

