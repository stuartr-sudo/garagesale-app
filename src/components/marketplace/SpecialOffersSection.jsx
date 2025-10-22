import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingDown, Package, Sparkles } from "lucide-react";
import { getItemSpecialOffers, getOfferItems, formatOfferText, getOfferBadgeColor } from '@/api/offers';
import { Link } from 'react-router-dom';

export default function SpecialOffersSection({ itemId, sellerId }) {
  const [offers, setOffers] = useState([]);
  const [offerItems, setOfferItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const itemOffers = await getItemSpecialOffers(itemId);
        setOffers(itemOffers);

        // Load items for each offer
        const itemsMap = {};
        for (const offer of itemOffers) {
          const items = await getOfferItems(offer.id);
          itemsMap[offer.id] = items.filter(i => i.id !== itemId); // Exclude current item
        }
        setOfferItems(itemsMap);
      } catch (error) {
        console.error('Error loading offers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [itemId, sellerId]);

  if (loading || offers.length === 0) {
    return null;
  }

  const getOfferIcon = (offerType) => {
    switch (offerType) {
      case 'bogo':
        return <Gift className="w-5 h-5" />;
      case 'bulk_discount':
        return <Package className="w-5 h-5" />;
      case 'percentage_off':
        return <TrendingDown className="w-5 h-5" />;
      case 'bundle':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getOfferDetails = (offer) => {
    const config = offer.config || {};
    
    switch (offer.offer_type) {
      case 'bogo':
        return {
          title: 'Buy One, Get One!',
          description: `Buy ${config.buy_quantity || 1} item(s), get ${config.get_quantity || 1} free!`
        };
      
      case 'bulk_discount':
        return {
          title: 'Bulk Discount',
          description: `Purchase ${config.min_quantity || 2} or more items and save ${config.discount_percentage || 0}%!`
        };
      
      case 'percentage_off':
        return {
          title: 'Special Discount',
          description: `Get ${config.discount_percentage || 0}% off this item!`
        };
      
      case 'bundle':
        return {
          title: 'Bundle Deal',
          description: `Buy these items together and save ${config.discount_percentage || 0}%!`
        };
      
      default:
        return {
          title: offer.title || 'Special Offer',
          description: offer.description || 'Limited time offer!'
        };
    }
  };

  return (
    <div className="my-8">
      {offers.map((offer) => {
        const details = getOfferDetails(offer);
        const relatedItems = offerItems[offer.id] || [];

        return (
          <Card 
            key={offer.id} 
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20 animate-pulse-slow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${getOfferBadgeColor(offer.offer_type)} rounded-lg`}>
                  {getOfferIcon(offer.offer_type)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    {details.title}
                    <Badge className={`${getOfferBadgeColor(offer.offer_type)} text-white animate-pulse`}>
                      {formatOfferText(offer)}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-400 text-sm mt-1">{details.description}</p>
                </div>
              </div>
            </CardHeader>

            {relatedItems.length > 0 && (offer.offer_type === 'bundle' || offer.offer_type === 'bogo') && (
              <CardContent>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Bundle with these items:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {relatedItems.slice(0, 4).map((item) => (
                      <Link 
                        key={item.id} 
                        to={`/ItemDetail/${item.id}`}
                        className="group"
                      >
                        <Card className="bg-gray-800/50 border-gray-700 hover:border-orange-500/50 transition-all hover:scale-105">
                          <div className="aspect-square overflow-hidden rounded-t-lg">
                            <img
                              src={item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop"}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
                            <p className="text-cyan-400 text-sm font-bold">${item.price}</p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  {relatedItems.length > 4 && (
                    <p className="text-gray-500 text-xs mt-2 text-center">
                      +{relatedItems.length - 4} more items in this offer
                    </p>
                  )}
                </div>
              </CardContent>
            )}

            {offer.ends_at && (
              <CardContent className="pt-0">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <p className="text-gray-400 text-xs text-center">
                    ⏰ Offer ends: {new Date(offer.ends_at).toLocaleDateString()} at {new Date(offer.ends_at).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

