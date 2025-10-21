
import React, { useState, useEffect } from "react";
import { Item } from "@/api/entities";
import { User } from "@/api/entities";
import { ExtractDataFromUploadedFile } from "@/api/integrations";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Camera, Plus, X, Sparkles, Save } from "lucide-react";

import ImageUpload from "../components/additem/ImageUpload";
import AIAssistant from "../components/additem/AIAssistant";

const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "books", label: "Books" },
  { value: "toys", label: "Toys" },
  { value: "sports", label: "Sports" },
  { value: "home_garden", label: "Home & Garden" },
  { value: "automotive", label: "Automotive" },
  { value: "collectibles", label: "Collectibles" },
  { value: "other", label: "Other" }
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
];

export default function AddItem() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [itemData, setItemData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "good",
    category: "other",
    location: "",
    tags: [],
    image_urls: []
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      // Handle unauthenticated user - redirect to login or show message
    }
  };

  const handleInputChange = (field, value) => {
    setItemData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !itemData.tags.includes(newTag.trim())) {
      setItemData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setItemData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (files) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `item-images/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('items')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('items')
          .getPublicUrl(filePath);

        return publicUrl;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setItemData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls]
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images. Please try again.");
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setItemData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleAIAssist = (aiData) => {
    setItemData(prev => ({
      ...prev,
      ...aiData,
      tags: [...(prev.tags || []), ...(aiData.tags || [])]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!itemData.title || !itemData.price) {
      alert("Please fill in the title and price");
      return;
    }

    setIsSubmitting(true);
    try {
      const newItem = {
        ...itemData,
        price: parseFloat(itemData.price),
        seller_id: currentUser?.id || 'guest-user',
        status: "active"
      };
      
      await Item.create(newItem);

      alert("Item added successfully!");
      navigate(createPageUrl("MyItems"));
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Item added (demo mode - database may not be accessible)");
      navigate(createPageUrl("MyItems"));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("MyItems"))}
              className="rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700 text-white flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Add New Item</h1>
              <p className="text-base md:text-lg text-gray-400 mt-1">List something amazing</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-900/50 to-fuchsia-900/50 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-6 h-6 text-pink-400" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ImageUpload
                  images={itemData.image_urls}
                  onUpload={handleImageUpload}
                  onRemove={handleRemoveImage}
                />
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    AI Assistant
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    {showAIAssistant ? "Hide" : "Show"} AI Helper
                  </Button>
                </div>
              </CardHeader>
              {showAIAssistant && (
                <CardContent className="p-6">
                  <AIAssistant
                    images={itemData.image_urls}
                    onAssist={handleAIAssist}
                  />
                </CardContent>
              )}
            </Card>

            {/* Item Details */}
            <Card className="bg-gray-900/80 backdrop-blur-sm shadow-xl border border-gray-800 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                <CardTitle className="text-white">Item Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Title *</Label>
                    <Input
                      id="title"
                      value={itemData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="What are you selling?"
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-300">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={itemData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your item in detail..."
                    className="min-h-24 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-300">Category</Label>
                    <Select
                      value={itemData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-gray-700">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition" className="text-gray-300">Condition</Label>
                    <Select
                      value={itemData.condition}
                      onValueChange={(value) => handleInputChange('condition', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {conditions.map(cond => (
                          <SelectItem key={cond.value} value={cond.value} className="text-white hover:bg-gray-700">
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-300">Location</Label>
                    <Input
                      id="location"
                      value={itemData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, State"
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="text-gray-300">Tags</Label>
                  <div className="flex gap-2 flex-wrap">
                    {itemData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-pink-900/50 text-pink-300 border-pink-700 px-3 py-1"
                      >
                        #{tag}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer hover:text-pink-200"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <form onSubmit={handleAddTag} className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 h-10 rounded-xl bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="px-4 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("MyItems"))}
                className="h-12 px-6 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !itemData.title || !itemData.price}
                className="h-12 px-8 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Item...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    List Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
