import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Plus, 
  Search, 
  Filter,
  Sparkles,
  MapPin,
  DollarSign,
  Package,
  Loader2,
  MessageSquare,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CreateWishListItem from "@/components/wishes/CreateWishListItem";
import WishListMatchCard from "@/components/wishes/WishListMatchCard";

export default function WishLists() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myWishes, setMyWishes] = useState([]);
  const [buyerRequests, setBuyerRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadMyWishes();
      loadMatches();
      if (currentUser.account_type === 'seller') {
        loadBuyerRequests();
      }
    }
  }, [currentUser]);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      navigate(createPageUrl('SignIn'));
    } finally {
      setLoading(false);
    }
  };

  const loadMyWishes = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          wishlist:wishlists(*)
        `)
        .eq('wishlist.user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyWishes(data || []);
    } catch (error) {
      console.error("Error loading wishes:", error);
    }
  };

  const loadBuyerRequests = async () => {
    try {
      // Get all active wishes from all users (public)
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          wishlist:wishlists(
            id,
            user_id,
            created_at,
            profile:profiles(full_name, email)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyerRequests(data || []);
    } catch (error) {
      console.error("Error loading buyer requests:", error);
    }
  };

  const loadMatches = async () => {
    try {
      // Get matches for items this seller has listed
      const { data, error } = await supabase
        .from('wishlist_matches')
        .select(`
          *,
          wishlist_item:wishlist_items(*),
          item:items(*),
          buyer:profiles!wishlist_matches_buyer_id_fkey(id, full_name, email)
        `)
        .eq('seller_id', currentUser.id)
        .eq('seller_responded', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error loading matches:", error);
    }
  };

  const handleContactBuyer = async (match) => {
    try {
      // Create or get conversation
      const response = await fetch('/api/messages/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1_id: currentUser.id,
          user2_id: match.buyer_id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Mark as responded
        await supabase
          .from('wishlist_matches')
          .update({ seller_responded: true })
          .eq('id', match.id);

        // Navigate to messages
        navigate(createPageUrl(`Messages/${data.conversation_id}`));
      }
    } catch (error) {
      console.error("Error contacting buyer:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handleMarkFulfilled = async (wishId) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ 
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', wishId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Wish marked as fulfilled!",
      });

      loadMyWishes();
    } catch (error) {
      console.error("Error marking fulfilled:", error);
      toast({
        title: "Error",
        description: "Failed to update wish",
        variant: "destructive"
      });
    }
  };

  const handleCancelWish = async (wishId) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ status: 'cancelled' })
        .eq('id', wishId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Wish cancelled",
      });

      loadMyWishes();
    } catch (error) {
      console.error("Error cancelling wish:", error);
      toast({
        title: "Error",
        description: "Failed to cancel wish",
        variant: "destructive"
      });
    }
  };

  const filteredWishes = myWishes.filter(wish => {
    if (selectedPriority !== 'all' && wish.priority !== selectedPriority) return false;
    if (searchQuery && !wish.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = buyerRequests.filter(request => {
    if (searchQuery && !request.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            <div>
              <h1 className="text-3xl font-bold">Wish Lists</h1>
              <p className="text-gray-400 text-sm">Tell sellers what you're looking for</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Wish
          </Button>
        </div>

        <Tabs defaultValue="my-wishes" className="w-full">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="my-wishes" className="data-[state=active]:bg-pink-500">
              My Wishes ({myWishes.filter(w => w.status === 'active').length})
            </TabsTrigger>
            {matches.length > 0 && (
              <TabsTrigger value="matches" className="data-[state=active]:bg-pink-500">
                <Sparkles className="w-4 h-4 mr-2" />
                Matches ({matches.length})
              </TabsTrigger>
            )}
            {currentUser?.account_type === 'seller' && (
              <TabsTrigger value="buyer-requests" className="data-[state=active]:bg-pink-500">
                Buyer Requests ({buyerRequests.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* My Wishes Tab */}
          <TabsContent value="my-wishes" className="space-y-4">
            {/* Filters */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search wishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Wishes List */}
            {filteredWishes.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">No wishes yet</h3>
                  <p className="text-gray-400 mb-4">
                    Create a wish list and sellers will be notified when they have matching items
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Wish
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWishes.map((wish) => (
                  <Card key={wish.id} className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white">{wish.item_name}</CardTitle>
                          <p className="text-gray-400 text-sm mt-1">{wish.description}</p>
                        </div>
                        <Badge className={
                          wish.priority === 'urgent' ? 'bg-red-500' :
                          wish.priority === 'high' ? 'bg-orange-500' :
                          wish.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }>
                          {wish.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {wish.preferred_price_min && wish.preferred_price_max && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span>${wish.preferred_price_min} - ${wish.preferred_price_max}</span>
                          </div>
                        )}
                        {wish.max_distance_km && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>Within {wish.max_distance_km}km</span>
                          </div>
                        )}
                        {wish.category && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Package className="w-4 h-4" />
                            <span>{wish.category}</span>
                          </div>
                        )}
                      </div>

                      {/* Acceptable Conditions */}
                      {wish.acceptable_conditions && wish.acceptable_conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {wish.acceptable_conditions.map((condition) => (
                            <Badge key={condition} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Status Badge */}
                      <Badge className={
                        wish.status === 'fulfilled' ? 'bg-green-600' :
                        wish.status === 'cancelled' ? 'bg-gray-600' :
                        'bg-blue-600'
                      }>
                        {wish.status}
                      </Badge>

                      {/* Actions */}
                      {wish.status === 'active' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkFulfilled(wish.id)}
                            className="flex-1 bg-green-900/30 border-green-800 text-green-200 hover:bg-green-900/50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Fulfilled
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelWish(wish.id)}
                            className="flex-1 bg-red-900/30 border-red-800 text-red-200 hover:bg-red-900/50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Matches Tab */}
          {matches.length > 0 && (
            <TabsContent value="matches" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-200 font-semibold mb-1">AI-Powered Matches</h3>
                    <p className="text-blue-300 text-sm">
                      Our AI found buyers looking for items you're selling. Prices are locked at current value.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {matches.map((match) => (
                  <WishListMatchCard
                    key={match.id}
                    match={match}
                    onContact={handleContactBuyer}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {/* Buyer Requests Tab */}
          {currentUser?.account_type === 'seller' && (
            <TabsContent value="buyer-requests" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search buyer requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {filteredRequests.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No buyer requests found</h3>
                    <p className="text-gray-400">
                      When buyers create wish lists, they'll appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="bg-gray-900 border-gray-800 hover:border-pink-500 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{request.item_name}</CardTitle>
                        <p className="text-gray-400 text-sm">{request.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {request.preferred_price_min && request.preferred_price_max && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">
                              ${request.preferred_price_min} - ${request.preferred_price_max}
                            </span>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Contact buyers feature is being built!",
                            });
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          I Have This
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Create Wish Modal */}
      {showCreateModal && (
        <CreateWishListItem
          userId={currentUser.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadMyWishes();
          }}
        />
      )}
    </div>
  );
}

