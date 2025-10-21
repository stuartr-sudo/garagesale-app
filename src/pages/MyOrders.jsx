import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  Building2,
  Hash
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserEntity } from '@/api/entities';
import { useToast } from '@/hooks/use-toast';

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState('buying');
  const [buyingOrders, setBuyingOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState({});
  const [collectionDetails, setCollectionDetails] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);

      // Load buying orders
      const { data: buying, error: buyingError } = await supabase
        .from('orders')
        .select(`
          *,
          item:items(*),
          seller:seller_id(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (buyingError) throw buyingError;
      setBuyingOrders(buying || []);

      // Load selling orders
      const { data: selling, error: sellingError } = await supabase
        .from('orders')
        .select(`
          *,
          item:items(*),
          buyer:buyer_id(*)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (sellingError) throw sellingError;
      setSellingOrders(selling || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerConfirmPayment = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'payment_confirmed',
          seller_confirmed_payment_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Payment Confirmed!",
        description: "Buyer has been notified"
      });

      loadData();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive"
      });
    }
  };

  const handleAddCollectionDetails = async (orderId) => {
    const details = collectionDetails[orderId];
    if (!details?.address || !details?.date) {
      toast({
        title: "Missing Information",
        description: "Please provide collection address and date",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'collected',
          collection_address: details.address,
          collection_date: details.date,
          collection_time_start: details.timeStart || null,
          collection_time_end: details.timeEnd || null
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Collection Details Added!",
        description: "Buyer has been notified"
      });

      setCollectionDetails(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      loadData();
    } catch (error) {
      console.error('Error adding collection details:', error);
      toast({
        title: "Error",
        description: "Failed to add collection details",
        variant: "destructive"
      });
    }
  };

  const handleAddTracking = async (orderId) => {
    const tracking = trackingNumber[orderId];
    if (!tracking?.trim()) {
      toast({
        title: "Missing Tracking Number",
        description: "Please enter a tracking number",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: tracking
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Tracking Added!",
        description: "Buyer has been notified"
      });

      setTrackingNumber(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      loadData();
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast({
        title: "Error",
        description: "Failed to add tracking number",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      awaiting_payment: { color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700', icon: Clock, text: 'Awaiting Payment' },
      payment_pending_seller_confirmation: { color: 'bg-orange-900/50 text-orange-300 border-orange-700', icon: AlertCircle, text: 'Pending Confirmation' },
      payment_confirmed: { color: 'bg-green-900/50 text-green-300 border-green-700', icon: CheckCircle, text: 'Payment Confirmed' },
      shipped: { color: 'bg-blue-900/50 text-blue-300 border-blue-700', icon: Truck, text: 'Shipped' },
      delivered: { color: 'bg-cyan-900/50 text-cyan-300 border-cyan-700', icon: CheckCircle, text: 'Delivered' },
      collected: { color: 'bg-purple-900/50 text-purple-300 border-purple-700', icon: MapPin, text: 'Collected' },
      expired: { color: 'bg-red-900/50 text-red-300 border-red-700', icon: AlertCircle, text: 'Expired' },
      cancelled: { color: 'bg-gray-700 text-gray-300 border-gray-600', icon: AlertCircle, text: 'Cancelled' },
    };

    const { color, icon: Icon, text } = config[status] || config.awaiting_payment;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  const OrderCard = ({ order, isSeller }) => {
    const otherParty = isSeller ? order.buyer : order.seller;
    const primaryImage = order.item?.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";

    return (
      <Card className="card-gradient card-glow rounded-xl overflow-hidden transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Item Image */}
            <img
              src={primaryImage}
              alt={order.item?.title}
              className="w-24 h-24 object-cover rounded-lg"
            />

            {/* Order Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-white">{order.item?.title}</h3>
                  <p className="text-sm text-gray-400">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-400">{isSeller ? 'Buyer' : 'Seller'}</div>
                  <div className="text-white font-semibold">{otherParty?.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Amount</div>
                  <div className="text-cyan-400 font-bold text-xl">${order.total_amount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Delivery</div>
                  <div className="text-white flex items-center gap-1">
                    {order.delivery_method === 'collect' ? (
                      <><MapPin className="w-4 h-4" /> Collect</>
                    ) : (
                      <><Truck className="w-4 h-4" /> Ship</>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Created</div>
                  <div className="text-white">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Seller Actions */}
              {isSeller && order.status === 'payment_pending_seller_confirmation' && (
                <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-200">Action Required</h4>
                      <p className="text-sm text-orange-100">Check your bank account for payment with reference: <span className="font-mono font-bold">ORDER-{order.id.slice(0, 8).toUpperCase()}</span></p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSellerConfirmPayment(order.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment Received
                  </Button>
                </div>
              )}

              {/* Collection Details */}
              {isSeller && order.status === 'payment_confirmed' && order.delivery_method === 'collect' && (
                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg space-y-3">
                  <h4 className="font-semibold text-purple-200">Add Collection Details</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-gray-300">Collection Address *</Label>
                      <Input
                        value={collectionDetails[order.id]?.address || ''}
                        onChange={(e) => setCollectionDetails(prev => ({
                          ...prev,
                          [order.id]: { ...prev[order.id], address: e.target.value }
                        }))}
                        placeholder="Enter pickup address"
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-gray-300">Date *</Label>
                        <Input
                          type="date"
                          value={collectionDetails[order.id]?.date || ''}
                          onChange={(e) => setCollectionDetails(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], date: e.target.value }
                          }))}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Time From</Label>
                        <Input
                          type="time"
                          value={collectionDetails[order.id]?.timeStart || ''}
                          onChange={(e) => setCollectionDetails(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], timeStart: e.target.value }
                          }))}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Time To</Label>
                        <Input
                          type="time"
                          value={collectionDetails[order.id]?.timeEnd || ''}
                          onChange={(e) => setCollectionDetails(prev => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], timeEnd: e.target.value }
                          }))}
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddCollectionDetails(order.id)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Save Collection Details
                  </Button>
                </div>
              )}

              {/* Shipping Tracking */}
              {isSeller && order.status === 'payment_confirmed' && order.delivery_method === 'ship' && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg space-y-3">
                  <h4 className="font-semibold text-blue-200">Add Tracking Number</h4>
                  <div className="flex gap-2">
                    <Input
                      value={trackingNumber[order.id] || ''}
                      onChange={(e) => setTrackingNumber(prev => ({
                        ...prev,
                        [order.id]: e.target.value
                      }))}
                      placeholder="Enter tracking number"
                      className="flex-1 bg-gray-900 border-gray-700 text-white"
                    />
                    <Button
                      onClick={() => handleAddTracking(order.id)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Parcel Posted
                    </Button>
                  </div>
                </div>
              )}

              {/* Buyer View - Collection Details */}
              {!isSeller && order.status === 'collected' && (
                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <h4 className="font-semibold text-purple-200 mb-2">Collection Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-400">Address</div>
                        <div className="text-white">{order.collection_address}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-400">Date & Time</div>
                        <div className="text-white">
                          {new Date(order.collection_date).toLocaleDateString()}
                          {order.collection_time_start && ` ${order.collection_time_start}`}
                          {order.collection_time_end && ` - ${order.collection_time_end}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer View - Tracking */}
              {!isSeller && order.tracking_number && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-200 mb-2">Tracking Information</h4>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-gray-400">Tracking Number</div>
                      <div className="text-white font-mono font-semibold">{order.tracking_number}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Orders</h1>
          <p className="text-gray-400">Track your purchases and sales</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-cyan-500/20">
            <TabsTrigger value="buying" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Package className="w-4 h-4 mr-2" />
              I'm Buying ({buyingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="selling" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Building2 className="w-4 h-4 mr-2" />
              I'm Selling ({sellingOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buying" className="space-y-4">
            {buyingOrders.length === 0 ? (
              <Card className="card-gradient card-glow p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No purchases yet</h3>
                <p className="text-gray-400">Items you buy will appear here</p>
              </Card>
            ) : (
              buyingOrders.map(order => (
                <OrderCard key={order.id} order={order} isSeller={false} />
              ))
            )}
          </TabsContent>

          <TabsContent value="selling" className="space-y-4">
            {sellingOrders.length === 0 ? (
              <Card className="card-gradient card-glow p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No sales yet</h3>
                <p className="text-gray-400">Items you sell will appear here</p>
              </Card>
            ) : (
              sellingOrders.map(order => (
                <OrderCard key={order.id} order={order} isSeller={true} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

