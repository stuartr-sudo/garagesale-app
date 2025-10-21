import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

export default function StoreItemCard({ item, onPurchase, isRedirecting }) {
  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1571380242429-92323c910359?w=500&h=500&fit=crop";

  return (
    <Card className="bg-gray-900 rounded-2xl shadow-lg shadow-pink-950/20 hover:shadow-pink-500/20 transition-all duration-300 border border-gray-800 overflow-hidden group hover:scale-[1.02] flex flex-col h-full">
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
          <Button
            onClick={() => onPurchase(item.stripe_price_id)}
            disabled={isRedirecting}
            className="h-11 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-pink-500/20 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs px-3"
          >
            {isRedirecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="truncate">Buy Now</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}