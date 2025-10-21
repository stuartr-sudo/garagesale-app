
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, ShoppingCart, CreditCard, Lock } from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { createStripeSession } from "@/api/functions";

export default function PurchaseModal({ item, seller, onClose, onSuccess }) {
  const [buyerInfo, setBuyerInfo] = useState({
    email: "",
    phone: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);
      setBuyerInfo(prev => ({ ...prev, email: user.email }));
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const handlePurchase = async () => {
    if (!buyerInfo.email || !buyerInfo.phone) {
      alert("Please fill in your contact information");
      return;
    }

    if (!currentUser) {
      alert("Please log in to make a purchase");
      return;
    }

    setIsProcessing(true);
    try {
      // Call the backend function using the SDK import
      const { data, error } = await createStripeSession({
          item_id: item.id,
          buyer_contact: buyerInfo
      });

      if (error) {
          throw new Error(error.message || 'An unknown error occurred');
      }

      if (data && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert(`There was an error processing your purchase: ${error.message}. Please try again.`);
      setIsProcessing(false);
    }
  };

  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto modal-glow card-gradient">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Secure Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stripe Security Badge */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Secure Payment</h4>
                <p className="text-sm text-blue-700">
                  Your payment is processed securely by Stripe. Your card information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Item Summary */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex gap-4">
              <img
                src={primaryImage}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-xl"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                  {item.location && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-emerald-600 mt-3">
                  ${item.price}
                </div>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          {seller && (
            <div className="bg-blue-50 rounded-2xl p-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Seller Information
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {seller.full_name?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{seller.full_name}</p>
                  <p className="text-gray-600 text-sm">{seller.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(5)}
                    </div>
                    <span className="text-sm text-gray-600">(4.8/5)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Your Contact Information</h4>
            <p className="text-sm text-gray-600">
              The seller will use this information to contact you about pickup/delivery after payment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={buyerInfo.email}
                  onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={buyerInfo.phone}
                  onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h4 className="font-semibold text-lg text-emerald-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Item price:</span>
                <span className="font-semibold text-emerald-900">${item.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-800">Processing fee:</span>
                <span className="font-semibold text-emerald-900">$0.00</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-emerald-900">Total:</span>
                  <span className="text-2xl font-bold text-emerald-900">${item.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || !buyerInfo.email || !buyerInfo.phone}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ${item.price} with Stripe
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By clicking "Pay with Stripe", you agree to our terms of service and will be redirected to Stripe's secure payment page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
