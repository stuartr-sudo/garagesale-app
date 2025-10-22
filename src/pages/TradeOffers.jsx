
import React, { useState, useEffect } from 'react';
import { TradeProposal } from '@/api/entities';
import { Item } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ArrowRight, Clock, Check, X, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import TradeResponseModal from '../components/trading/TradeResponseModal';

export default function TradeOffers() {
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [activeTab, setActiveTab] = useState("received");

  useEffect(() => {
    loadTradeOffers();
  }, []);

  const loadTradeOffers = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load received offers
      const received = await TradeProposal.filter({ target_user_id: user.id }, "-created_date");
      const receivedWithDetails = await Promise.all(
        received.map(async (offer) => {
          const proposer = await User.get(offer.proposer_user_id);
          const targetItem = await Item.get(offer.target_item_id);
          return { ...offer, proposer, targetItem };
        })
      );

      // Load sent offers
      const sent = await TradeProposal.filter({ proposer_user_id: user.id }, "-created_date");
      const sentWithDetails = await Promise.all(
        sent.map(async (offer) => {
          const targetUser = await User.get(offer.target_user_id);
          const targetItem = await Item.get(offer.target_item_id);
          return { ...offer, targetUser, targetItem };
        })
      );

      setReceivedOffers(receivedWithDetails);
      setSentOffers(sentWithDetails);
    } catch (error) {
      console.error("Error loading trade offers:", error);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'accepted': return 'bg-green-900/50 text-green-300 border-green-700';
      case 'declined': return 'bg-red-900/50 text-red-300 border-red-700';
      case 'counter_offered': return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'completed': return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'cancelled': return 'bg-gray-700 text-gray-300 border-gray-700';
      default: return 'bg-gray-700 text-gray-300 border-gray-700';
    }
  };

  const TradeOfferCard = ({ offer, isReceived = false }) => {
    const otherUser = isReceived ? offer.proposer : offer.targetUser;
    const isExpired = new Date(offer.expires_at) < new Date();
    
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800 rounded-2xl">
        <CardHeader className="bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {otherUser?.full_name?.[0] || 'U'}
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {isReceived ? `${otherUser?.full_name} wants to trade` : `Trade with ${otherUser?.full_name}`}
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  {formatDistanceToNow(new Date(offer.created_date), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(offer.status)}>
                {offer.status.replace('_', ' ')}
              </Badge>
              {isExpired && offer.status === 'pending' && (
                <Badge className="bg-red-900/50 text-red-300 border-red-700 text-xs">
                  Expired
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Target Item */}
          <div className="mb-6">
            <h4 className="text-gray-300 text-sm font-medium mb-2">
              {isReceived ? "Your item:" : "Item you want:"}
            </h4>
            <div className="flex gap-3 items-center bg-gray-800/50 rounded-xl p-3">
              <img
                src={offer.targetItem?.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop"}
                alt={offer.targetItem?.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h5 className="font-semibold text-white">{offer.targetItem?.title}</h5>
                <p className="text-green-400 font-bold">${offer.targetItem?.price}</p>
              </div>
            </div>
          </div>

          {/* Offered Items */}
          <div className="mb-6">
            <h4 className="text-gray-300 text-sm font-medium mb-2">
              {isReceived ? "They're offering:" : "You're offering:"}
            </h4>
            <div className="space-y-2">
              {offer.offered_items?.map((item, index) => (
                <div key={index} className="flex gap-3 items-center bg-gray-800/30 rounded-lg p-2">
                  <img
                    src={item.item_image_url || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop"}
                    alt={item.item_title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{item.item_title}</p>
                    <p className="text-green-400 font-bold text-sm">${item.item_price}</p>
                  </div>
                </div>
              ))}
              
              {offer.cash_amount > 0 && (
                <div className="flex gap-3 items-center bg-green-900/20 rounded-lg p-2 border border-green-800">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">$</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">Cash</p>
                    <p className="text-green-400 font-bold text-sm">${offer.cash_amount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Value Comparison */}
          <div className="bg-gray-800/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Total Offer Value:</span>
              <span className="text-xl font-bold text-purple-400">${offer.total_offered_value}</span>
            </div>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-400">
              <ArrowRight className="w-4 h-4 mx-2" />
              {offer.total_offered_value > offer.targetItem?.price ? (
                <span className="text-green-400">
                  +${(offer.total_offered_value - offer.targetItem?.price).toFixed(2)} over asking
                </span>
              ) : offer.total_offered_value < offer.targetItem?.price ? (
                <span className="text-red-400">
                  -${(offer.targetItem?.price - offer.total_offered_value).toFixed(2)} under asking
                </span>
              ) : (
                <span className="text-blue-400">Even trade!</span>
              )}
            </div>
          </div>

          {/* Message */}
          {offer.message && (
            <div className="bg-gray-800/30 rounded-xl p-3 mb-4">
              <p className="text-gray-300 text-sm italic">"{offer.message}"</p>
            </div>
          )}

          {/* Response Message */}
          {offer.response_message && (
            <div className="bg-blue-900/20 rounded-xl p-3 mb-4 border border-blue-800">
              <p className="text-blue-300 text-sm">
                <strong>Response:</strong> {offer.response_message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isReceived && offer.status === 'pending' && !isExpired && (
              <>
                <Button
                  onClick={() => setSelectedOffer(offer)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Respond
                </Button>
              </>
            )}
            
            {offer.status === 'accepted' && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Arrange Exchange
              </Button>
            )}

            {(offer.status === 'pending' && !isExpired) && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                Expires {format(new Date(offer.expires_at), 'MMM d, h:mm a')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-48"></div>
            <div className="grid gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Trade Offers</h1>
            <p className="text-lg text-gray-400">Manage your item trades and exchanges</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 rounded-xl p-1 mb-8">
              <TabsTrigger 
                value="received" 
                className="rounded-lg text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Received ({receivedOffers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="sent" 
                className="rounded-lg text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Sent ({sentOffers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-6">
              {receivedOffers.length > 0 ? (
                receivedOffers.map((offer) => (
                  <TradeOfferCard key={offer.id} offer={offer} isReceived={true} />
                ))
              ) : (
                <div className="text-center py-16">
                  <RefreshCw className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trade offers received</h3>
                  <p className="text-gray-400">When people want to trade for your items, you'll see their offers here.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-6">
              {sentOffers.length > 0 ? (
                sentOffers.map((offer) => (
                  <TradeOfferCard key={offer.id} offer={offer} isReceived={false} />
                ))
              ) : (
                <div className="text-center py-16">
                  <RefreshCw className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trade offers sent</h3>
                  <p className="text-gray-400">Browse the marketplace and propose trades on items you're interested in.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedOffer && (
        <TradeResponseModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onUpdate={loadTradeOffers}
        />
      )}
    </div>
  );
}
