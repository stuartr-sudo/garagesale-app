import React, { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Package, 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle, 
  CreditCard,
  AlertCircle,
  Building2,
  Hash,
  User
} from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { reserveItem, releaseItemReservation } from "@/api/functions";

export default function PurchaseModal({ item, seller, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=confirm, 2=delivery, 3=payment, 4=waiting
  const [deliveryMethod, setDeliveryMethod] = useState("collect");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCost, setShippingCost] = useState(15.00);
  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    // Reserve the item when modal opens
    reserveItemForPurchase();
  }, []);

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

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const loadCurrentUser = async () => {
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const handleTimeExpired = async () => {
    toast({
      title: "Time Expired",
      description: "Your payment window has expired. The item is available for sale again.",
      variant: "destructive"
    });
    
    // Release reservation
    if (isReserved) {
      try {
        await releaseItemReservation(item.id);
      } catch (error) {
        console.error('Error releasing reservation:', error);
      }
    }
    
    // Update order status to expired
    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'expired' })
        .eq('id', orderId);
    }
    
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalPrice = () => {
    const basePrice = parseFloat(item.price);
    return deliveryMethod === 'ship' ? basePrice + shippingCost : basePrice;
  };

  const handleConfirmPurchase = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to make a purchase.",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handleDeliveryConfirm = async () => {
    if (deliveryMethod === 'ship' && !shippingAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your shipping address.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create order in database
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          item_id: item.id,
          buyer_id: currentUser.id,
          seller_id: seller.id,
          total_amount: getTotalPrice(),
          delivery_method: deliveryMethod,
          shipping_address: deliveryMethod === 'ship' ? shippingAddress : null,
          shipping_cost: deliveryMethod === 'ship' ? shippingCost : 0,
          status: 'awaiting_payment',
          payment_deadline: new Date(Date.now() + 600000).toISOString() // 10 minutes from now
        })
        .select()
        .single();

      if (error) throw error;

      setOrderId(order.id);
      setTimerActive(true);
      setStep(3);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'payment_pending_seller_confirmation',
          buyer_confirmed_payment_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      setTimerActive(false);
      setStep(4);
      
      toast({
        title: "Payment Confirmed!",
        description: "Waiting for seller to verify payment...",
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto modal-glow card-gradient">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Package className="w-6 h-6 text-cyan-400" />
            {step === 1 && "Confirm Purchase"}
            {step === 2 && "Delivery Method"}
            {step === 3 && "Payment Details"}
            {step === 4 && "Awaiting Confirmation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer (visible in steps 3 and 4) */}
          {timerActive && step >= 3 && (
            <div className="bg-orange-900/30 border-2 border-orange-500/50 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400 animate-pulse" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-200">Payment Window</h4>
                <p className="text-sm text-orange-300">
                  Complete payment within: <span className="font-mono text-xl font-bold text-orange-400">{formatTime(timeRemaining)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Item Summary (always visible) */}
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex gap-4">
              <img
                src={primaryImage}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                }}
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-cyan-900/50 text-cyan-300 border-cyan-700">
                    {item.condition?.replace('_', ' ')}
                  </Badge>
                  {item.location && (
                    <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Price</div>
                <div className="text-2xl font-bold text-cyan-400">${item.price}</div>
              </div>
            </div>
          </div>

          {/* Step 1: Confirm Purchase */}
          {step === 1 && (
            <>
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to purchase?</h3>
                <p className="text-gray-300">
                  You're about to purchase <span className="font-semibold text-cyan-400">{item.title}</span> from {seller?.full_name || 'seller'}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl bg-gray-800 border-2 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-500"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold"
                >
                  Confirm Deal
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Delivery Method */}
          {step === 2 && (
            <>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="space-y-3">
                  {/* Collect Option */}
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      deliveryMethod === 'collect' 
                        ? 'border-cyan-500 bg-cyan-900/20' 
                        : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                    }`}
                    onClick={() => setDeliveryMethod('collect')}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="collect" id="collect" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="collect" className="flex items-center gap-2 text-lg font-semibold text-white cursor-pointer">
                          <MapPin className="w-5 h-5 text-cyan-400" />
                          Collect in Person
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Pick up from seller's location. Free delivery.
                        </p>
                        {seller?.location && (
                          <p className="text-sm text-cyan-300 mt-2">
                            Location: {seller.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">FREE</div>
                      </div>
                    </div>
                  </div>

                  {/* Ship Option */}
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      deliveryMethod === 'ship' 
                        ? 'border-cyan-500 bg-cyan-900/20' 
                        : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                    }`}
                    onClick={() => setDeliveryMethod('ship')}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="ship" id="ship" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="ship" className="flex items-center gap-2 text-lg font-semibold text-white cursor-pointer">
                          <Truck className="w-5 h-5 text-purple-400" />
                          Ship to Address
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                          Seller will ship the item to your address.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-400">${shippingCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {/* Shipping Address Input */}
              {deliveryMethod === 'ship' && (
                <div className="space-y-2 mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                  <Label htmlFor="address" className="text-white">Shipping Address *</Label>
                  <Input
                    id="address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your full shipping address"
                    className="h-12 rounded-xl bg-gray-900 border-gray-800 text-white"
                    required
                  />
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-gray-800/50 border border-cyan-500/20 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Item Price:</span>
                    <span>${item.price}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery:</span>
                    <span className={deliveryMethod === 'collect' ? 'text-green-400' : 'text-purple-400'}>
                      {deliveryMethod === 'collect' ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total:</span>
                    <span className="text-2xl font-bold text-cyan-400">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl bg-gray-800 border-2 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-500"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDeliveryConfirm}
                  disabled={isProcessing}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold"
                >
                  {isProcessing ? "Processing..." : "Continue to Payment"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Payment Details */}
          {step === 3 && (
            <>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-yellow-200 mb-1">Important Instructions</h4>
                    <ol className="text-sm text-yellow-100 space-y-1 list-decimal list-inside">
                      <li>Transfer the exact amount to the seller's bank account below</li>
                      <li>Use the reference number to identify your payment</li>
                      <li>Return here and click "Confirm Payment" within 10 minutes</li>
                      <li>Wait for seller to verify your payment</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/40 rounded-xl p-6">
                <h4 className="font-semibold text-xl text-cyan-300 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Seller's Bank Details
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Account Name</div>
                    <div className="text-lg font-semibold text-white">{seller?.bank_account_name || 'Not provided'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">BSB</div>
                      <div className="text-lg font-mono font-semibold text-white">{seller?.bank_bsb || 'Not provided'}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Account Number</div>
                      <div className="text-lg font-mono font-semibold text-white">{seller?.bank_account_number || 'Not provided'}</div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Reference (IMPORTANT)</div>
                    <div className="text-lg font-mono font-bold text-cyan-400">ORDER-{orderId?.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Amount to Transfer</div>
                    <div className="text-3xl font-bold text-green-400">${getTotalPrice().toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold text-lg"
              >
                {isProcessing ? "Processing..." : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    I've Made the Payment - Confirm
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By confirming, you declare that you have transferred the exact amount to the seller's account using the reference number provided.
              </p>
            </>
          )}

          {/* Step 4: Awaiting Seller Confirmation */}
          {step === 4 && (
            <>
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-8 text-center">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Clock className="w-10 h-10 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h3>
                <p className="text-gray-300 mb-6">
                  Waiting for <span className="font-semibold text-cyan-400">{seller?.full_name}</span> to confirm your payment...
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 inline-block">
                  <div className="text-sm text-gray-400">Order Reference</div>
                  <div className="text-xl font-mono font-bold text-cyan-400">ORDER-{orderId?.slice(0, 8).toUpperCase()}</div>
                </div>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                <h4 className="font-semibold text-purple-200 mb-2">What happens next?</h4>
                <ul className="text-sm text-purple-100 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Seller will verify your payment in their bank account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Once confirmed, you'll receive {deliveryMethod === 'collect' ? 'collection details' : 'tracking information'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>Check your email and "My Purchases" page for updates</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={onClose}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-semibold"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
