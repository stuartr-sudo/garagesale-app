import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, MapPin, Tag, Calendar, Star, Share2 } from 'lucide-react';
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

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    setLoading(true);
    try {
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

      // Get seller
      if (itemData.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', itemData.seller_id)
          .single();

        setSeller(sellerData);
      }

      // Check if agent is enabled
      const { data: knowledge } = await supabase
        .from('item_knowledge')
        .select('negotiation_enabled')
        .eq('item_id', id)
        .single();

      setHasAgentEnabled(knowledge?.negotiation_enabled === true);

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
  const primaryImage = images[selectedImage] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800";

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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="aspect-[4/3] relative">
              <img
                src={primaryImage}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.price === 0 && (
                <Badge className="absolute top-4 right-4 bg-lime-500 text-black font-bold text-lg px-4 py-2">
                  Free
                </Badge>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="p-4 bg-gray-950/50 border-t border-gray-800">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
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

          {/* Item Details */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{item.title}</h1>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
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

                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl font-bold text-cyan-400">
                    {item.price === 0 ? 'Free' : `$${item.price}`}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    <Tag className="w-3 h-3 mr-1" />
                    {item.category?.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-gray-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Seller Info */}
              {seller && (
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="font-semibold text-white mb-3">Seller Information</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{seller.full_name}</div>
                      {seller.rating_count > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm mt-1">
                          <Star className="w-4 h-4 fill-yellow-400" />
                          <span>{seller.average_rating?.toFixed(1)} ({seller.rating_count} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-800 pt-6">
                <Button
                  onClick={() => setShowPurchaseModal(true)}
                  className="w-full h-14 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {item.price === 0 ? 'Claim This Item' : 'Buy Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Agent Chat */}
        <div className="lg:col-span-1">
          {hasAgentEnabled ? (
            <div className="sticky top-8">
              <AgentChat
                itemId={item.id}
                itemTitle={item.title}
                itemPrice={item.price}
              />
            </div>
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
  );
}

