import React, { useState } from 'react';
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
  const [showItems, setShowItems] = useState(false);
  
  const primaryImage = bundle.bundle_items?.[0]?.items?.image_urls?.[0] || 
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  const formatCollectionDate = (dateString) => {
    if (!dateString) return 'To be arranged';
    return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a');
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-200 group">
      <CardContent className="p-0">
        {/* Bundle Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={primaryImage}
                alt={bundle.title}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                }}
              />
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">
                Bundle
              </Badge>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                    {bundle.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                    {bundle.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      {bundle.bundle_items?.length || 0} items
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatCollectionDate(bundle.collection_date)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white mb-1">
                    ${parseFloat(bundle.bundle_price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 line-through">
                    ${parseFloat(bundle.individual_total).toFixed(2)}
                  </div>
                  <div className="text-green-400 font-semibold text-sm">
                    Save ${parseFloat(bundle.savings).toFixed(2)} ({bundle.savings_percentage}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bundle Items Preview */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Items in this bundle:</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowItems(!showItems)}
              className="text-gray-400 hover:text-white p-1 h-auto"
            >
              {showItems ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {showItems && (
            <div className="space-y-2">
              {bundle.bundle_items?.map((bundleItem, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                  <img
                    src={bundleItem.items?.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"}
                    alt={bundleItem.items?.title}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{bundleItem.items?.title}</p>
                    <p className="text-gray-400 text-xs">{bundleItem.items?.condition?.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold">
                      ${parseFloat(bundleItem.items?.price || 0).toFixed(2)}
                    </p>
                    {bundleItem.quantity > 1 && (
                      <p className="text-gray-400 text-xs">x{bundleItem.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onViewDetails(bundle)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            
            <Button
              onClick={() => onBuyNow(bundle)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Bundle
            </Button>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-green-500 text-white text-xs px-2 py-1">
            <Percent className="w-3 h-3 mr-1" />
            {bundle.savings_percentage}% OFF
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
