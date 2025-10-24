import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, Lock, DollarSign, MapPin, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WishListMatchCard({ match, onContact }) {
  const matchPercentage = Math.round((match.match_score || 0.8) * 100);

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-pink-500 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <Badge className="bg-yellow-500 text-black">
                {matchPercentage}% Match
              </Badge>
            </div>
            <CardTitle className="text-white text-lg">
              {match.wishlist_item?.item_name}
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              {match.buyer?.full_name} is looking for this item
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Details */}
        <div className="space-y-3">
          {/* Your Item */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Your Item:</p>
            <p className="text-white font-semibold">{match.item?.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span>Locked Price: ${match.price_locked}</span>
              </div>
            </div>
          </div>

          {/* Buyer's Requirements */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Buyer Requirements:</p>
            {match.wishlist_item?.description && (
              <p className="text-gray-300 text-sm mb-2">
                {match.wishlist_item.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs">
              {match.wishlist_item?.preferred_price_min && match.wishlist_item?.preferred_price_max && (
                <Badge variant="outline" className="text-gray-300">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${match.wishlist_item.preferred_price_min} - ${match.wishlist_item.preferred_price_max}
                </Badge>
              )}
              
              {match.wishlist_item?.max_distance_km && (
                <Badge variant="outline" className="text-gray-300">
                  <MapPin className="w-3 h-3 mr-1" />
                  Within {match.wishlist_item.max_distance_km}km
                </Badge>
              )}
              
              {match.wishlist_item?.category && (
                <Badge variant="outline" className="text-gray-300">
                  <Package className="w-3 h-3 mr-1" />
                  {match.wishlist_item.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Acceptable Conditions */}
          {match.wishlist_item?.acceptable_conditions && match.wishlist_item.acceptable_conditions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Acceptable Conditions:</p>
              <div className="flex flex-wrap gap-1">
                {match.wishlist_item.acceptable_conditions.map((condition) => (
                  <Badge key={condition} variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {match.match_details && (
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Analysis:
              </p>
              <p className="text-blue-200 text-sm">
                {match.match_details.reasoning || "This item matches the buyer's requirements."}
              </p>
            </div>
          )}
        </div>

        {/* Price Lock Warning */}
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 text-xs font-semibold">Price Locked</p>
              <p className="text-yellow-300 text-xs mt-1">
                You must honor the price of ${match.price_locked} for this buyer. You cannot increase this price.
              </p>
            </div>
          </div>
        </div>

        {/* Match Time */}
        <p className="text-xs text-gray-500">
          Matched {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
        </p>

        {/* Contact Button */}
        <Button
          onClick={() => onContact(match)}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Contact {match.buyer?.full_name}
        </Button>
      </CardContent>
    </Card>
  );
}

