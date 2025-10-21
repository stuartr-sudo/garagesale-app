import React, { useState, useEffect } from "react";
import { Item } from "@/api/entities";
import { User } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Upload, Camera, Sparkles, CheckCircle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "../components/additem/ImageUpload";

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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [itemData, setItemData] = useState({
    title: "",
    description: "",
    price: "",
    minimum_price: "",
    condition: "good",
    category: "other",
    postcode: "",
    tags: [],
    image_urls: []
  });
  
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (user.postcode) {
        setItemData(prev => ({ ...prev, postcode: user.postcode }));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleImageUpload = async (files) => {
    // Check if user is loaded
    if (!currentUser) {
      toast({
        title: "Please wait",
        description: "Loading user data...",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload images.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      const uploadedUrls = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(filePath, file, { 
            upsert: true,
            contentType: file.type
          });

        if (error) {
          console.error("Upload error for file:", file.name, error);
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setItemData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls]
      }));

      toast({
        title: "Success!",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setItemData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const generateWithAI = async (field) => {
    if (field === 'title') {
      setIsGeneratingTitle(true);
      try {
        const prompt = `Generate a short, catchy title (max 60 characters) for a marketplace listing based on this description: "${itemData.description}". Just return the title, nothing else.`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
          })
        });

        const data = await response.json();
        const generatedTitle = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        
        setItemData(prev => ({ ...prev, title: generatedTitle }));
        toast({ title: "Success!", description: "Title generated with AI." });
      } catch (error) {
        console.error("Error generating title:", error);
        toast({ title: "Error", description: "Failed to generate title.", variant: "destructive" });
      } finally {
        setIsGeneratingTitle(false);
      }
    } else if (field === 'description') {
      setIsGeneratingDescription(true);
      try {
        const prompt = `Generate a detailed, compelling product description (max 200 words) for: "${itemData.title}". Include key features and benefits. Just return the description, nothing else.`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300
          })
        });

        const data = await response.json();
        const generatedDescription = data.choices[0].message.content.trim();
        
        setItemData(prev => ({ ...prev, description: generatedDescription }));
        toast({ title: "Success!", description: "Description generated with AI." });
      } catch (error) {
        console.error("Error generating description:", error);
        toast({ title: "Error", description: "Failed to generate description.", variant: "destructive" });
      } finally {
        setIsGeneratingDescription(false);
      }
    } else if (field === 'tags') {
      setIsGeneratingTags(true);
      try {
        const prompt = `Generate 5-8 relevant tags (single words or short phrases) for this item: "${itemData.title} - ${itemData.description}". Return only a comma-separated list of tags, nothing else.`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
          })
        });

        const data = await response.json();
        const tagsString = data.choices[0].message.content.trim();
        const tags = tagsString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        
        setItemData(prev => ({ ...prev, tags }));
        toast({ title: "Success!", description: "Tags generated with AI." });
      } catch (error) {
        console.error("Error generating tags:", error);
        toast({ title: "Error", description: "Failed to generate tags.", variant: "destructive" });
      } finally {
        setIsGeneratingTags(false);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return itemData.image_urls.length > 0;
      case 2: return itemData.title.trim() && itemData.description.trim();
      case 3: return itemData.price;
      case 4: return itemData.category && itemData.condition && itemData.postcode;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 4) {
      // Auto-generate tags before going to step 5
      if (itemData.tags.length === 0) {
        generateWithAI('tags');
      }
    }
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const itemPayload = {
        title: itemData.title,
        description: itemData.description,
        price: parseFloat(itemData.price),
        condition: itemData.condition,
        category: itemData.category,
        location: `Postcode ${itemData.postcode}, Australia`,
        tags: itemData.tags,
        image_urls: itemData.image_urls,
        seller_id: currentUser.id,
        status: 'active'
      };

      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert([itemPayload])
        .select()
        .single();

      if (itemError) throw itemError;

      // Create item_knowledge entry if minimum_price is provided
      if (itemData.minimum_price) {
        const knowledgePayload = {
          item_id: newItem.id,
          minimum_price: parseFloat(itemData.minimum_price),
          negotiation_enabled: true,
          selling_points: [itemData.title, itemData.condition, itemData.category]
        };

        const { error: knowledgeError } = await supabase
          .from('item_knowledge')
          .insert([knowledgePayload]);

        if (knowledgeError) console.error("Error creating item_knowledge:", knowledgeError);
      }

      toast({
        title: "Success!",
        description: "Your item has been listed successfully.",
      });

      navigate(createPageUrl('MyItems'));
    } catch (error) {
      console.error("Error creating item:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Add Photos</h2>
              <p className="text-gray-400">Upload images of your item (first image will be the main photo)</p>
          </div>

                <ImageUpload
                  images={itemData.image_urls}
                  onUpload={handleImageUpload}
              onRemove={removeImage}
              isUploading={isUploading}
            />

            {itemData.image_urls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {itemData.image_urls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                        Main Photo
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Title & Description</h2>
              <p className="text-gray-400">Tell buyers about your item</p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                  <Button
                    type="button"
                  onClick={() => generateWithAI('title')}
                  disabled={!itemData.description || isGeneratingTitle}
                    variant="outline"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                >
                  {isGeneratingTitle ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate with AI
                  </Button>
                </div>
                    <Input
                      id="title"
                      value={itemData.title}
                onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., iPhone 13 Pro 256GB - Like New"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-gray-300">Description *</Label>
                <Button
                  type="button"
                  onClick={() => generateWithAI('description')}
                  disabled={!itemData.title || isGeneratingDescription}
                  variant="outline"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                >
                  {isGeneratingDescription ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="description"
                value={itemData.description}
                onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your item in detail..."
                rows={6}
                className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Pricing</h2>
              <p className="text-gray-400">Set your price and minimum offer</p>
            </div>

                  <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-300">Asking Price (AUD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={itemData.price}
                onChange={(e) => setItemData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white text-2xl"
                    />
                </div>

                <div className="space-y-2">
              <Label htmlFor="minimum_price" className="text-gray-300">
                Minimum Price for AI Agent (Optional)
              </Label>
              <Input
                id="minimum_price"
                type="number"
                step="0.01"
                value={itemData.minimum_price}
                onChange={(e) => setItemData(prev => ({ ...prev, minimum_price: e.target.value }))}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                The AI agent will automatically accept offers at or above this price
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Details</h2>
              <p className="text-gray-400">Category, condition, and location</p>
                </div>

                  <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category *</Label>
              <Select value={itemData.category} onValueChange={(value) => setItemData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                <SelectContent>
                        {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
              <Label htmlFor="condition" className="text-gray-300">Condition *</Label>
              <Select value={itemData.condition} onValueChange={(value) => setItemData(prev => ({ ...prev, condition: value }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                <SelectContent>
                        {conditions.map(cond => (
                    <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
              <Label htmlFor="postcode" className="text-gray-300">Postcode (Australia) *</Label>
                    <Input
                id="postcode"
                value={itemData.postcode}
                onChange={(e) => setItemData(prev => ({ ...prev, postcode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="2000"
                maxLength={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {isGeneratingTags && (
              <div className="flex items-center gap-2 text-purple-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating tags with AI...</span>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Review & Confirm</h2>
              <p className="text-gray-400">Check your listing before publishing</p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 space-y-4">
                {itemData.image_urls[0] && (
                  <img src={itemData.image_urls[0]} alt="Main" className="w-full h-48 object-cover rounded-lg" />
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-white">{itemData.title}</h3>
                  <p className="text-gray-400 text-sm mt-2">{itemData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="text-white font-bold ml-2">${itemData.price}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="text-white ml-2">{categories.find(c => c.value === itemData.category)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <span className="text-white ml-2">{conditions.find(c => c.value === itemData.condition)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="text-white ml-2">{itemData.postcode}</span>
                  </div>
                </div>

                {itemData.tags.length > 0 && (
                  <div>
                    <span className="text-gray-500 text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {itemData.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('MyItems'))}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Add New Item</h1>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
              <Button
            onClick={handleBack}
            disabled={currentStep === 1}
                variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
          ) : (
              <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                  </>
                ) : (
                  <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish Listing
                  </>
                )}
              </Button>
          )}
        </div>
      </div>
    </div>
  );
}
