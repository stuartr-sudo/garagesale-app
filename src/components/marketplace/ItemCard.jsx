
import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Star, Eye, Gift, TrendingDown, Clock, ShoppingCart, Handshake } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { getItemSpecialOffers, formatOfferText, getOfferBadgeColor } from '@/api/offers';
import { getItemReservation } from '@/api/functions';

const ItemCard = memo(function ItemCard({ item, seller, isSold = false, currentUser = null }) {
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
  
  // Load theme from localStorage (now using hex colors)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('marketplace-theme');
    return saved ? JSON.parse(saved) : {
      cardFrom: '#1e3a8a',  // blue-900
      cardTo: '#581c87',    // purple-900
      buttonFrom: '#a855f7', // purple-500
      buttonTo: '#db2777',  // pink-600
      accentColor: '#22d3ee' // cyan-400
    };
  });

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('marketplace-theme');
      if (saved) {
        setTheme(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load special offers for this item
  const [specialOffers, setSpecialOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  
  // Load reservation status
  const [reservationInfo, setReservationInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  useEffect(() => {
    async function loadOffers() {
      try {
        setOffersLoading(true);
        const offers = await getItemSpecialOffers(item.id);
        console.log('📦 ItemCard received offers:', offers);
        setSpecialOffers(offers || []);
      } catch (error) {
        console.error('❌ Error loading offers in ItemCard:', error);
        setSpecialOffers([]);
      } finally {
        setOffersLoading(false);
      }
    }
    loadOffers();
  }, [item.id]);

  // Load and monitor reservation status
  useEffect(() => {
    let interval;
    
    async function checkReservation() {
      try {
        const reservation = await getItemReservation(item.id);
        if (reservation && reservation.is_reserved && !reservation.reserved_by_current_user) {
          setReservationInfo(reservation);
          
          // Calculate time remaining
          const expiresAt = new Date(reservation.reserved_until);
          const now = new Date();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeRemaining(remaining);
        } else {
          setReservationInfo(null);
          setTimeRemaining(null);
        }
      } catch (error) {
        console.error('Error checking reservation:', error);
      }
    }
    
    checkReservation();
    interval = setInterval(checkReservation, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [item.id]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining === 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setReservationInfo(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link to={`/ItemDetail/${item.id}`} className="block h-full">
      <Card 
        className="rounded-2xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full ring-1 ring-cyan-400/20 hover:ring-cyan-400/40 cursor-pointer"
        style={{
          background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`
        }}
      >
        {/* Standardized square aspect ratio to match Featured Items */}
        <div className="relative overflow-hidden aspect-square">
          <img
            src={primaryImage}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            }}
          />
        {/* Special Offer Badge - Top Left */}
        {!isSold && specialOffers.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            {specialOffers.slice(0, 1).map(offer => (
              <Badge 
                key={offer.id}
                className={`${getOfferBadgeColor(offer.offer_type)} text-white font-bold shadow-lg animate-pulse flex items-center gap-1`}
              >
                <Gift className="w-3 h-3" />
                {formatOfferText(offer)}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Status Badges - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isSold && (
            <Badge className="bg-green-500 text-white font-bold">Sold</Badge>
          )}
          {!isSold && item.price === 0 && (
            <Badge className="bg-lime-500 text-black font-bold">Free</Badge>
          )}
          {item.condition && (
            <Badge variant="secondary" className="capitalize bg-gray-800/80 text-gray-300 border-gray-700">
              {item.condition.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-gray-400 text-xs">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
            {item.title}
          </h3>
          
          {/* Product Description */}
          {item.description && (
            <p 
              className="text-sm mt-2 line-clamp-2 leading-relaxed"
              style={{ color: theme.descriptionColor || '#9ca3af' }}
            >
              {item.description}
            </p>
          )}
          
          {currentUser && seller && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
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
            <div className="flex items-center gap-2">
              <div 
                className="text-2xl font-bold"
                style={{ color: theme.accentColor }}
              >
                {item.price === 0 ? "Free" : `$${item.price}`}
              </div>
              {item.negotiation_enabled && (
                <div className="flex items-center" title="Negotiation available">
                  <Handshake className="w-4 h-4 text-cyan-400" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Tag className="w-3 h-3" />
              <span className="truncate">{item.category?.replace('_', ' ') || 'General'}</span>
            </div>
          </div>
        </div>

        {!isSold ? (
          <div className="mt-4 space-y-2">
            {/* Reservation Indicator */}
            {reservationInfo && timeRemaining > 0 && (
              <div className="w-full p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-orange-300 text-sm font-semibold mb-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>In Someone's Cart</span>
                </div>
                <div className="flex items-center gap-2 text-orange-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Available in {formatTimeRemaining(timeRemaining)}</span>
                </div>
              </div>
            )}
            
            <div className="w-full h-10 px-4 rounded-lg text-center text-white text-sm font-medium flex items-center justify-center"
              style={{
                background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </div>
          </div>
        ) : (
          <div className="w-full mt-4 h-10 px-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center text-gray-400 text-sm font-medium flex items-center justify-center">
            This item has been sold
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
});

export default ItemCard;
