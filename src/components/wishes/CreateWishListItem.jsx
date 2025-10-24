import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateWishListItem({ userId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    category: "",
    preferred_price_min: "",
    preferred_price_max: "",
    max_distance_km: 50,
    priority: "medium",
    acceptable_conditions: []
  });

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor/For Parts' }
  ];

  const categoryOptions = [
    'Electronics',
    'Furniture',
    'Clothing',
    'Books',
    'Toys',
    'Sports',
    'Tools',
    'Home & Garden',
    'Automotive',
    'Other'
  ];

  const handleConditionToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      acceptable_conditions: prev.acceptable_conditions.includes(condition)
        ? prev.acceptable_conditions.filter(c => c !== condition)
        : [...prev.acceptable_conditions, condition]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, create or get the wishlist
      let wishlistId;
      const { data: existingWishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingWishlist) {
        wishlistId = existingWishlist.id;
      } else {
        const { data: newWishlist, error: wishlistError } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, privacy_setting: 'public' })
          .select()
          .single();

        if (wishlistError) throw wishlistError;
        wishlistId = newWishlist.id;
      }

      // Create the wishlist item
      const { error: itemError } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: wishlistId,
          item_name: formData.item_name,
          description: formData.description || null,
          category: formData.category || null,
          preferred_price_min: formData.preferred_price_min ? parseFloat(formData.preferred_price_min) : null,
          preferred_price_max: formData.preferred_price_max ? parseFloat(formData.preferred_price_max) : null,
          max_distance_km: formData.max_distance_km,
          priority: formData.priority,
          acceptable_conditions: formData.acceptable_conditions.length > 0 ? formData.acceptable_conditions : ['new', 'like_new', 'good'],
          status: 'active'
        });

      if (itemError) throw itemError;

      toast({
        title: "Success!",
        description: "Your wish has been created. Sellers will be notified!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating wish:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wish",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="w-6 h-6 text-pink-500" />
            Create a Wish
          </DialogTitle>
          <p className="text-gray-400 text-sm">
            Tell sellers what you're looking for and we'll notify them when they have matching items
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="item_name" className="text-gray-300">
              What are you looking for? *
            </Label>
            <Input
              id="item_name"
              value={formData.item_name}
              onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
              placeholder="e.g., iPhone 13, Gaming PC, Dining Table"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description (Optional but recommended)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you're looking for in detail..."
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
            <p className="text-xs text-gray-500">
              More details help our AI find better matches
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-300">
              Category
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_min" className="text-gray-300">
                Min Price (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="price_min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preferred_price_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_price_min: e.target.value }))}
                  placeholder="0"
                  className="bg-gray-800 border-gray-700 text-white pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_max" className="text-gray-300">
                Max Price (Optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <Input
                  id="price_max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preferred_price_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferred_price_max: e.target.value }))}
                  placeholder="1000"
                  className="bg-gray-800 border-gray-700 text-white pl-7"
                />
              </div>
            </div>
          </div>

          {/* Acceptable Conditions */}
          <div className="space-y-3">
            <Label className="text-gray-300">Acceptable Conditions</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {conditionOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-pink-500 transition-colors"
                >
                  <Checkbox
                    checked={formData.acceptable_conditions.includes(option.value)}
                    onCheckedChange={() => handleConditionToggle(option.value)}
                    className="border-gray-600"
                  />
                  <span className="text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            {formData.acceptable_conditions.length === 0 && (
              <p className="text-xs text-gray-500">
                Default: New, Like New, and Good conditions
              </p>
            )}
          </div>

          {/* Max Distance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Maximum Distance</Label>
              <span className="text-pink-500 font-semibold">{formData.max_distance_km} km</span>
            </div>
            <Slider
              value={[formData.max_distance_km]}
              onValueChange={(value) => setFormData(prev => ({ ...prev, max_distance_km: value[0] }))}
              min={5}
              max={100}
              step={5}
              className="py-4"
            />
            <p className="text-xs text-gray-500">
              How far are you willing to travel to collect the item?
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-gray-300">
              Priority
            </Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="low" className="text-white">Low - Just browsing</SelectItem>
                <SelectItem value="medium" className="text-white">Medium - Interested</SelectItem>
                <SelectItem value="high" className="text-white">High - Actively looking</SelectItem>
                <SelectItem value="urgent" className="text-white">Urgent - Need ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Preview</h4>
            <div className="space-y-2 text-sm">
              <p className="text-white font-semibold">{formData.item_name || "Item name"}</p>
              <p className="text-gray-400">{formData.description || "No description"}</p>
              {formData.preferred_price_min && formData.preferred_price_max && (
                <p className="text-gray-300">
                  Budget: ${formData.preferred_price_min} - ${formData.preferred_price_max}
                </p>
              )}
              <p className="text-gray-300">Within {formData.max_distance_km}km</p>
              <span className={`inline-block px-2 py-1 rounded text-xs ${
                formData.priority === 'urgent' ? 'bg-red-500' :
                formData.priority === 'high' ? 'bg-orange-500' :
                formData.priority === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                {formData.priority}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.item_name}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Create Wish
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

