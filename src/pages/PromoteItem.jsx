import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Calendar, Target, Info, Loader2, Trophy, Zap } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function PromoteItem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sellerBalance, setSellerBalance] = useState(0);
  const [myItems, setMyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePromotions, setActivePromotions] = useState([]);
  const [topBid, setTopBid] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const MIN_BID = 1.00;
  const PROMOTION_DURATION_DAYS = 7;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load seller balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_balance')
        .eq('id', user.id)
        .single();
      
      setSellerBalance(profile?.seller_balance || 0);

      // Load user's items (only available items)
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setMyItems(items || []);

      // Load active promotions for this user
      const { data: promotions, error: promoError } = await supabase
        .from('promotions')
        .select(`
          *,
          item:items(*),
          bids:promotion_bids(*)
        `)
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (promoError) throw promoError;
      setActivePromotions(promotions || []);

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTopBid = async (itemId) => {
    if (!itemId || !selectedItem?.category) return;

    try {
      // Get current top bid for this category
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          bids:promotion_bids(bid_amount)
        `)
        .eq('category', selectedItem.category)
        .eq('status', 'active')
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const currentTopBid = data?.bid_amount || 0;
      setTopBid(currentTopBid);
      
      // Auto-suggest a bid $0.50 higher than current top
      if (currentTopBid > 0) {
        setBidAmount((currentTopBid + 0.50).toFixed(2));
      } else {
        setBidAmount(MIN_BID.toFixed(2));
      }
    } catch (error) {
      console.error("Error loading top bid:", error);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      loadTopBid(selectedItem.id);
    }
  }, [selectedItem]);

  const handleSubmitBid = async () => {
    if (!selectedItem || !bidAmount) {
      toast({
        title: "Error",
        description: "Please select an item and enter a bid amount",
        variant: "destructive"
      });
      return;
    }

    const bid = parseFloat(bidAmount);

    if (bid < MIN_BID) {
      toast({
        title: "Error",
        description: `Minimum bid is $${MIN_BID.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (topBid && bid <= topBid) {
      toast({
        title: "Bid Too Low",
        description: `Your bid must be higher than the current top bid of $${topBid.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (bid > sellerBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need $${bid.toFixed(2)} but only have $${sellerBalance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + PROMOTION_DURATION_DAYS);

      // Create promotion
      const { data: promotion, error: promoError } = await supabase
        .from('promotions')
        .insert({
          item_id: selectedItem.id,
          seller_id: currentUser.id,
          category: selectedItem.category || 'general',
          bid_amount: bid,
          start_time: new Date().toISOString(),
          end_time: endDate.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (promoError) throw promoError;

      // Record bid
      await supabase
        .from('promotion_bids')
        .insert({
          promotion_id: promotion.id,
          bidder_id: currentUser.id,
          bid_amount: bid,
          bid_time: new Date().toISOString()
        });

      // Deduct from balance
      await supabase
        .from('balance_transactions')
        .insert({
          user_id: currentUser.id,
          amount: -bid,
          type: 'promotion_bid',
          related_entity_type: 'promotion',
          related_entity_id: promotion.id,
          description: `Promoted listing for "${selectedItem.title}"`
        });

      // Update seller balance
      await supabase
        .from('profiles')
        .update({ seller_balance: sellerBalance - bid })
        .eq('id', currentUser.id);

      toast({
        title: "Success!",
        description: `Your item is now promoted for ${PROMOTION_DURATION_DAYS} days!`,
      });

      // Refresh data
      loadUserData();
      setSelectedItem(null);
      setBidAmount('');

    } catch (error) {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to promote item",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Promote Your Items</h1>
              <p className="text-gray-400 text-sm">Boost visibility and sell faster</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Your Balance</p>
            <p className="text-2xl font-bold text-green-400">${sellerBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Promote Item */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Promote an Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* How it Works */}
              <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-200 font-semibold mb-2">How Promoted Listings Work</h4>
                    <ul className="text-sm text-blue-100 space-y-1">
                      <li>• Bid for top spots in your category</li>
                      <li>• Highest bidder gets featured placement</li>
                      <li>• Promotion lasts for {PROMOTION_DURATION_DAYS} days</li>
                      <li>• Paid from your seller balance</li>
                      <li>• Rotated equally throughout the day</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Select Item */}
              <div className="space-y-2">
                <Label>Select Item to Promote *</Label>
                <Select
                  value={selectedItem?.id}
                  onValueChange={(itemId) => {
                    const item = myItems.find(i => i.id === itemId);
                    setSelectedItem(item);
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Choose an item..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {myItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No available items to promote
                      </div>
                    ) : (
                      myItems.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="text-white hover:bg-gray-700">
                          <div className="flex items-center gap-2">
                            {item.image_urls?.[0] && (
                              <img
                                src={item.image_urls[0]}
                                alt={item.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-gray-400">${item.price?.toFixed(2)}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Info */}
              {selectedItem && (
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Category:</span>
                    <Badge>{selectedItem.category || 'General'}</Badge>
                  </div>
                  {topBid > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                      <span className="text-gray-400 text-sm">Current Top Bid:</span>
                      <span className="text-yellow-400 font-bold">${topBid.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bid Amount */}
              <div className="space-y-2">
                <Label htmlFor="bid">Your Bid Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="bid"
                    type="number"
                    min={MIN_BID}
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={MIN_BID.toFixed(2)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    disabled={!selectedItem}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimum bid: ${MIN_BID.toFixed(2)}
                  {topBid > 0 && ` | Beat current top: $${(topBid + 0.01).toFixed(2)}`}
                </p>
              </div>

              {/* Duration Info */}
              <div className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Duration:</span>
                </div>
                <span className="text-white font-semibold">{PROMOTION_DURATION_DAYS} days</span>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitBid}
                disabled={!selectedItem || !bidAmount || submitting || parseFloat(bidAmount) > sellerBalance}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Promote Item
                  </>
                )}
              </Button>

              {parseFloat(bidAmount) > sellerBalance && (
                <p className="text-xs text-red-400 text-center">
                  Insufficient balance. You need ${(parseFloat(bidAmount) - sellerBalance).toFixed(2)} more.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Active Promotions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Your Active Promotions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activePromotions.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-2">No active promotions</p>
                  <p className="text-sm text-gray-500">
                    Promote an item to increase visibility
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePromotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {promo.item?.image_urls?.[0] && (
                          <img
                            src={promo.item.image_urls[0]}
                            alt={promo.item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">
                            {promo.item?.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {promo.category}
                            </Badge>
                            <span className="text-yellow-400 text-sm font-bold">
                              ${promo.bid_amount?.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Expires {formatDistanceToNow(new Date(promo.end_time), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Info */}
        <Card className="bg-gray-900 border-gray-800 mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-white mb-3">Promotion Tips</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white text-sm">Be Competitive</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Bid slightly higher than current top to secure the spot
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white text-sm">Timing Matters</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Promote before weekends for maximum visibility
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white text-sm">Track Results</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Monitor views and conversions during promotion
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

