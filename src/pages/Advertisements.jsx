
import React, { useState, useEffect } from "react";
import { Advertisement } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadFile } from "@/api/integrations";
import { Plus, Eye, EyeOff, Edit, Trash2, Upload, ExternalLink, BarChart3, Calendar, DollarSign, CheckCircle, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
// import { createAdSubscriptionSession } from "@/api/functions/createAdSubscriptionSession"; // Will create this next

const AD_PLACEMENTS = [
    {
        value: "top_banner",
        label: "Top Banner",
        description: "Premium placement at the top of the marketplace page.",
        price: 950,
        price_id: "price_top_banner_monthly" // Example Stripe Price ID
    },
    {
        value: "sidebar",
        label: "Sidebar Ad",
        description: "Consistent visibility in the sidebar on various pages.",
        price: 700,
        price_id: "price_sidebar_monthly"
    },
    {
        value: "between_items",
        label: "In-Feed Banner",
        description: "Large banner placed between item listings for high impact.",
        price: 800,
        price_id: "price_in_feed_monthly"
    },
    {
        value: "local_deals",
        label: "Local Deal Card",
        description: "A sponsored card that looks like a regular item, marked as a 'Local Deal'.",
        price: 1200,
        price_id: "price_local_deal_monthly"
    },
];

export default function Advertisements() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    placement: "top_banner",
    status: "active",
    priority: 1,
    start_date: "",
    end_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadAds();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadAds = async () => {
    setLoading(true);
    try {
      const allAds = await Advertisement.list("-priority", 50);
      setAds(allAds);
    } catch (error) {
      console.error("Error loading advertisements:", error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    }
    setUploadingImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image_url) {
      alert("Please provide a title and image");
      return;
    }

    setIsSubmitting(true);
    try {
      const adData = {
        ...formData,
        priority: parseInt(formData.priority)
      };

      if (!editingAd || adData.click_count === undefined) adData.click_count = 0;
      if (!editingAd || adData.impression_count === undefined) adData.impression_count = 0;

      if (editingAd) {
        await Advertisement.update(editingAd.id, adData);
      } else {
        await Advertisement.create(adData);
      }

      setShowAddModal(false);
      setEditingAd(null);
      setFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        placement: "top_banner",
        status: "active",
        priority: 1,
        start_date: "",
        end_date: "",
      });
      loadAds();
    } catch (error) {
      console.error("Error saving advertisement:", error);
      alert("Error saving advertisement. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      placement: ad.placement,
      status: ad.status,
      priority: ad.priority,
      start_date: ad.start_date ? format(new Date(ad.start_date), 'yyyy-MM-dd') : "",
      end_date: ad.end_date ? format(new Date(ad.end_date), 'yyyy-MM-dd') : "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    try {
      await Advertisement.delete(adId);
      loadAds();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      alert("Error deleting advertisement. Please try again.");
    }
  };

  const handleStatusToggle = async (ad) => {
    try {
      const newStatus = ad.status === "active" ? "inactive" : "active";
      await Advertisement.update(ad.id, { status: newStatus });
      loadAds();
    } catch (error) {
      console.error("Error updating advertisement status:", error);
      alert("Error updating advertisement status. Please try again.");
    }
  };

  const handlePurchase = async (placement) => {
    alert(`Purchasing ${placement.label} for $${placement.price}/month is not yet implemented. This will be a Stripe subscription.`);
    // TODO: Implement Stripe subscription logic
    // const { data, error } = await createAdSubscriptionSession({ price_id: placement.price_id });
    // if (data?.checkout_url) {
    //   window.location.href = data.checkout_url;
    // } else {
    //   console.error("Failed to create Stripe session", error);
    // }
  };

  // This 'placements' array is specifically for the admin view's form select options,
  // including "bottom_banner" which is not a purchasable AD_PLACEMENT.
  const placements = [
    { value: "top_banner", label: "Top Banner" },
    { value: "sidebar", label: "Sidebar" },
    { value: "between_items", label: "Between Items" },
    { value: "bottom_banner", label: "Bottom Banner (Featured)" },
    { value: "local_deals", label: "Local Deal Card" },
  ];

  // Allow admin, super_admin roles, or business accounts
  const hasAccess = 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'super_admin' || 
    currentUser?.account_type === 'business';

  if (!hasAccess) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-gray-400 mt-2">You need an admin or business account to access this page.</p>
      </div>
    );
  }

  // Business View
  if (currentUser?.account_type === 'business') {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-200">
        <div className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Purchase Ad Placements</h1>
              <p className="text-lg text-gray-400">Promote your business by purchasing a monthly ad slot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {AD_PLACEMENTS.map(placement => (
                <Card key={placement.value} className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                           <CardTitle className="text-2xl font-bold text-white">{placement.label}</CardTitle>
                           <p className="text-gray-400 mt-1">{placement.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-cyan-900/50 text-cyan-400 border-cyan-800">${placement.price}/mo</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-end">
                     {/* TODO: Add logic to check for existing subscription */}
                     <Button
                        onClick={() => handlePurchase(placement)}
                        className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2"/>
                        Purchase Slot
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Your Active Ad Subscriptions</h3>
                {/* TODO: List active subscriptions here */}
                <p className="text-gray-500">You have no active ad subscriptions. Purchase a slot above to get started.</p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Admin View
  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Advertisement Management</h1>
              <p className="text-lg text-gray-400">Manage advertising spaces across the marketplace</p>
            </div>
            <Button
              onClick={() => {
                setShowAddModal(true);
                setFormData({
                  title: "",
                  description: "",
                  image_url: "",
                  link_url: "",
                  placement: "top_banner",
                  status: "active",
                  priority: 1,
                  start_date: "",
                  end_date: "",
                });
              }}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Advertisement
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Ads</p>
                    <p className="text-3xl font-bold text-white">{ads.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Ads</p>
                    <p className="text-3xl font-bold text-white">
                      {ads.filter(ad => ad.status === 'active').length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Clicks</p>
                    <p className="text-3xl font-bold text-white">
                      {ads.reduce((sum, ad) => sum + (ad.click_count || 0), 0)}
                    </p>
                  </div>
                  <ExternalLink className="w-8 h-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Impressions</p>
                    <p className="text-3xl font-bold text-white">
                      {ads.reduce((sum, ad) => sum + (ad.impression_count || 0), 0)}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-fuchsia-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advertisements Grid */}
          {ads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <Card
                  key={ad.id}
                  className="bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <Badge className={
                        ad.status === 'active' ? 'bg-green-900/80 text-green-300 border-green-700 backdrop-blur-sm' :
                        'bg-gray-900/80 text-gray-300 border-gray-700 backdrop-blur-sm'
                      }>
                        {ad.status}
                      </Badge>
                      <Badge variant="outline" className="bg-black/80 text-gray-300 border-gray-600 backdrop-blur-sm text-xs">
                        {placements.find(p => p.value === ad.placement)?.label || 'Unknown'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="flex-grow space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight mb-2">
                          {ad.title}
                        </h3>
                        {ad.description && (
                          <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                            {ad.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-400">
                          <span className="font-medium">Priority:</span> {ad.priority}
                        </div>
                        <div className="text-gray-400">
                          <span className="font-medium">Clicks:</span> {ad.click_count || 0}
                        </div>
                        <div className="text-gray-400 col-span-2">
                          <span className="font-medium">Impressions:</span> {ad.impression_count || 0}
                        </div>
                      </div>

                      {ad.start_date && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 bg-gray-800/50 rounded-lg px-3 py-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(ad.start_date), 'MMM d')} - {ad.end_date ? format(new Date(ad.end_date), 'MMM d') : 'Ongoing'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Fixed Layout */}
                    <div className="mt-4 pt-3 border-t border-gray-700">
                      <div className="flex gap-2 mb-2">
                        <Button
                          onClick={() => handleStatusToggle(ad)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 h-9 text-xs"
                        >
                          {ad.status === 'active' ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(ad)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 h-9 text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(ad.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-400 border-gray-700 hover:bg-red-900/20 hover:text-red-300 h-9 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No advertisements yet</h3>
              <p className="text-gray-400 mb-6">Create your first advertisement to start monetizing your marketplace</p>
              <Button
                onClick={() => {
                  setShowAddModal(true);
                  setFormData({
                    title: "",
                    description: "",
                    image_url: "",
                    link_url: "",
                    placement: "top_banner",
                    status: "active",
                    priority: 1,
                    start_date: "",
                    end_date: "",
                  });
                }}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Advertisement
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Advertisement Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) {
          setEditingAd(null);
          setFormData({
            title: "",
            description: "",
            image_url: "",
            link_url: "",
            placement: "top_banner",
            status: "active",
            priority: 1,
            start_date: "",
            end_date: "",
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-gray-900/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-white">
              <BarChart3 className="w-6 h-6 text-pink-500" />
              {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Advertisement title"
                  className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  placeholder="1"
                  className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Advertisement description or tagline"
                className="min-h-20 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Advertisement Image *</Label>
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl border border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-800/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {uploadingImage ? "Uploading..." : "Click to upload image"}
                    </p>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_url" className="text-gray-300">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="https://example.com"
                className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Placement</Label>
                <Select
                  value={formData.placement}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {placements.map(placement => (
                      <SelectItem key={placement.value} value={placement.value} className="text-white hover:bg-gray-700">
                        {placement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
                    <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
                    <SelectItem value="scheduled" className="text-white hover:bg-gray-700">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-gray-300">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-gray-300">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-12 rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.image_url || uploadingImage}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingAd ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
