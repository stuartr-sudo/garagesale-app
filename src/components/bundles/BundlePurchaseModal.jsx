import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BundleImageCollage from './BundleImageCollage';
import { 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  Calendar, 
  MapPin,
  X,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import PaymentWizard from '@/components/payment/PaymentWizard';

export default function BundlePurchaseModal({ 
  bundle, 
  onClose, 
  onSuccess 
}) {
  const [showPaymentWizard, setShowPaymentWizard] = useState(false);

  const formatCollectionDate = (dateString) => {
    if (!dateString) return 'To be arranged';
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  };

  const handleBuyNow = () => {
    setShowPaymentWizard(true);
  };

  const handlePaymentComplete = (transaction) => {
    onSuccess(transaction);
    onClose();
  };

  if (showPaymentWizard) {
    return (
      <PaymentWizard
        item={{
          id: bundle.id,
          title: bundle.title,
          description: bundle.description,
          price: bundle.bundle_price,
          image_urls: bundle.bundle_items?.[0]?.items?.image_urls || [],
          collection_date: bundle.collection_date,
          collection_address: bundle.collection_address,
          is_bundle: true,
          bundle_items: bundle.bundle_items
        }}
        seller={{
          id: bundle.seller_id,
          full_name: bundle.seller?.full_name,
          email: bundle.seller?.email
        }}
        onComplete={handlePaymentComplete}
        onClose={() => setShowPaymentWizard(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Bundle Details
            </CardTitle>
            <Button
              onClick={onClose}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Bundle Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{bundle.title}</h2>
              <p className="text-gray-400">{bundle.description}</p>
            </div>

            {/* Bundle Image Collage */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Bundle Preview</h3>
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <BundleImageCollage 
                    bundleItems={bundle.bundle_items} 
                    maxImages={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Bundle Pricing</h3>
                  <Badge className="bg-green-500 text-white">
                    <Percent className="w-3 h-3 mr-1" />
                    {bundle.savings_percentage}% OFF
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Individual Total:</span>
                    <span className="text-gray-400 line-through">${parseFloat(bundle.individual_total).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bundle Price:</span>
                    <span className="text-white font-bold text-xl">${parseFloat(bundle.bundle_price).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="text-green-400 font-semibold">You Save:</span>
                    <span className="text-green-400 font-bold">
                      ${parseFloat(bundle.savings).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collection Details */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Collection Details</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <Label className="text-xs font-medium text-gray-300">Collection Date</Label>
                      <p className="text-white text-sm">
                        {formatCollectionDate(bundle.collection_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <Label className="text-xs font-medium text-gray-300">Collection Address</Label>
                      <p className="text-white text-sm">
                        {bundle.collection_address || 'Address to be provided by seller'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items in Bundle */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Items in this Bundle ({bundle.bundle_items?.length || 0})
                </h3>
                
                <div className="space-y-3">
                  {bundle.bundle_items?.map((bundleItem, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <img
                        src={bundleItem.items?.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"}
                        alt={bundleItem.items?.title}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                        }}
                      />
                      
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{bundleItem.items?.title}</h4>
                        <p className="text-gray-400 text-sm">{bundleItem.items?.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 text-xs">
                            {bundleItem.items?.condition?.replace('_', ' ')}
                          </Badge>
                          {bundleItem.quantity > 1 && (
                            <Badge className="bg-gray-600 text-gray-300 text-xs">
                              Qty: {bundleItem.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          ${parseFloat(bundleItem.items?.price || 0).toFixed(2)}
                        </div>
                        {bundleItem.quantity > 1 && (
                          <div className="text-gray-400 text-xs">
                            Total: ${(parseFloat(bundleItem.items?.price || 0) * bundleItem.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="bg-green-900/20 border-green-700">
              <CardContent className="p-4">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Bundle Benefits
                </h3>
                <ul className="text-green-200 text-sm space-y-1">
                  <li>• Save ${parseFloat(bundle.savings).toFixed(2)} compared to buying individually</li>
                  <li>• All items from the same seller for easy collection</li>
                  <li>• One transaction for multiple items</li>
                  <li>• Perfect for themed collections or related items</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        
        <div className="flex-shrink-0 p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleBuyNow}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Bundle - ${parseFloat(bundle.bundle_price).toFixed(2)}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
