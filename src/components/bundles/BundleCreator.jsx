import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Minus, 
  DollarSign, 
  Percent, 
  Calendar, 
  MapPin,
  X,
  ShoppingCart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function BundleCreator({ 
  sellerId,
  onClose,
  onSuccess
}) {
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bundleData, setBundleData] = useState({
    title: '',
    description: '',
    bundlePrice: '',
    collectionDate: '',
    collectionAddress: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableItems();
  }, [sellerId]);

  const fetchAvailableItems = async () => {
    try {
      // Use the existing Item entity to fetch items
      const { Item } = await import('@/api/entities');
      const items = await Item.filter({ 
        seller_id: sellerId, 
        status: 'active' 
      }, '-created_at');
      
      setAvailableItems(items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load your items.",
        variant: "destructive"
      });
    }
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const calculateTotals = () => {
    const individualTotal = selectedItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const bundlePrice = parseFloat(bundleData.bundlePrice) || 0;
    const savings = individualTotal - bundlePrice;
    const savingsPercentage = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

    return {
      individualTotal,
      bundlePrice,
      savings,
      savingsPercentage
    };
  };

  const handleCreateBundle = async () => {
    console.log('🔧 BundleCreator Debug:', {
      selectedItems: selectedItems.length,
      title: bundleData.title,
      bundlePrice: bundleData.bundlePrice,
      isCreating
    });

    if (selectedItems.length < 2) {
      console.log('❌ Not enough items selected:', selectedItems.length);
      toast({
        title: "Invalid Bundle",
        description: "Please select at least 2 items for the bundle.",
        variant: "destructive"
      });
      return;
    }

    if (!bundleData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a bundle title.",
        variant: "destructive"
      });
      return;
    }

    if (!bundleData.bundlePrice || parseFloat(bundleData.bundlePrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid bundle price.",
        variant: "destructive"
      });
      return;
    }

    const { individualTotal, bundlePrice, savings } = calculateTotals();

    if (savings <= 0) {
      toast({
        title: "Invalid Bundle Price",
        description: "Bundle price must be less than the sum of individual item prices.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId,
          title: bundleData.title,
          description: bundleData.description,
          bundlePrice: bundleData.bundlePrice,
          itemIds: selectedItems.map(item => item.id),
          collectionDate: bundleData.collectionDate,
          collectionAddress: bundleData.collectionAddress
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Bundle Created!",
          description: "Your bundle has been created successfully.",
        });
        onSuccess(data.bundle);
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create bundle.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to create bundle. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const { individualTotal, bundlePrice, savings, savingsPercentage } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border border-gray-800 rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gray-800/50 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Package className="w-5 h-5" />
              Create Bundle
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Bundle Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bundle Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Bundle Title *</Label>
                    <Input
                      id="title"
                      value={bundleData.title}
                      onChange={(e) => setBundleData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Kitchen Essentials Bundle"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={bundleData.description}
                      onChange={(e) => setBundleData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what's included in this bundle..."
                      rows={3}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bundlePrice" className="text-gray-300">Bundle Price (AUD) *</Label>
                    <Input
                      id="bundlePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={bundleData.bundlePrice}
                      onChange={(e) => setBundleData(prev => ({ ...prev, bundlePrice: e.target.value }))}
                      placeholder="0.00"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="collectionDate" className="text-gray-300">Collection Date</Label>
                    <Input
                      id="collectionDate"
                      type="datetime-local"
                      value={bundleData.collectionDate}
                      onChange={(e) => setBundleData(prev => ({ ...prev, collectionDate: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="collectionAddress" className="text-gray-300">Collection Address</Label>
                    <Textarea
                      id="collectionAddress"
                      value={bundleData.collectionAddress}
                      onChange={(e) => setBundleData(prev => ({ ...prev, collectionAddress: e.target.value }))}
                      placeholder="Enter collection address..."
                      rows={2}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Item Selection */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Select Items</h3>
                
                {availableItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No active items available for bundling</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableItems.map((item) => {
                      const isSelected = selectedItems.find(selected => selected.id === item.id);
                      const primaryImage = item.image_urls?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                      
                      return (
                        <Card
                          key={item.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'border-green-500 bg-green-900/20' 
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          onClick={() => toggleItemSelection(item)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={!!isSelected}
                                onChange={() => toggleItemSelection(item)}
                                className="w-4 h-4"
                              />
                              
                              <img
                                src={primaryImage}
                                alt={item.title}
                                className="w-12 h-12 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop";
                                }}
                              />
                              
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">{item.title}</h4>
                                <p className="text-gray-400 text-xs line-clamp-1">{item.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-blue-900/50 text-blue-300 border-blue-700 text-xs">
                                    {item.condition?.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-white font-bold">${parseFloat(item.price).toFixed(2)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bundle Summary */}
              {selectedItems.length > 0 && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Bundle Summary
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Individual Total:</span>
                        <span className="text-white">${individualTotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Bundle Price:</span>
                        <span className="text-white font-bold">${bundlePrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">You Save:</span>
                        <span className="text-green-400 font-bold">
                          ${savings.toFixed(2)} ({savingsPercentage}%)
                        </span>
                      </div>
                    </div>

                    {savings <= 0 && bundlePrice > 0 && (
                      <div className="mt-3 p-2 bg-red-900/20 border border-red-700 rounded text-red-300 text-xs">
                        Bundle price must be less than individual total to offer savings
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
        
        <div className="flex-shrink-0 p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-between">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl"
            >
              Cancel
            </Button>
            
            <Button
              onClick={() => {
                console.log('🔧 Button clicked!', {
                  selectedItems: selectedItems.length,
                  title: bundleData.title,
                  bundlePrice: bundleData.bundlePrice,
                  isCreating,
                  disabled: selectedItems.length < 2 || !bundleData.title.trim() || isCreating
                });
                handleCreateBundle();
              }}
              disabled={selectedItems.length < 2 || !bundleData.title.trim() || isCreating}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Bundle...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bundle
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default BundleCreator;
