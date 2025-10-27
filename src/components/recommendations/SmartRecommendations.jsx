import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Eye, Heart, ShoppingCart, ArrowRight, Handshake } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Smart Recommendations Component
 * 
 * Algorithms:
 * 1. Similar Items (same category + price range)
 * 2. Trending Items (most viewed recently)
 * 3. Based on Viewing History (category matching)
 * 4. Price-Based Recommendations (similar price point)
 * 5. Seller's Other Items
 */

export default function SmartRecommendations({ 
  currentItemId, 
  currentItem,
  algorithm = 'similar', // 'similar', 'trending', 'history', 'price', 'seller', 'sold'
  limit = 6,
  title,
  showViewAll = false
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, [currentItemId, algorithm]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      let items = [];

      switch (algorithm) {
        case 'similar':
          items = await getSimilarItems();
          break;
        case 'trending':
          items = await getTrendingItems();
          break;
        case 'history':
          items = await getHistoryBasedItems();
          break;
        case 'price':
          items = await getPriceBasedItems();
          break;
        case 'seller':
          items = await getSellerItems();
          break;
        case 'sold':
          items = await getRecentlySoldItems();
          break;
        default:
          items = await getSimilarItems();
      }

      // Load negotiation data for each item
      const itemsWithNegotiation = await Promise.all(
        items.map(async (item) => {
          try {
            const { data: knowledge } = await supabase
              .from('item_knowledge')
              .select('negotiation_enabled, minimum_price')
              .eq('item_id', item.id)
              .single();
            
            return {
              ...item,
              negotiation_enabled: knowledge?.negotiation_enabled || false,
              minimum_price: knowledge?.minimum_price || null
            };
          } catch (error) {
            // For demo items, add some negotiation data to show the icons
            if (item.id && item.id.startsWith('demo_item_')) {
              const negotiableItems = ['demo_item_1', 'demo_item_2', 'demo_item_5', 'demo_item_7'];
              return {
                ...item,
                negotiation_enabled: negotiableItems.includes(item.id),
                minimum_price: negotiableItems.includes(item.id) ? item.price * 0.8 : null
              };
            }
            
            return {
              ...item,
              negotiation_enabled: false,
              minimum_price: null
            };
          }
        })
      );

      setRecommendations(itemsWithNegotiation.slice(0, limit));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSimilarItems = async () => {
    if (!currentItem) return [];

    // Find items in same category with similar price
    const priceMin = parseFloat(currentItem.price) * 0.5;
    const priceMax = parseFloat(currentItem.price) * 1.5;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .eq('category', currentItem.category)
      .neq('id', currentItemId)
      .gte('price', priceMin)
      .lte('price', priceMax)
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const getTrendingItems = async () => {
    // Get most viewed items in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('views_count', { ascending: false })
      .limit(limit);

    // Only add neq filter if currentItemId exists
    if (currentItemId) {
      query = query.neq('id', currentItemId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  };

  const getHistoryBasedItems = async () => {
    if (!currentItem) {
      return await getTrendingItems();
    }

    // Get items from same category
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .eq('category', currentItem.category)
      .neq('id', currentItemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const getPriceBasedItems = async () => {
    if (!currentItem) return [];

    // Find items within ±30% of current price
    const priceMin = parseFloat(currentItem.price) * 0.7;
    const priceMax = parseFloat(currentItem.price) * 1.3;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .neq('id', currentItemId)
      .gte('price', priceMin)
      .lte('price', priceMax)
      .order('views_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const getSellerItems = async () => {
    if (!currentItem?.seller_id) return [];

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'active')
      .eq('seller_id', currentItem.seller_id)
      .neq('id', currentItemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  };

  const getRecentlySoldItems = async () => {
    // Get recently sold items from completed orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        item:items (
          id,
          title,
          image_urls,
          category,
          price,
          description,
          condition,
          location
        )
      `)
      .in('status', ['completed', 'payment_confirmed', 'shipped', 'collection_arranged'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sold items:', error);
      return [];
    }

    // Extract and return just the items (not the full order objects)
    return (orders || [])
      .map(order => order.item)
      .filter(item => item && item.id); // Filter out null items
  };

  const getAlgorithmIcon = () => {
    switch (algorithm) {
      case 'trending': return TrendingUp;
      case 'history': return Eye;
      case 'price': return ShoppingCart;
      case 'seller': return Heart;
      case 'sold': return ShoppingCart;
      default: return Sparkles;
    }
  };

  const getAlgorithmTitle = () => {
    if (title) return title;
    
    switch (algorithm) {
      case 'trending': return 'Trending Now';
      case 'history': return 'You Might Also Like';
      case 'price': return 'Similar Price Range';
      case 'seller': return 'More from this Seller';
      case 'sold': return 'Recently Sold';
      default: return 'Similar Items';
    }
  };

  const getAlgorithmDescription = () => {
    switch (algorithm) {
      case 'trending': return 'Most popular items this week';
      case 'history': return 'Based on what you\'ve been viewing';
      case 'price': return 'Items in your price range';
      case 'seller': return 'Other items from this seller';
      case 'sold': return 'Real purchases from our community';
      default: return 'Items you might be interested in';
    }
  };

  if (isLoading) {
    return (
      <div className="my-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-48 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-800"></div>
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-800 rounded"></div>
                <div className="h-2 bg-gray-800 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const Icon = getAlgorithmIcon();

  return (
    <div className="mt-8 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-cyan-400" />
            {getAlgorithmTitle()}
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 ml-2">
              {recommendations.length}
            </Badge>
          </h2>
          <p className="text-gray-400 text-sm mt-1">{getAlgorithmDescription()}</p>
        </div>
        
        {showViewAll && (
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Marketplace'))}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendations.map(item => {
          const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
          
          return (
            <Card 
              key={item.id}
              onClick={() => navigate(createPageUrl(`ItemDetail/${item.id}`))}
              className="card-gradient card-glow rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all group"
            >
              {/* Image */}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={primaryImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                  }}
                />
                {algorithm === 'sold' && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white font-bold">
                    Sold
                  </Badge>
                )}
                {item.price === 0 && algorithm !== 'sold' && (
                  <Badge className="absolute top-2 right-2 bg-lime-500 text-black font-bold">
                    Free
                  </Badge>
                )}
                {algorithm === 'trending' && item.views_count > 0 && (
                  <Badge className="absolute top-2 left-2 bg-pink-500/90 text-white text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {item.views_count}
                  </Badge>
                )}
              </div>

              {/* Content */}
              <CardContent className="p-3">
                <h3 className="font-semibold text-white text-sm line-clamp-2 leading-tight mb-2">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-cyan-400">
                      ${item.price}
                    </div>
                    {item.negotiation_enabled && (
                      <div className="flex items-center" title="Negotiation available">
                        <Handshake className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  {item.condition && (
                    <Badge className="text-xs bg-blue-900/50 text-blue-300 border-blue-700">
                      {item.condition.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

