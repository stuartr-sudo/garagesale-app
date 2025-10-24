
import React, { useState, useEffect } from "react";
import { Item } from "@/api/entities";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Rating } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Package, DollarSign, Eye, Edit, Trash2, Star, ShoppingBag, CheckSquare, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import MyItemCard from "../components/myitems/MyItemCard";
import StatsCards from "../components/myitems/StatsCards";
import RatingModal from "../components/ratings/RatingModal";
import BundleCreator from "../components/bundles/BundleCreator";
import BulkDeleteModal from "../components/inventory/BulkDeleteModal";

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [itemRatings, setItemRatings] = useState({});
  const [ratingTransaction, setRatingTransaction] = useState(null);
  const [showBundleCreator, setShowBundleCreator] = useState(false);
  
  // Bulk delete state
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserItems();
    loadUserBundles();
  }, []);

  const loadUserItems = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const userItems = await Item.filter({ seller_id: user.id }, "-created_at");
      setItems(userItems);

      // For sold items, check if we've rated the buyer
      const ratingsData = {};
      for (const item of userItems) {
        if (item.status === 'sold') {
          const transaction = (await Transaction.filter({ item_id: item.id, status: 'completed' }))[0];
          if (transaction) {
            const rating = await Rating.filter({ transaction_id: transaction.id, rated_by_user_id: user.id });
            ratingsData[item.id] = { transaction, hasRated: rating.length > 0 };
          }
        }
      }
      setItemRatings(ratingsData);

    } catch (error) {
      console.error("Error loading user items:", error);
    }
    setLoading(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await Item.delete(itemId);
        setItems(prev => prev.filter(item => item.id !== itemId));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item. Please try again.");
      }
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await Item.update(itemId, { status: newStatus });
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Error updating item. Please try again.");
    }
  };

  const loadUserBundles = async () => {
    try {
      const user = await User.me();
      const response = await fetch(`/api/bundles?seller_id=${user.id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error("Error loading user bundles:", error);
    }
  };

  // Bulk delete functions
  const handleBulkSelectToggle = () => {
    setBulkSelectMode(!bulkSelectMode);
    if (bulkSelectMode) {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (item, isSelected) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    }
  };

  const handleSelectAll = () => {
    const currentTabItems = getCurrentTabItems();
    setSelectedItems(currentTabItems);
  };

  const handleDeselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to delete.",
        variant: "destructive"
      });
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      console.log('Starting bulk delete for items:', selectedItems.map(item => item.id));
      
      // Use direct Supabase client instead of API endpoint
      const { data, error } = await supabase
        .from('items')
        .delete()
        .in('id', selectedItems.map(item => item.id))
        .eq('seller_id', currentUser.id);

      console.log('Bulk delete result:', { data, error });

      if (error) {
        console.error('Bulk delete error:', error);
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete items.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Items Deleted",
        description: `Successfully deleted ${selectedItems.length} item(s).`,
      });
      
      // Refresh the items list
      await loadUserItems();
      
      // Reset bulk selection
      setSelectedItems([]);
      setBulkSelectMode(false);
      setShowBulkDeleteModal(false);
      
    } catch (error) {
      console.error('Error deleting items:', error);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting items.",
        variant: "destructive"
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getCurrentTabItems = () => {
    switch (activeTab) {
      case 'active':
        return items.filter(item => item.status === 'active');
      case 'sold':
        return items.filter(item => item.status === 'sold');
      case 'reserved':
        return items.filter(item => item.status === 'reserved');
      case 'inactive':
        return items.filter(item => item.status === 'inactive');
      default:
        return items;
    }
  };

  const getFilteredItems = (status) => {
    if (status === "all") return items;
    return items.filter(item => item.status === status);
  };

  const stats = {
    total: items.length,
    active: items.filter(item => item.status === "active").length,
    sold: items.filter(item => item.status === "sold").length,
    totalValue: items.reduce((sum, item) => sum + (item.price || 0), 0),
    soldValue: items.filter(item => item.status === "sold").reduce((sum, item) => sum + (item.price || 0), 0)
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Items</h1>
              <p className="text-base md:text-lg text-gray-400">Manage your listings and track your sales</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link to={createPageUrl("AddItem")} className="flex-1">
                <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-xl w-full">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Item
                </Button>
              </Link>
              {/* Create Bundle Button */}
              <Button 
                onClick={() => setShowBundleCreator(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-xl w-full sm:w-auto"
              >
                <Package className="w-5 h-5 mr-2" />
                Create Bundle
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {bulkSelectMode && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">
                    {selectedItems.length} item(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={handleDeselectAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBulkDelete}
                    disabled={selectedItems.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    onClick={handleBulkSelectToggle}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Select Toggle */}
          {!bulkSelectMode && (
            <div className="mb-6">
              <Button
                onClick={handleBulkSelectToggle}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Bulk Select Items
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <StatsCards
              title="Total Items"
              value={stats.total}
              icon={Package}
              bgColor="bg-gray-700"
              description={`${stats.active} active`}
            />
            <StatsCards
              title="Items Sold"
              value={stats.sold}
              icon={DollarSign}
              bgColor="bg-lime-600"
              description="Sales"
            />
            <StatsCards
              title="Total Value"
              value={`$${stats.totalValue.toFixed(0)}`}
              icon={Eye}
              bgColor="bg-cyan-500"
              description="Listings"
            />
            <StatsCards
              title="Revenue"
              value={`$${stats.soldValue.toFixed(0)}`}
              icon={DollarSign}
              bgColor="bg-pink-500"
              description="From sales"
            />
          </div>

          {/* Items Tabs */}
          <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-800/50 border-b border-gray-700">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800 rounded-xl p-1 text-xs sm:text-sm">
                  <TabsTrigger value="all" className="rounded-lg text-white data-[state=active]:bg-pink-600">All</TabsTrigger>
                  <TabsTrigger value="active" className="rounded-lg text-white data-[state=active]:bg-pink-600">Active</TabsTrigger>
                  <TabsTrigger value="sold" className="rounded-lg text-white data-[state=active]:bg-pink-600">Sold</TabsTrigger>
                  <TabsTrigger value="inactive" className="rounded-lg text-white data-[state=active]:bg-pink-600">Inactive</TabsTrigger>
                  <TabsTrigger value="bundles" className="rounded-lg text-white data-[state=active]:bg-pink-600">Bundles</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {["all", "active", "sold", "inactive"].map(status => (
                  <TabsContent key={status} value={status} className="mt-0">
                    {getFilteredItems(status).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {getFilteredItems(status).map((item) => (
                          <div key={item.id} className="relative">
                            {bulkSelectMode && (
                              <div className="absolute top-2 left-2 z-10">
                                <Checkbox
                                  checked={selectedItems.some(selected => selected.id === item.id)}
                                  onCheckedChange={(checked) => handleItemSelect(item, checked)}
                                  className="bg-white/90"
                                />
                              </div>
                            )}
                            <MyItemCard
                              item={item}
                              onDelete={() => handleDeleteItem(item.id)}
                              onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                            />
                            {item.status === 'sold' && itemRatings[item.id] && (
                              <div className="mt-2">
                                {itemRatings[item.id].hasRated ? (
                                  <Button variant="outline" disabled className="w-full bg-gray-800 border-gray-700 text-gray-400">
                                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                                    Buyer Rated
                                  </Button>
                                ) : (
                                  <Button variant="secondary" className="w-full bg-gray-800 hover:bg-gray-700 text-white" onClick={() => setRatingTransaction(itemRatings[item.id].transaction)}>
                                    <Star className="w-4 h-4 mr-2" />
                                    Rate Buyer
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 md:py-16">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Package className="w-10 h-10 md:w-12 md:h-12 text-gray-600" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                          No {status === "all" ? "" : status} items yet
                        </h3>
                        <p className="text-gray-400 mb-6 text-sm md:text-base">
                          {status === "all" 
                            ? "Start by adding your first item to the marketplace"
                            : `You don't have any ${status} items`
                          }
                        </p>
                        <Link to={createPageUrl("AddItem")}>
                          <Button className="bg-pink-600 hover:bg-pink-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Item
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                ))}
                
                {/* Bundles Tab */}
                <TabsContent value="bundles" className="mt-0">
                  {bundles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {bundles.map((bundle) => (
                        <div key={bundle.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{bundle.title}</h3>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {bundle.status}
                            </Badge>
                          </div>
                          
                          {bundle.description && (
                            <p className="text-gray-400 text-sm mb-3">{bundle.description}</p>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Bundle Price:</span>
                              <span className="text-white font-semibold">${bundle.bundle_price}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Individual Total:</span>
                              <span className="text-gray-300">${bundle.individual_total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">You Save:</span>
                              <span className="text-green-400 font-semibold">${bundle.savings}</span>
                            </div>
                          </div>
                          
                          {bundle.bundle_items && bundle.bundle_items.length > 0 && (
                            <div className="mb-3">
                              <p className="text-gray-400 text-xs mb-2">Items in bundle:</p>
                              <div className="space-y-1">
                                {bundle.bundle_items.slice(0, 3).map((bundleItem, index) => (
                                  <div key={index} className="text-xs text-gray-300">
                                    • {bundleItem.items?.title || 'Unknown Item'} (${bundleItem.items?.price || 0})
                                  </div>
                                ))}
                                {bundle.bundle_items.length > 3 && (
                                  <div className="text-xs text-gray-400">
                                    +{bundle.bundle_items.length - 3} more items
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500">
                            Created: {new Date(bundle.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-white mb-2">No bundles yet!</h3>
                      <p className="text-gray-400 mb-6">Create your first bundle to group items together at a discounted price.</p>
                      <Button
                        onClick={() => setShowBundleCreator(true)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl"
                      >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Create Your First Bundle
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      {ratingTransaction && (
        <RatingModal
          transaction={ratingTransaction}
          role="seller_rating_buyer"
          onClose={() => setRatingTransaction(null)}
          onRatingSuccess={loadUserItems}
        />
      )}

      {showBundleCreator && currentUser && (
        <BundleCreator
          sellerId={currentUser.id}
          onClose={() => setShowBundleCreator(false)}
              onSuccess={() => {
                setShowBundleCreator(false);
                loadUserItems(); // Refresh items to show updated status
                loadUserBundles(); // Refresh bundles to show new bundle
              }}
        />
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        selectedItems={selectedItems}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
