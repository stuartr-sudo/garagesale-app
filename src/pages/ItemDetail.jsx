import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, MapPin, Tag, Calendar, Star, Share2, Bot, Settings, Check, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Item } from '@/api/entities';
import { User as UserEntity } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import AgentChat from '@/components/agent/AgentChat';
import { createPageUrl } from '@/utils';
import PurchaseModal from '@/components/marketplace/PurchaseModal';
import MoreFromSeller from '@/components/marketplace/MoreFromSeller';
import SmartRecommendations from '@/components/recommendations/SmartRecommendations';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [hasAgentEnabled, setHasAgentEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load item data on mount
    loadItem();
    trackItemView();
  }, [id]);

  const trackItemView = async () => {
    try {
      // Increment view count
      await supabase.rpc('increment_item_view_count', { item_id: id });
    } catch (error) {
      console.error('Error tracking view:', error);
      // Silent fail - don't interrupt user experience
    }
  };

  const loadItem = async () => {
    setLoading(true);
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }

      // Get item
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (itemError || !itemData) {
        console.error('Item not found');
        navigate(createPageUrl('Marketplace'));
        return;
      }

      setItem(itemData);

      // Check if current user is the owner
      if (session?.user && itemData.seller_id === session.user.id) {
        setIsOwner(true);
      }

      // Get seller
      if (itemData.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', itemData.seller_id)
          .single();

        setSeller(sellerData);
      }

      // Check if agent is enabled - look for any item_knowledge record
      const { data: knowledge } = await supabase
        .from('item_knowledge')
        .select('*')
        .eq('item_id', id)
        .single();

      setHasAgentEnabled(!!knowledge);
      if (knowledge?.minimum_price) {
        setMinimumPrice(knowledge.minimum_price.toString());
      }

    } catch (error) {
      console.error('Error loading item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSaveAgentSettings = async () => {
    try {
      if (minimumPrice && parseFloat(minimumPrice) > 0) {
        // Create or update item knowledge
        const { error } = await supabase
          .from('item_knowledge')
          .upsert([{
            item_id: item.id,
            minimum_price: parseFloat(minimumPrice),
            negotiation_notes: `Minimum acceptable price: $${minimumPrice}`,
            negotiation_enabled: true,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error saving agent settings:', error);
          alert('Error saving settings. Please try again.');
          return;
        }

        setHasAgentEnabled(true);
        setShowAgentSettings(false);
        alert('AI Agent settings saved successfully!');
      } else {
        alert('Please enter a valid minimum price.');
      }
    } catch (error) {
      console.error('Error saving agent settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const user = await UserEntity.me();
      
      // Check if already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('buyer_id', user.id)
        .eq('item_id', item.id)
        .single();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('cart_items')
          .insert({
            buyer_id: user.id,
            item_id: item.id,
            quantity: 1
          });

        if (error) throw error;
      }

      setIsInCart(true);
      toast({
        title: "Added to Cart!",
        description: `${item.title} has been added to your cart`
      });

      setTimeout(() => setIsInCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const images = item.image_urls || [];
  // Filter out invalid blob URLs and use fallback
  const validImages = images.filter(img => img && !img.startsWith('blob:'));
  const primaryImage = validImages[selectedImage] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-4 md:px-8 md:pb-8 overflow-x-hidden" style={{ scrollBehavior: 'auto' }}>
      {/* Back Button */}
      <div className="max-w-7xl mx-auto py-2">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Marketplace'))}
          className="text-gray-400 hover:text-white hover:bg-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Desktop/Mobile Layout: New structured layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Image, Title, Price, Description */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Carousel Card */}
            <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10 overflow-hidden">
              <div 
                className="relative h-80 md:h-96 lg:h-[500px] cursor-pointer"
                onClick={() => setIsImageFullscreen(true)}
              >
                <img
                  src={primaryImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";
                  }}
                />
                {item.price === 0 && (
                  <Badge className="absolute top-4 right-4 bg-lime-500 text-black font-bold text-lg px-4 py-2">
                    Free
                  </Badge>
                )}
              </div>
            
              {/* Thumbnail Gallery */}
              {validImages.length > 1 && (
                <div className="p-3 bg-slate-600/50 border-t border-slate-500">
                  <div className="flex gap-2 overflow-x-auto">
                    {validImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-pink-500 scale-105'
                            : 'border-slate-500 hover:border-slate-500'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${item.title} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Title Card */}
            <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{item.title}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-gray-400 hover:text-white h-8 w-8"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price, Condition, Category Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Price Card */}
              <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Price</div>
                  <div className="text-xl md:text-2xl font-bold text-cyan-400">
                    {item.price === 0 ? 'Free' : `$${item.price}`}
                  </div>
                </CardContent>
              </Card>

              {/* Condition Card */}
              <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Condition</div>
                  <Badge variant="secondary" className="capitalize bg-blue-900/50 text-blue-300 border-blue-700">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>

              {/* Category Card */}
              <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Category</div>
                  <Badge variant="outline" className="capitalize bg-purple-900/50 text-purple-300 border-purple-700">
                    {item.category?.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Description Card */}
            <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                <div>
                  <p className={`text-gray-300 leading-relaxed text-sm ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                    {item.description}
                  </p>
                  {item.description && item.description.length > 150 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-pink-400 hover:text-pink-300 text-sm font-medium mt-2 flex items-center gap-1"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <span>Show Less</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Expand Description</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Right Column - AI Agent, then Buy Now and Seller Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* AI Agent Chat - At the top */}
          {hasAgentEnabled ? (
            <AgentChat
              itemId={item.id}
              itemTitle={item.title}
              itemPrice={item.price}
            />
          ) : isOwner ? (
            <Card className="bg-slate-600/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5 text-pink-400" />
                  AI Agent Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAgentSettings ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="minimumPrice" className="text-gray-300">
                        Minimum Price for AI Agent
                      </Label>
                      <Input
                        id="minimumPrice"
                        type="number"
                        step="0.01"
                        value={minimumPrice}
                        onChange={(e) => setMinimumPrice(e.target.value)}
                        placeholder="e.g., 100.00"
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        The AI agent will automatically accept offers at or above this price
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveAgentSettings}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700"
                      >
                        Save Settings
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAgentSettings(false)}
                        className="bg-slate-600 border-slate-500 text-white hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-gray-400">
                      Enable AI Agent to automatically negotiate with buyers
                    </p>
                    <Button
                      onClick={() => setShowAgentSettings(true)}
                      className="w-full bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure AI Agent
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-600/50 border-slate-600 p-6 text-center">
              <p className="text-gray-400">
                AI Assistant not available for this item
              </p>
            </Card>
          )}

          {/* Action Buttons - Below AI Agent */}
          <div className="space-y-2">
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || isInCart}
              className={`w-full h-10 md:h-12 text-white font-semibold text-sm md:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                isInCart
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full h-10 md:h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-sm md:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              style={{
                animation: 'subtle-pulse 3s ease-in-out infinite'
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {item.price === 0 ? 'Claim' : 'Buy Now'}
            </Button>
          </div>
          <style jsx>{`
            @keyframes subtle-pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.85;
              }
            }
          `}</style>

          {/* Seller Info - Compact */}
          {seller && (
            <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">{seller.full_name}</div>
                    {seller.rating_count > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400 text-xs mt-0.5">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>{seller.average_rating?.toFixed(1)} ({seller.rating_count})</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* More from this Seller */}
      {seller && (
        <MoreFromSeller sellerId={seller.id} currentItemId={item.id} />
      )}

      {/* Smart Recommendations - Similar Items */}
      <SmartRecommendations 
        currentItemId={item.id}
        currentItem={item}
        algorithm="similar"
        title="Similar Items You Might Like"
        limit={6}
      />

      {/* Smart Recommendations - Trending */}
      <SmartRecommendations 
        currentItemId={item.id}
        currentItem={item}
        algorithm="trending"
        limit={6}
      />

      {/* Smart Recommendations - Price Based */}
      <SmartRecommendations 
        currentItemId={item.id}
        currentItem={item}
        algorithm="price"
        limit={6}
      />
      
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          item={item}
          seller={seller}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}

      {/* Fullscreen Image Modal */}
      {isImageFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsImageFullscreen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-slate-600/80 hover:bg-slate-600 text-white rounded-full p-3 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Image Button */}
          {validImages.length > 1 && selectedImage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage - 1);
              }}
              className="absolute left-4 z-10 bg-slate-600/80 hover:bg-slate-600 text-white rounded-full p-3 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Image Button */}
          {validImages.length > 1 && selectedImage < validImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage + 1);
              }}
              className="absolute right-4 z-10 bg-slate-600/80 hover:bg-slate-600 text-white rounded-full p-3 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Fullscreen Image */}
          <div 
            className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={primaryImage}
              alt={item.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";
              }}
            />
          </div>

          {/* Image Counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-600/80 text-white px-4 py-2 rounded-full text-sm">
              {selectedImage + 1} / {validImages.length}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
