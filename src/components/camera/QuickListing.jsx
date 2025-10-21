import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Sparkles, Upload, X, Check, Mic } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MobileCameraCapture from './MobileCameraCapture';
import VoiceInput from './VoiceInput';
import { supabase } from '@/lib/supabase';

const categories = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'sports', label: 'Sports' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'other', label: 'Other' }
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

export default function QuickListing({ onClose, onSuccess }) {
  const [showCamera, setShowCamera] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    minimum_price: '',
    category: 'other',
    condition: 'good',
    tags: [],
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleCameraCapture = (data) => {
    setCapturedImage(data.image);
    setAnalysisResult(data.analysis);
    
    // Auto-fill form with AI analysis
    setFormData(prev => ({
      ...prev,
      title: data.analysis.title || '',
      description: data.analysis.description || '',
      category: data.analysis.category || 'other',
      condition: data.analysis.condition || 'good',
      price: data.analysis.suggested_price?.toString() || '',
      tags: data.analysis.tags || []
    }));
    
    setShowCamera(false);
    toast({
      title: "Photo Captured!",
      description: "AI has analyzed your photo and filled in the details.",
    });
  };

  const handleVoiceTranscript = (voiceData) => {
    setShowVoiceInput(false);
    
    // Merge voice data with existing form data
    setFormData(prev => ({
      ...prev,
      title: voiceData.title || prev.title,
      description: voiceData.description || prev.description,
      price: voiceData.price?.toString() || prev.price,
      minimum_price: voiceData.minimum_price?.toString() || prev.minimum_price,
      category: voiceData.category || prev.category,
      condition: voiceData.condition || prev.condition,
      tags: voiceData.tags || prev.tags,
      location: voiceData.location || prev.location
    }));

    toast({
      title: "Voice Processing Complete!",
      description: "AI has extracted your listing details from your speech.",
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isUploading) return; // Prevent double submission
    
    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // Convert captured image to base64 if needed
      let imageUrls = [];
      if (capturedImage) {
        // For now, use the blob URL directly
        // In production, you'd upload to Supabase Storage
        imageUrls = [capturedImage];
      }

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("Please log in to create listings");
      }

      const listingData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        minimum_price: formData.minimum_price ? parseFloat(formData.minimum_price) : null,
        category: formData.category,
        condition: formData.condition,
        seller_id: session.user.id, // Use real authenticated user ID
        image_urls: imageUrls,
        tags: formData.tags,
        location: formData.location || '',
        status: 'active'
      };

      // TEMPORARY: Direct Supabase call to bypass authentication issues
      const { data, error } = await supabase
        .from('items')
        .insert([listingData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // If minimum_price is set, also create item knowledge for AI agent
      if (listingData.minimum_price) {
        await supabase
          .from('item_knowledge')
          .insert([{
            item_id: data[0].id,
            minimum_price: listingData.minimum_price,
            negotiation_notes: `Minimum acceptable price: $${listingData.minimum_price}`,
            negotiation_enabled: true,
            created_at: new Date().toISOString()
          }]);
      }

      toast({
        title: "Listing Created!",
        description: "Your item has been listed successfully.",
      });
      onSuccess?.(data[0]);
      onClose();
    } catch (error) {
      console.error('Listing creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (showCamera) {
    return (
      <MobileCameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  if (showVoiceInput) {
    return (
      <VoiceInput
        onTranscript={handleVoiceTranscript}
        onClose={() => setShowVoiceInput(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Quick Listing
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Camera Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-semibold">Item Photo</Label>
              {analysisResult && (
                <Badge className="bg-green-600 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analyzed
                </Badge>
              )}
            </div>

            {capturedImage ? (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured item"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCapturedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowCamera(true)}
                  disabled={isUploading}
                  className="w-full h-48 border-2 border-dashed border-gray-600 hover:border-pink-500 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    {isUploading ? (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-2 animate-spin" />
                        <div className="text-lg font-semibold">Uploading...</div>
                        <div className="text-sm">Please wait</div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <div className="text-lg font-semibold">Take Photo</div>
                        <div className="text-sm">AI will analyze and suggest details</div>
                      </>
                    )}
                  </div>
                </Button>
                
                <div className="text-center text-gray-400 text-sm">OR</div>
                
                <Button
                  onClick={() => setShowVoiceInput(true)}
                  disabled={isUploading}
                  className="w-full h-48 border-2 border-dashed border-gray-600 hover:border-purple-500 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    {isUploading ? (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-2 animate-spin" />
                        <div className="text-lg font-semibold">Uploading...</div>
                        <div className="text-sm">Please wait</div>
                      </>
                    ) : (
                      <>
                        <Mic className="w-12 h-12 mx-auto mb-2" />
                        <div className="text-lg font-semibold">Voice Input</div>
                        <div className="text-sm">Speak your item details</div>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Item title"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-white">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Describe your item..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition" className="text-white">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {conditions.map(cond => (
                      <SelectItem key={cond.value} value={cond.value} className="text-white">
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="minimum_price" className="text-white">Minimum Price (Optional)</Label>
              <Input
                id="minimum_price"
                type="number"
                step="0.01"
                value={formData.minimum_price}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_price: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Lowest price you'll accept"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enables AI agent to negotiate automatically
              </p>
            </div>

            <div>
              <Label className="text-white">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Add tag"
                />
                <Button type="button" onClick={addTag} variant="outline" className="border-gray-700 text-gray-300">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-gray-700 text-gray-300">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-white">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="City, State"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex-1 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 text-white"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    List Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
