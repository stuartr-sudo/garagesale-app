
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Star, ShoppingCart, Check, Clock, Lock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';
import { reserveItem, checkItemAvailability, getItemReservation, releaseItemReservation } from '@/api/functions';

export default function ItemCard({ item, seller, isSold = false, currentUser = null }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [reservationInfo, setReservationInfo] = useState(null);
  const [isReserved, setIsReserved] = useState(false);
  const [isReservedByCurrentUser, setIsReservedByCurrentUser] = useState(false);
  const [reservationTimeRemaining, setReservationTimeRemaining] = useState(null);
  const { toast } = useToast();
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  // Check reservation status on component mount
  useEffect(() => {
    const checkReservation = async () => {
      try {
        const reservation = await getItemReservation(item.id);
        setReservationInfo(reservation);
        setIsReserved(reservation.is_reserved);
        setIsReservedByCurrentUser(reservation.reserved_by_current_user || false);
        
        if (reservation.is_reserved && reservation.reserved_until) {
          const expirationTime = new Date(reservation.reserved_until);
          const now = new Date();
          const timeRemaining = Math.max(0, expirationTime - now);
          setReservationTimeRemaining(timeRemaining);
        }
      } catch (error) {
        console.error('Error checking reservation:', error);
      }
    };
    
    checkReservation();
  }, [item.id]);

  // Update reservation timer
  useEffect(() => {
    if (!reservationTimeRemaining) return;
    
    const timer = setInterval(() => {
      setReservationTimeRemaining(prev => {
        if (prev <= 1000) {
          setIsReserved(false);
          setIsReservedByCurrentUser(false);
          setReservationInfo(null);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [reservationTimeRemaining]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return;
    }
    
    // Check if item is reserved by someone else
    if (isReserved && !isReservedByCurrentUser) {
      toast({
        title: "Item Reserved",
        description: "This item is currently reserved by another user. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Try to reserve the item first
      const reserved = await reserveItem(item.id, 'cart', 5);
      
      if (!reserved) {
        toast({
          title: "Item Not Available",
          description: "This item is currently being processed by another user. Please try again.",
          variant: "destructive"
        });
        return;
      }

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

      // Update reservation state
      setIsReserved(true);
      setIsReservedByCurrentUser(true);
      setReservationTimeRemaining(5 * 60 * 1000); // 5 minutes in milliseconds

      setIsInCart(true);
      toast({
        title: "Added to Cart!",
        description: `${item.title} has been added to your cart and reserved for 5 minutes`
      });

      setTimeout(() => setIsInCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full ring-1 ring-cyan-400/20 hover:ring-cyan-400/40">
      {/* EDIT: Use 4:3 aspect ratio to avoid squashed image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={primaryImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          }}
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isSold && (
            <Badge className="bg-green-500 text-white font-bold">Sold</Badge>
          )}
          {!isSold && isReserved && !isReservedByCurrentUser && (
            <Badge className="bg-orange-500 text-white font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Reserved
            </Badge>
          )}
          {!isSold && isReserved && isReservedByCurrentUser && (
            <Badge className="bg-blue-500 text-white font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Your Reservation
            </Badge>
          )}
          {!isSold && !isReserved && item.price === 0 && (
            <Badge className="bg-lime-500 text-black font-bold">Free</Badge>
          )}
          {item.condition && (
            <Badge variant="secondary" className="capitalize bg-gray-800/80 text-gray-300 border-gray-700">
              {item.condition.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-gray-400 text-xs">
          {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link to={`/ItemDetail/${item.id}`}>
            <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight hover:text-pink-400 transition-colors cursor-pointer">
              {item.title}
            </h3>
          </Link>
          {currentUser && seller && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <span>by {seller.full_name}</span>
              {seller.rating_count > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>{seller.average_rating?.toFixed(1)} ({seller.rating_count})</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold text-cyan-400">
              {item.price === 0 ? "Free" : `$${item.price}`}
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Tag className="w-3 h-3" />
              <span className="truncate">{item.category?.replace('_', ' ') || 'General'}</span>
            </div>
          </div>
        </div>

        {!isSold ? (
          <div className="mt-4">
            {isReserved && !isReservedByCurrentUser ? (
              <div className="w-full h-10 px-4 bg-orange-800/50 rounded-lg border border-orange-700 text-center text-orange-300 text-sm font-medium flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Reserved by another user
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isInCart || (isReserved && !isReservedByCurrentUser)}
                className={`w-full h-10 ${
                  isInCart
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Added to Cart
                    {isReserved && isReservedByCurrentUser && reservationTimeRemaining && (
                      <span className="ml-2 text-xs">
                        ({Math.ceil(reservationTimeRemaining / 60000)}m left)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full mt-4 h-10 px-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center text-gray-400 text-sm font-medium flex items-center justify-center">
            This item has been sold
          </div>
        )}
      </CardContent>
    </Card>
  );
}
