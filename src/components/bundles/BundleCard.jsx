import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Percent, 
  DollarSign, 
  Calendar, 
  MapPin,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function BundleCard({ 
  bundle, 
  onBuyNow, 
  onViewDetails 
}) {
  const primaryImage = bundle.bundle_items?.[0]?.items?.image_urls?.[0] || 
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  // Load theme from localStorage (with bundle support)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('marketplace-theme');
    return saved ? JSON.parse(saved) : {
      cardFrom: '#1e3a8a',  // blue-900
      cardTo: '#581c87',    // purple-900
      buttonFrom: '#a855f7', // purple-500
      buttonTo: '#db2777',  // pink-600
      accentColor: '#22d3ee', // cyan-400
      bundleCardFrom: '#059669', // emerald-600
      bundleCardTo: '#047857',   // emerald-700
      bundleButtonFrom: '#10b981', // emerald-500
      bundleButtonTo: '#059669',   // emerald-600
      bundleAccentColor: '#6ee7b7' // emerald-300
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

  return (
    <Card 
      className="rounded-2xl shadow-2xl shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300 border-2 border-green-500/30 hover:border-green-400/60 overflow-hidden group hover:scale-[1.02] flex flex-col h-full ring-1 ring-green-400/20 hover:ring-green-400/40"
      style={{
        background: `linear-gradient(to bottom right, ${theme.bundleCardFrom || theme.cardFrom}, ${theme.bundleCardTo || theme.cardTo})`
      }}
    >
      {/* Image Section - 4:3 aspect ratio like ItemCard */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={primaryImage}
          alt={bundle.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          }}
        />
        
        {/* Bundle Badge - Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-green-500 text-white font-bold shadow-lg flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Bundle
          </Badge>
        </div>
        
        {/* Savings Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-emerald-500 text-white font-bold shadow-lg flex items-center gap-1">
            <Percent className="w-3 h-3" />
            {Math.round((bundle.savings / bundle.individual_total) * 100)}% OFF
          </Badge>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 
            className="font-bold text-lg text-white line-clamp-2 leading-tight transition-colors cursor-pointer"
            style={{ 
              '--hover-color': theme.accentColor 
            }}
            onMouseEnter={(e) => e.target.style.color = theme.bundleAccentColor || theme.accentColor}
            onMouseLeave={(e) => e.target.style.color = 'white'}
          >
            {bundle.title}
          </h3>
          
          {/* Bundle Description */}
          {bundle.description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2 leading-relaxed">
              {bundle.description}
            </p>
          )}
          
          {/* Bundle Info */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              <span>{bundle.bundle_items?.length || 0} items</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{bundle.collection_date ? format(new Date(bundle.collection_date), 'MMM d') : 'TBA'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div 
              className="text-2xl font-bold"
              style={{ color: theme.bundleAccentColor || theme.accentColor }}
            >
              ${parseFloat(bundle.bundle_price).toFixed(2)}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 line-through">
                ${parseFloat(bundle.individual_total).toFixed(2)}
              </div>
              <div className="text-green-400 font-semibold text-sm">
                Save ${parseFloat(bundle.savings).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            onClick={() => onBuyNow(bundle)}
            className="w-full h-10 hover:opacity-90 rounded-xl font-semibold"
            style={{
              background: `linear-gradient(to right, ${theme.bundleButtonFrom || theme.buttonFrom}, ${theme.bundleButtonTo || theme.buttonTo})`
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Bundle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
