import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, MapPin, Tag, Calendar, Star, Share2, Bot, Settings } from 'lucide-react';
import { Item } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import AgentChat from '@/components/agent/AgentChat';
import { createPageUrl } from '@/utils';
import PurchaseModal from '@/components/marketplace/PurchaseModal';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
    loadItem();
  }, [id]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-4 md:p-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
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
        {/* Mobile-First Layout: Image, Price, and Key Info Above Fold */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Image - Optimized for mobile */}
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="aspect-[4/3] md:aspect-[16/10] relative">
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
              <div className="p-4 bg-gray-950/50 border-t border-gray-800">
                <div className="flex gap-2 overflow-x-auto">
                  {validImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? 'border-pink-500 scale-105'
                          : 'border-gray-700 hover:border-gray-600'
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

            {/* Compact Item Details - Above the fold on mobile */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 space-y-4">
                {/* Title and Price - Most Important Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{item.title}</h1>
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-gray-400 hover:text-white"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Price and Condition - Prominent Display */}
                <div className="flex items-center justify-between">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-400">
                    {item.price === 0 ? 'Free' : `$${item.price}`}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {item.condition?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      <Tag className="w-3 h-3 mr-1" />
                      {item.category?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Description - Compact */}
                <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-3">
                  {item.description}
                </p>

                {/* Tags - Compact */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-gray-400">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs text-gray-400">
                        +{item.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        {/* Right Column - Buy Now, Seller Info, and AI Agent Chat */}
        <div className="lg:col-span-1 space-y-4">
          {/* Action Button - Prominent */}
          <Button
            onClick={() => setShowPurchaseModal(true)}
            className="w-full h-12 md:h-14 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white font-bold text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {item.price === 0 ? 'Claim This Item' : 'Buy Now'}
          </Button>

          {/* Seller Info - Compact */}
          {seller && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3 text-sm">Seller Information</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{seller.full_name}</div>
                    {seller.rating_count > 0 && (
                      <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>{seller.average_rating?.toFixed(1)} ({seller.rating_count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Agent Chat - Below Buy Now and Seller Info */}
          {hasAgentEnabled ? (
            <AgentChat
              itemId={item.id}
              itemTitle={item.title}
              itemPrice={item.price}
            />
          ) : isOwner ? (
            <Card className="bg-gray-900/50 border-gray-800">
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
            <Card className="bg-gray-900/50 border-gray-800 p-6 text-center">
              <p className="text-gray-400">
                AI Assistant not available for this item
              </p>
            </Card>
          )}
        </div>
      </div>
      
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          item={item}
          seller={seller}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
    </div>
  );
}
