import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, MapPin, Tag, Calendar, Star, Share2, Bot, Settings, Check, Plus, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Item } from '@/api/entities';
import { User as UserEntity } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import AgentChat from '@/components/agent/AgentChat';
import { createPageUrl } from '@/utils';
import PurchaseModal from '@/components/marketplace/PurchaseModal';
import MoreFromSeller from '@/components/marketplace/MoreFromSeller';
import SmartRecommendations from '@/components/recommendations/SmartRecommendations';
import SpecialOffersSection from '@/components/marketplace/SpecialOffersSection';
import ProposeTradeModal from '@/components/trading/ProposeTradeModal';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
// Cart system scorched - addToCart removed
import UrgencyIndicators from '@/components/marketplace/UrgencyIndicators';

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState(null);
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [itemSold, setItemSold] = useState(false);
  const [theme, setTheme] = useState({});
  const [itemUnavailable, setItemUnavailable] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const { toast } = useToast();

  // Prevent browser auto-scroll/scroll restoration on mount (especially mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return () => {
        window.history.scrollRestoration = prev || 'auto';
      };
    }
  }, []);

  useEffect(() => {
    // Load item data on mount
    loadItem();
    trackItemView();
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Error parsing theme:', error);
      }
    }
  }, [id]);

  // Real-time availability check - polls every 5 seconds
  useEffect(() => {
    if (!id) return;

    const checkAvailability = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('status, reserved_until')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setAvailabilityStatus(data.status || 'available');
          
          // Check if item is no longer available
          if (data.status === 'sold' || data.status === 'pending_payment') {
            setItemUnavailable(true);
            if (data.status === 'sold') {
              toast({
                title: "Item Sold",
                description: "This item was just sold to another buyer.",
                variant: "destructive"
              });
            }
          } else if (data.status === 'reserved') {
            // Check if reservation has expired
            const reservedUntil = new Date(data.reserved_until);
            if (reservedUntil < new Date()) {
              // Reservation expired, should be cleaned up
              setAvailabilityStatus('available');
              setItemUnavailable(false);
            } else {
              setItemUnavailable(true);
            }
          } else {
            setItemUnavailable(false);
          }
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    };

    // Initial check
    checkAvailability();

    // Poll every 5 seconds
    const interval = setInterval(checkAvailability, 5000);

    return () => clearInterval(interval);
  }, [id, toast]);

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

  const handleAcceptOffer = (acceptedAmount) => {
    // Set the negotiated price and mark offer as accepted
    // This will replace "Buy Now" button with "Accept Offer $X" button
    setNegotiatedPrice(acceptedAmount);
    setOfferAccepted(true);
    
    toast({
      title: "Offer Accepted!",
      description: `Click "Accept Offer $${acceptedAmount.toFixed(2)}" to proceed to checkout`,
    });
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImage < validImages.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
    if (isRightSwipe && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      toast({
        title: "Please Sign In",
        description: "You must be signed in to purchase items",
        variant: "destructive"
      });
      navigate(createPageUrl('SignIn'));
      return;
    }

    try {
      // Use the RPC function to create reservation (properly handles RLS)
      const { reserveItem } = await import('@/api/functions');
      const reserved = await reserveItem(item.id, 'buy_now', 10);

      if (!reserved) {
        toast({
          title: "Item Unavailable",
          description: "This item is currently reserved. Please try again later.",
          variant: "destructive"
        });
        return;
      }

      // Navigate to cart with asking price
      navigate(createPageUrl('Cart'), {
        state: {
          items: [{
            id: item.id,
            title: item.title,
            price: item.price,
            category: item.category,
            image_urls: item.image_urls,
            seller_id: item.seller_id,
            collection_address: item.collection_address,
            collection_date: item.collection_date
          }]
        }
      });

    } catch (error) {
      console.error('Error handling buy now:', error);
      toast({
        title: "Error",
        description: "Failed to process purchase",
        variant: "destructive"
      });
    }
  };

  const handleAcceptOfferCheckout = async () => {
    if (!currentUser) {
      toast({
        title: "Please Sign In",
        description: "You must be signed in to purchase items",
        variant: "destructive"
      });
      navigate(createPageUrl('SignIn'));
      return;
    }

    try {
      // Use the RPC function to create reservation (properly handles RLS)
      const { reserveItem } = await import('@/api/functions');
      const reserved = await reserveItem(item.id, 'buy_now', 10);

      if (!reserved) {
        toast({
          title: "Item Unavailable",
          description: "This item is currently reserved. Please try again later.",
          variant: "destructive"
        });
        return;
      }

      // Navigate to cart with negotiated price
      navigate(createPageUrl('Cart'), {
        state: {
          items: [{
            id: item.id,
            title: item.title,
            price: negotiatedPrice,
            category: item.category,
            image_urls: item.image_urls,
            seller_id: item.seller_id,
            collection_address: item.collection_address,
            collection_date: item.collection_date
          }]
        }
      });

    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to process offer acceptance",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 px-4 pb-4 md:px-8 md:pb-8 overflow-x-hidden" style={{ scrollBehavior: 'auto' }}>
      {/* Back Button */}
      <div className="max-w-7xl mx-auto py-2">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Marketplace'))}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
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
            <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10 overflow-hidden">
              <div 
                className="relative h-80 md:h-96 lg:h-[500px] cursor-pointer"
                onClick={() => setIsImageFullscreen(true)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  src={primaryImage}
                  alt={item.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";
                  }}
                />
                
                {/* Navigation Controls - Only show if multiple images */}
                {validImages.length > 1 && (
                  <>
                    {/* Previous Image Button */}
                    {selectedImage > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(selectedImage - 1);
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}

                    {/* Next Image Button */}
                    {selectedImage < validImages.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(selectedImage + 1);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center backdrop-blur-sm"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/90 text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-600">
                      {selectedImage + 1} / {validImages.length}
                    </div>
                  </>
                )}

                {item.price === 0 && (
                  <Badge className="absolute top-4 right-4 bg-lime-500 text-black font-bold text-lg px-4 py-2">
                    Free
                  </Badge>
                )}
              </div>
            
              {/* Thumbnail Gallery */}
              {validImages.length > 1 && (
                <div className="p-3 bg-gray-800/50 border-t border-gray-700">
                  <div className="flex gap-2 overflow-x-auto">
                    {validImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-pink-500 scale-105'
                            : 'border-gray-700 hover:border-gray-700'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${item.title} ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Title Card */}
            <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
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
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
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

            {/* Urgency Indicators - Real-time activity */}
            <UrgencyIndicators 
              itemId={item.id} 
              viewCount={item.view_count || 0}
            />

            {/* Price, Condition, Category Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Price Card */}
              <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Price</div>
                  <div className="text-xl md:text-2xl font-bold text-cyan-400">
                    {item.price === 0 ? 'Free' : `$${item.price}`}
                  </div>
                </CardContent>
              </Card>

              {/* Condition Card */}
              <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Condition</div>
                  <Badge variant="secondary" className="capitalize bg-blue-900/50 text-blue-300 border-blue-700">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>

              {/* Category Card */}
              <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Category</div>
                  <Badge variant="outline" className="capitalize bg-purple-900/50 text-purple-300 border-purple-700">
                    {item.category?.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Description Card */}
            <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
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
              onAcceptOffer={handleAcceptOffer}
            />
          ) : isOwner ? (
            <Card className="bg-gray-800/50 border-gray-800">
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
                        className="bg-gray-800 border-gray-700 text-white"
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
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
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
            <Card className="bg-gray-800/50 border-gray-800 p-6 text-center">
              <p className="text-gray-400">
                AI Assistant not available for this item
              </p>
            </Card>
          )}

          {/* Action Buttons - Below AI Agent - Hide when offer is accepted */}
          {!offerAccepted && (
            <div className="space-y-2">
              {/* Availability Status Badge */}
              {itemUnavailable && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-800">
                  <p className="text-red-200 text-sm font-semibold">
                    {availabilityStatus === 'sold' && '❌ This item has been sold'}
                    {availabilityStatus === 'reserved' && '⏱️ This item is currently reserved'}
                    {availabilityStatus === 'pending_payment' && '💳 Payment is being processed'}
                  </p>
                  {availabilityStatus === 'sold' && (
                    <Button
                      variant="outline"
                      className="w-full mt-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => {
                        // TODO: Implement "Notify Me" feature
                        toast({
                          title: "Coming Soon",
                          description: "We'll notify you when similar items are listed!"
                        });
                      }}
                    >
                      🔔 Notify Me When Similar Items Are Listed
                    </Button>
                  )}
                </div>
              )}

              {/* Buy Now / Accept Offer / Sold Button */}
              {itemSold ? (
                <Button
                  disabled
                  className="w-full h-10 md:h-12 bg-gray-600 text-white font-semibold text-sm md:text-base rounded-lg cursor-not-allowed"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Sold
                </Button>
              ) : offerAccepted && negotiatedPrice ? (
                <Button
                  onClick={handleAcceptOfferCheckout}
                  disabled={itemUnavailable}
                  className={`w-full h-10 md:h-12 text-white font-semibold text-sm md:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                    itemUnavailable ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={
                    !itemUnavailable
                      ? {
                          background: `linear-gradient(to right, ${theme?.buyNowFrom || '#10b981'}, ${theme?.buyNowTo || '#059669'})`,
                          animation: 'subtle-pulse 3s ease-in-out infinite'
                        }
                      : undefined
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Accept Offer ${negotiatedPrice.toFixed(2)}
                </Button>
              ) : (
                <Button
                  onClick={handleBuyNow}
                  disabled={itemUnavailable}
                  className={`w-full h-10 md:h-12 text-white font-semibold text-sm md:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                    itemUnavailable ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={
                    !itemUnavailable
                      ? {
                          background: `linear-gradient(to right, ${theme?.buyNowFrom || '#10b981'}, ${theme?.buyNowTo || '#059669'})`,
                          animation: 'subtle-pulse 3s ease-in-out infinite'
                        }
                      : undefined
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {item.price === 0 ? 'Claim' : 'Buy Now'}
                </Button>
              )}

              {/* Propose Trade Button - Only show if not owner */}
              {!isOwner && currentUser && item.price > 0 && (
                <Button
                  onClick={() => setShowTradeModal(true)}
                  disabled={itemUnavailable}
                  variant="outline"
                  className="w-full h-10 text-sm md:text-base bg-gray-800 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Propose Trade
                </Button>
              )}
            </div>
          )}

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
            <Card className="bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
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

      {/* Special Offers Section */}
      {seller && (
        <SpecialOffersSection itemId={item.id} sellerId={seller.id} />
      )}

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
          negotiatedPrice={negotiatedPrice}
          onClose={() => {
            setShowPurchaseModal(false);
            setNegotiatedPrice(null); // Reset negotiated price when closing
          }}
        />
      )}

      {/* Propose Trade Modal */}
      {showTradeModal && currentUser && (
        <ProposeTradeModal
          targetItem={item}
          currentUserId={currentUser.id}
          onClose={() => setShowTradeModal(false)}
          onSuccess={() => {
            toast({
              title: "Trade Offer Sent!",
              description: "Your trade offer has been sent successfully."
            });
            setShowTradeModal(false);
          }}
        />
      )}

      {/* Fullscreen Image Modal */}
      {isImageFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsImageFullscreen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-3 transition-all"
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
              className="absolute left-4 z-10 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-3 transition-all"
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
              className="absolute right-4 z-10 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-3 transition-all"
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm">
              {selectedImage + 1} / {validImages.length}
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
