import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { User } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Loader2, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import TradeOfferCard from '../components/trading/TradeOfferCard';

export default function TradeOffers() {
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("received");
  const [canTrade, setCanTrade] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTradeOffers();
    }
  }, [currentUser]);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Check if user has trading enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('open_to_trades')
        .eq('id', user.id)
        .single();
      
      setCanTrade(profile?.open_to_trades || false);
    } catch (error) {
      console.error("Error loading user:", error);
      navigate(createPageUrl('SignIn'));
    }
  };

  const loadTradeOffers = async () => {
    setLoading(true);
    try {
      // Load received offers
      const { data: received, error: receivedError } = await supabase
        .from('trade_offers')
        .select(`
          *,
          offeror:profiles!trade_offers_offeror_id_fkey(id, full_name, email),
          requestee:profiles!trade_offers_requestee_id_fkey(id, full_name, email),
          item_requested:items!trade_offers_item_id_requested_fkey(*),
          offered_items:trade_items(
            item:items(*)
          )
        `)
        .eq('requestee_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Transform offered_items array
      const receivedWithItems = received?.map(offer => ({
        ...offer,
        offered_items: offer.offered_items?.map(ti => ti.item) || []
      })) || [];

      setReceivedOffers(receivedWithItems);

      // Load sent offers
      const { data: sent, error: sentError } = await supabase
        .from('trade_offers')
        .select(`
          *,
          offeror:profiles!trade_offers_offeror_id_fkey(id, full_name, email),
          requestee:profiles!trade_offers_requestee_id_fkey(id, full_name, email),
          item_requested:items!trade_offers_item_id_requested_fkey(*),
          offered_items:trade_items(
            item:items(*)
          )
        `)
        .eq('offeror_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Transform offered_items array
      const sentWithItems = sent?.map(offer => ({
        ...offer,
        offered_items: offer.offered_items?.map(ti => ti.item) || []
      })) || [];

      setSentOffers(sentWithItems);

    } catch (error) {
      console.error("Error loading trade offers:", error);
      toast({
        title: "Error",
        description: "Failed to load trade offers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (trade) => {
    try {
      const response = await fetch('/api/trading/respond-to-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_id: trade.id,
          user_id: currentUser.id,
          action: 'accept'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Trade Accepted!",
          description: "The trade has been accepted. Arrange collection with the other party.",
        });
        loadTradeOffers();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error accepting trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept trade",
        variant: "destructive"
      });
    }
  };

  const handleRejectTrade = async (trade) => {
    try {
      const response = await fetch('/api/trading/respond-to-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_id: trade.id,
          user_id: currentUser.id,
          action: 'reject'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Trade Rejected",
          description: "The trade offer has been rejected.",
        });
        loadTradeOffers();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error rejecting trade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject trade",
        variant: "destructive"
      });
    }
  };

  const handleMessage = async (trade) => {
    try {
      // Create or get conversation
      const response = await fetch('/api/messages/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1_id: currentUser.id,
          user2_id: trade.offeror_id
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate(createPageUrl(`Messages/${data.conversation_id}`));
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
    );
  }

  // Trading disabled warning
  if (!canTrade) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold text-white mb-2">Trading Disabled</h2>
              <p className="text-gray-400 mb-6">
                You need to enable trading in your settings to send or receive trade offers.
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Settings'))}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
        </CardContent>
      </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold">Trade Offers</h1>
              <p className="text-gray-400 text-sm">Exchange items with other users</p>
            </div>
          </div>
          <Button
            onClick={loadTradeOffers}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="received" className="data-[state=active]:bg-blue-500">
              Received ({receivedOffers.filter(o => o.status === 'pending').length})
              </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-blue-500">
              Sent ({sentOffers.filter(o => o.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

          {/* Received Offers Tab */}
          <TabsContent value="received" className="space-y-4">
            {receivedOffers.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trade offers yet</h3>
                  <p className="text-gray-400">
                    When someone wants to trade with you, their offers will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {receivedOffers.map((trade) => (
                  <TradeOfferCard
                    key={trade.id}
                    trade={trade}
                    isReceived={true}
                    onAccept={handleAcceptTrade}
                    onReject={handleRejectTrade}
                    onMessage={handleMessage}
                  />
                ))}
                </div>
              )}
            </TabsContent>

          {/* Sent Offers Tab */}
          <TabsContent value="sent" className="space-y-4">
            {sentOffers.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trade offers sent</h3>
                  <p className="text-gray-400 mb-4">
                    Browse items in the marketplace and click "Propose Trade" to send offers
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl('Marketplace'))}
                    className="bg-gradient-to-r from-pink-500 to-purple-600"
                  >
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sentOffers.map((trade) => (
                  <TradeOfferCard
                    key={trade.id}
                    trade={trade}
                    isReceived={false}
                    onMessage={handleMessage}
                  />
                ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
    </div>
  );
}
