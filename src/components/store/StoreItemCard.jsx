import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, Lock, Clock } from "lucide-react";
import { reserveItem, getItemReservation } from '@/api/functions';
import { useToast } from '@/hooks/use-toast';

export default function StoreItemCard({ item, onPurchase, isRedirecting }) {
  const [isReserved, setIsReserved] = useState(false);
  const [isReservedByCurrentUser, setIsReservedByCurrentUser] = useState(false);
  const [reservationTimeRemaining, setReservationTimeRemaining] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const { toast } = useToast();
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1571380242429-92323c910359?w=500&h=500&fit=crop";

  // Check reservation status on component mount
  useEffect(() => {
    const checkReservation = async () => {
      try {
        const reservation = await getItemReservation(item.id);
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
          return null;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [reservationTimeRemaining]);

  const handleBuyNow = async () => {
    if (isReserved && !isReservedByCurrentUser) {
      toast({
        title: "Item Reserved",
        description: "This item is currently reserved by another user. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsReserving(true);
    try {
      // Try to reserve the item first
      const reserved = await reserveItem(item.id, 'buy_now', 10); // 10 minutes for buy now
      
      if (!reserved) {
        toast({
          title: "Item Not Available",
          description: "This item is currently being processed by another user. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Update reservation state
      setIsReserved(true);
      setIsReservedByCurrentUser(true);
      setReservationTimeRemaining(10 * 60 * 1000); // 10 minutes in milliseconds

      toast({
        title: "Item Reserved",
        description: "Item reserved for 10 minutes. Proceeding to checkout..."
      });

      // Proceed with purchase
      onPurchase(item.stripe_price_id);
    } catch (error) {
      console.error('Error reserving item:', error);
      toast({
        title: "Error",
        description: "Failed to reserve item for purchase",
        variant: "destructive"
      });
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl shadow-2xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all duration-300 border-2 border-pink-500/30 hover:border-pink-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full ring-1 ring-pink-400/20 hover:ring-pink-400/40">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={primaryImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1571380242429-92323c910359?w=500&h=500&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Reservation Badges */}
        {isReserved && !isReservedByCurrentUser && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-orange-500 text-white font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Reserved
            </Badge>
          </div>
        )}
        {isReserved && isReservedByCurrentUser && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-blue-500 text-white font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Your Reservation
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight mb-2">
            {item.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="text-2xl font-bold text-lime-400">
            ${item.price.toFixed(2)}
          </div>
          {isReserved && !isReservedByCurrentUser ? (
            <div className="h-11 px-3 bg-orange-800/50 rounded-xl border border-orange-700 text-orange-300 text-xs font-semibold flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span className="truncate">Reserved</span>
            </div>
          ) : (
            <Button
              onClick={handleBuyNow}
              disabled={isRedirecting || isReserving || (isReserved && !isReservedByCurrentUser)}
              className="h-11 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs px-3"
            >
              {(isRedirecting || isReserving) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="truncate">
                {isReserving ? 'Reserving...' : 'Buy Now'}
                {isReserved && isReservedByCurrentUser && reservationTimeRemaining && (
                  <span className="ml-1">
                    ({Math.ceil(reservationTimeRemaining / 60000)}m)
                  </span>
                )}
              </span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}