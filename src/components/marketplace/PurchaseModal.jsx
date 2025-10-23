import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User
} from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { reserveItem, releaseItemReservation } from "@/api/functions";
import PaymentWizard from "@/components/payment/PaymentWizard";

export default function PurchaseModal({ item, seller, onClose, onSuccess, negotiatedPrice = null }) {
  const [showPaymentWizard, setShowPaymentWizard] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isReserved, setIsReserved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    reserveItemForPurchase();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const reserveItemForPurchase = async () => {
    try {
      const reserved = await reserveItem(item.id, 'buy_now', 10); // 10 minutes
      if (reserved) {
        setIsReserved(true);
        toast({
          title: "Item Reserved",
          description: "This item has been reserved for you for 10 minutes."
        });
      } else {
        toast({
          title: "Item Not Available",
          description: "This item is currently being processed by another user.",
          variant: "destructive"
        });
        onClose();
      }
    } catch (error) {
      console.error('Error reserving item:', error);
      toast({
        title: "Error",
        description: "Failed to reserve item for purchase.",
        variant: "destructive"
      });
      onClose();
    }
  };

  // Cleanup reservation when modal closes
  useEffect(() => {
    return () => {
      if (isReserved) {
        releaseItemReservation(item.id).catch(console.error);
      }
    };
  }, [isReserved, item.id]);

  const handleStartPayment = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to make a purchase.",
        variant: "destructive"
      });
      return;
    }
    setShowPaymentWizard(true);
  };

  const handlePaymentComplete = (transaction) => {
      toast({
      title: "Payment Successful!",
      description: "Your payment has been processed successfully.",
    });
    onSuccess(transaction);
    onClose();
  };

  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
  const displayPrice = negotiatedPrice ? parseFloat(negotiatedPrice) : parseFloat(item.price);

  return (
    <>
      {/* Simple Purchase Confirmation */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800 rounded-2xl w-full max-w-md">
          <div className="p-6">
            <div className="text-center mb-6">
              <Package className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Confirm Purchase</h2>
              <p className="text-gray-400">Ready to buy this item?</p>
            </div>

            {/* Item Summary */}
            <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <img
                src={primaryImage}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                }}
              />
              <div className="flex-1">
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-cyan-900/50 text-cyan-300 border-cyan-700 text-xs">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                  {item.location && (
                    <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 flex items-center gap-1 text-xs">
                      <MapPin className="w-2 h-2" />
                      {item.location}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                  <div className="text-sm text-gray-400">Price</div>
                  <div className="text-xl font-bold text-cyan-400">
                    ${displayPrice.toFixed(2)}
                  {negotiatedPrice && (
                    <div className="text-xs text-green-400">Negotiated</div>
                  )}
                </div>
              </div>
            </div>
          </div>

            {/* Seller Info */}
            <div className="bg-gray-800/30 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Seller:</span>
                <span className="text-white font-medium">{seller?.full_name || 'Unknown'}</span>
              </div>
              </div>

            {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl bg-gray-800 border-2 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-500"
                >
                  Cancel
                </Button>
                <Button
                onClick={handleStartPayment}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold"
                >
                <Package className="w-4 h-4 mr-2" />
                Buy Now
                </Button>
              </div>
                      </div>
                    </div>
                  </div>

      {/* Payment Wizard */}
      {showPaymentWizard && (
        <PaymentWizard
          item={{
            ...item,
            price: displayPrice,
            collection_date: item.collection_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
            collection_address: item.collection_address || seller?.location || 'To be arranged with seller'
          }}
          seller={seller}
          onComplete={handlePaymentComplete}
          onClose={() => setShowPaymentWizard(false)}
        />
      )}
    </>
  );
}
