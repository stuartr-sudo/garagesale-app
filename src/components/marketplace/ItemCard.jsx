
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Tag, Star } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import TradeButton from '../trading/TradeButton';
import ExplosionEffect from '../ui/ExplosionEffect';

export default function ItemCard({ item, seller, onPurchase }) {
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
  const [isBuyExploding, setIsBuyExploding] = useState(false);

  const handlePurchaseClick = () => {
    if (isBuyExploding) return;
    setIsBuyExploding(true);
    setTimeout(onPurchase, 400); // Delay action to let fireworks show
    setTimeout(() => setIsBuyExploding(false), 2000); // Longer reset for fireworks
  };

  return (
    <Card className="bg-gray-900 rounded-2xl shadow-lg shadow-fuchsia-950/20 hover:shadow-fuchsia-500/20 transition-all duration-300 border border-gray-800 overflow-hidden group hover:scale-[1.02] flex flex-col h-full">
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
          {item.price === 0 && (
            <Badge className="bg-lime-500 text-black font-bold">Free</Badge>
          )}
          {item.condition && (
            <Badge variant="secondary" className="capitalize bg-gray-900/80 text-gray-300 border-gray-700">
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
          <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
            {item.title}
          </h3>
          {seller && (
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

        {/* Action Buttons */}
        {/* EDIT: prevent button row overflow on narrow cards */}
        <div className="flex gap-2 mt-4 min-w-0">
          {/* Buy button wrapper: allow explode overlay and prevent clipping */}
          <div className="relative flex-1 overflow-visible min-w-0">
            <Button
              onClick={handlePurchaseClick}
              className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ShoppingCart className="w-4 h-4" />
              {item.price === 0 ? "Claim" : "Buy"}
            </Button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <ExplosionEffect isExploding={isBuyExploding} particleCount={80} intensity="epic" />
            </div>
          </div>
          
          {/* Make Offer (Trade) button wrapper: ensure it doesn't push outside card */}
          <div data-tour="trade-button" className="flex-1 min-w-0">
            <TradeButton 
              targetItem={item} 
              targetSeller={seller}
              className="w-full h-11 rounded-xl font-semibold text-sm sm:text-base"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
