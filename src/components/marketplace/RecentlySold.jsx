import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

/**
 * Recently Sold Component
 * Shows items that were recently purchased (social proof)
 * Privacy: Seller names are hidden, replaced with "A Seller from [Location]"
 */

export default function RecentlySold({ limit = 10, showLocation = true }) {
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentSales();
    
    // Refresh every 30 seconds to show new sales
    const interval = setInterval(loadRecentSales, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  const loadRecentSales = async () => {
    try {
      // Get recent orders with status 'completed' or 'payment_confirmed'
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          item:items (
            id,
            title,
            image_urls,
            category,
            price
          ),
          seller:seller_id (
            id
          )
        `)
        .in('status', ['completed', 'payment_confirmed', 'shipped', 'collection_arranged'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get seller locations (postcodes) without revealing identities
      const sales = await Promise.all((orders || []).map(async (order) => {
        // Get seller's postcode/location without name
        const { data: profile } = await supabase
          .from('profiles')
          .select('postcode, country, city')
          .eq('id', order.seller.id)
          .single();

        return {
          ...order,
          sellerLocation: profile?.postcode || profile?.city || profile?.country || 'Unknown',
          // Create anonymized seller label
          sellerLabel: profile?.city 
            ? `${profile.city}, ${profile.country || 'AU'}`
            : profile?.postcode 
              ? `${profile.postcode.slice(0, 3)}**, ${profile.country || 'AU'}`
              : 'Australia'
        };
      }));

      setRecentSales(sales);
    } catch (error) {
      console.error('Error loading recent sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="card-gradient card-glow">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-48 bg-slate-600 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-16 bg-slate-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentSales.length === 0) {
    return null;
  }

  return (
    <Card className="card-gradient card-glow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Recently Sold</h3>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {recentSales.length}
            </Badge>
          </div>
          <TrendingUp className="w-5 h-5 text-green-400 animate-pulse" />
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Real purchases from our community in the last 24 hours
        </p>

        {/* Sales List */}
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {recentSales.map((sale, index) => {
            const item = sale.item;
            const primaryImage = item?.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
            const timeAgo = formatDistanceToNow(new Date(sale.created_at), { addSuffix: true });

            return (
              <div
                key={sale.id}
                className="flex gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/70 transition-all border border-slate-700 hover:border-green-500/30 group"
                style={{
                  animation: index < 3 ? `slideIn 0.5s ease-out ${index * 0.1}s both` : 'none'
                }}
              >
                {/* Item Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={primaryImage}
                    alt={item?.title || 'Item'}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Sale Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-green-400 transition-colors">
                    {item?.title || 'Item'}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </span>
                    {showLocation && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sale.sellerLabel}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">
                        Sold
                      </Badge>
                      {item?.category && (
                        <Badge variant="outline" className="text-xs border-slate-500 text-gray-400">
                          {item.category.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      ${sale.total_amount || item?.price}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-4 border-t border-slate-600">
          <p className="text-xs text-gray-500 text-center">
            🔒 Seller identities are protected for privacy
          </p>
        </div>
      </CardContent>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Card>
  );
}

