
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Star, Eye, Gift, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { getItemSpecialOffers, formatOfferText, getOfferBadgeColor } from '@/api/offers';

export default function ItemCard({ item, seller, isSold = false, currentUser = null }) {
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
  useEffect(() => {
    async function loadOffers() {
      const offers = await getItemSpecialOffers(item.id);
      setSpecialOffers(offers);
    }
    loadOffers();
  }, [item.id]);

  return (
    <Card 
      className="rounded-2xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full ring-1 ring-cyan-400/20 hover:ring-cyan-400/40"
      style={{
        background: `linear-gradient(to bottom right, ${theme.cardFrom}, ${theme.cardTo})`
      }}
    >
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
            <div 
              className="text-2xl font-bold"
              style={{ color: theme.accentColor }}
            >
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
            <Link to={`/ItemDetail/${item.id}`}>
              <Button
                className="w-full h-10 hover:opacity-90"
                style={{
                  background: `linear-gradient(to right, ${theme.buttonFrom}, ${theme.buttonTo})`
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Link>
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
