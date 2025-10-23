import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Loader2, X, Mic, MicOff, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "../components/additem/ImageUpload";
import VoiceInputField from "../components/additem/VoiceInputField";
import { syncItemWithKnowledgeBase, updateKnowledgeWithVoiceData, extractSellingPointsFromVoice, generateFAQsFromVoice } from "@/utils/knowledgeSync";

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

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [itemLoaded, setItemLoaded] = useState(false);
  
  // Voice input states
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState('description');
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(30); // 30 seconds max
  
  const [itemData, setItemData] = useState({
    title: "",
    description: "",
    price: "",
    minimum_price: "",
    condition: "good",
    category: "other",
    location: "",
    tags: [],
    image_urls: []
  });

  // Safety function to ensure arrays are always arrays
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') {
      // Handle both comma-separated strings and single URLs
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return [value];
      }
      return value.split(',').filter(Boolean);
    }
    return [];
  };

  // Safety function to ensure string values
  const ensureString = (value) => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
  };

  useEffect(() => {
    loadUserAndItem();
  }, [id]);

  const loadUserAndItem = async () => {
    try {
      setIsLoading(true);
      
      // Load current user
      const user = await User.me();
      setCurrentUser(user);
      
      // Load item details
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (!item) {
        throw new Error("Item not found");
      }
      
      // Verify ownership - only seller can edit their own items
      if (item.seller_id !== user.id) {
        toast({
          title: "Access Denied",
          description: "You can only edit your own listings.",
          variant: "destructive"
        });
        navigate(createPageUrl('MyItems'));
        return;
      }
      
      // Filter out invalid/blob URLs and ensure we have valid image URLs
      let validImageUrls = [];
      if (Array.isArray(item.image_urls)) {
        validImageUrls = item.image_urls.filter(url => {
          if (!url || typeof url !== 'string') return false;
          // Filter out blob URLs and ensure we have proper URLs
          return url.startsWith('http://') || url.startsWith('https://');
        });
      } else if (item.image_urls && typeof item.image_urls === 'string') {
        // Handle case where image_urls might be a single string instead of array
        const url = item.image_urls;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          validImageUrls = [url];
        }
      }
      
      console.log("Loaded item data:", {
        title: item.title,
        imageCount: validImageUrls.length,
        tags: item.tags,
        image_urls: item.image_urls,
        image_urls_type: typeof item.image_urls,
        is_array: Array.isArray(item.image_urls)
      });
      
      // Populate form with existing data - with BULLETPROOF validation
      const newItemData = {
        title: ensureString(item.title),
        description: ensureString(item.description),
        price: ensureString(item.price),
        minimum_price: ensureString(item.minimum_price),
        condition: ensureString(item.condition) || "good",
        category: ensureString(item.category) || "other",
        location: ensureString(item.location) || ensureString(user.postcode),
        tags: ensureArray(item.tags),
        image_urls: ensureArray(validImageUrls)
      };
      
      console.log("Setting item data:", newItemData);
      
      // Final safety check before setting data
      if (!Array.isArray(newItemData.image_urls)) {
        console.error("image_urls is not an array:", newItemData.image_urls);
        newItemData.image_urls = [];
      }
      
      setItemData(newItemData);
      setItemLoaded(true);
      
    } catch (error) {
      console.error("Error loading item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load item details",
        variant: "destructive"
      });
      navigate(createPageUrl('MyItems'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload images.",
          variant: "destructive"
        });
        return;
      }

      const uploadedUrls = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
      
      setItemData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls]
      }));

      toast({
        title: "Success!",
        description: `${uploadedUrls.length} image(s) uploaded successfully`
      });

    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images",
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

  // Voice input handlers
  const handleVoiceTranscript = async (transcript) => {
    setVoiceTranscription(transcript);
    setHasVoiceInput(true);
    
    // Apply voice input to the appropriate field
    if (voiceTargetField === 'title') {
      setItemData(prev => ({ 
        ...prev, 
        title: prev.title ? `${prev.title} - ${transcript}` : transcript 
      }));
    } else if (voiceTargetField === 'description') {
      setItemData(prev => ({ 
        ...prev, 
        description: prev.description ? `${prev.description}\n\n${transcript}` : transcript 
      }));
    } else {
      // For general updates, intelligently parse the voice input
      try {
        const parsed = await parseVoiceInputIntelligently(transcript);
        
        setItemData(prev => ({
          ...prev,
          title: parsed.title ? (prev.title ? `${prev.title} - ${parsed.title}` : parsed.title) : prev.title,
          description: parsed.description ? (prev.description ? `${prev.description}\n\n${parsed.description}` : parsed.description) : prev.description
        }));
        
        toast({
          title: "Voice Input Processed",
          description: `AI has intelligently parsed your voice input and updated the relevant fields.`,
        });
      } catch (error) {
        console.error('Error parsing voice input:', error);
        // Fallback: just use the voice text as description
        setItemData(prev => ({ 
          ...prev, 
          description: prev.description ? `${prev.description}\n\n${transcript}` : transcript 
        }));
      }
    }
    
    setShowVoiceInput(false);
  };

  const parseVoiceInputIntelligently = async (voiceText) => {
    try {
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not available');
      }

      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Parse this voice input about editing an item listing. Extract title updates and description updates separately.

Voice input: "${voiceText}"

Return JSON with:
- title: Any title updates or additions
- description: Any description updates or additions

Example: {"title": "Vintage Leather Jacket - Excellent Condition", "description": "This is a beautiful vintage leather jacket in excellent condition with minimal wear."}

Return only JSON, no other text.`
        }],
        temperature: 0.3,
        max_tokens: 200
      });

      const data = response.choices[0].message.content;
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to parse voice input');
      }
      
      const result = JSON.parse(data);
      return {
        title: result.title?.trim() || '',
        description: result.description?.trim() || '',
        confidence: result.confidence || 'medium'
      };
    } catch (error) {
      console.error('Error parsing voice input:', error);
      // Fallback: just use the voice text as description
      return {
        title: '',
        description: voiceText,
        confidence: 'low'
      };
    }
  };

  const startRecording = () => {
    setRecordingTime(0);
    setIsRecording(true);
    setShowVoiceInput(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  // Recording timer effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime) {
            setIsRecording(false);
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxRecordingTime]);

  const handleSubmit = async () => {
    // Validation
    if (!itemData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a title for your item",
        variant: "destructive"
      });
      return;
    }

    if (!itemData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a description",
        variant: "destructive"
      });
      return;
    }

    if (!itemData.price || parseFloat(itemData.price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    if (itemData.image_urls.length === 0) {
      toast({
        title: "Missing Images",
        description: "Please upload at least one image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the item
      const { error: updateError } = await supabase
        .from('items')
        .update({
          title: itemData.title.trim(),
          description: itemData.description.trim(),
          price: parseFloat(itemData.price),
          minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
          condition: itemData.condition,
          category: itemData.category,
          location: itemData.location || null,
          tags: itemData.tags,
          image_urls: itemData.image_urls,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('seller_id', currentUser.id); // Extra safety check

      if (updateError) throw updateError;

      // Sync with knowledge base
      const syncResult = await syncItemWithKnowledgeBase(id, {
        minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
        title: itemData.title.trim(),
        description: itemData.description.trim(),
        condition: itemData.condition,
        category: itemData.category
      });

      if (!syncResult.success) {
        console.warn('Knowledge base sync failed:', syncResult.error);
        // Don't fail the whole operation, just log the warning
      }

      // If voice input was provided, update knowledge base with voice data
      if (hasVoiceInput && voiceTranscription) {
        const voiceResult = await updateKnowledgeWithVoiceData(id, voiceTranscription);
        
        if (voiceResult.success) {
          // Extract selling points and FAQs from voice input
          try {
            const sellingPoints = await extractSellingPointsFromVoice(voiceTranscription, itemData.title);
            const faqs = await generateFAQsFromVoice(voiceTranscription, itemData.title);
            
            // Update knowledge base with AI-generated content
            if (sellingPoints.length > 0 || Object.keys(faqs).length > 0) {
              const { error: knowledgeUpdateError } = await supabase
                .from('item_knowledge')
                .update({
                  selling_points: sellingPoints.length > 0 ? sellingPoints : null,
                  faqs: Object.keys(faqs).length > 0 ? faqs : null,
                  updated_at: new Date().toISOString()
                })
                .eq('item_id', id);

              if (knowledgeUpdateError) {
                console.warn('Failed to update knowledge base with AI content:', knowledgeUpdateError);
              }
            }
          } catch (error) {
            console.warn('Failed to generate AI content from voice:', error);
          }
        }
      }

      toast({
        title: "Success!",
        description: "Your listing and AI agent knowledge have been updated"
      });

      navigate(createPageUrl('MyItems'));

    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading screen until item is fully loaded
  if (isLoading || !itemLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading item details...</p>
        </div>
      </div>
    );
  }
  
  // Double-check that we have valid data
  if (!itemData.title || !Array.isArray(itemData.image_urls)) {
    console.error("Invalid item data:", {
      title: itemData.title,
      image_urls: itemData.image_urls,
      isArray: Array.isArray(itemData.image_urls)
    });
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Error: Invalid item data</p>
          <Button
            onClick={() => navigate(createPageUrl('MyItems'))}
            className="mt-4"
          >
            Back to My Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('MyItems'))}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Items
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Edit Listing
          </h1>
          <p className="text-gray-400">
            Update your item information
          </p>
        </div>

        {/* Form Content */}
        <Card className="bg-gray-900 border-gray-800 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-white text-lg">Item Title *</Label>
              <Input
                id="title"
                value={itemData.title}
                onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Vintage Leather Jacket"
                className="mt-2 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{itemData.title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white text-lg">Description *</Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  id="description"
                  value={itemData.description}
                  onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your item in detail..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 min-h-[150px]"
                  maxLength={1000}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setVoiceTargetField('description');
                      startRecording();
                    }}
                    disabled={isRecording}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white p-2"
                    title="Add voice description"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  {hasVoiceInput && (
                    <div className="text-xs text-cyan-400 text-center">
                      Voice added
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{itemData.description.length}/1000 characters</p>
            </div>

            {/* Price and Minimum Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-white text-lg">Asking Price * ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemData.price}
                  onChange={(e) => setItemData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="mt-2 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="minimum_price" className="text-white text-lg">Minimum Price ($)</Label>
                <Input
                  id="minimum_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemData.minimum_price}
                  onChange={(e) => setItemData(prev => ({ ...prev, minimum_price: e.target.value }))}
                  placeholder="Optional - for AI negotiation"
                  className="mt-2 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">AI agent won't go below this price</p>
              </div>
            </div>

            {/* Condition and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white text-lg">Condition *</Label>
                <Select value={itemData.condition} onValueChange={(value) => setItemData(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {conditions.map(condition => (
                      <SelectItem key={condition.value} value={condition.value} className="text-white hover:bg-gray-700">
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white text-lg">Category *</Label>
                <Select value={itemData.category} onValueChange={(value) => setItemData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value} className="text-white hover:bg-gray-700">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-white text-lg">Location</Label>
              <Input
                id="location"
                value={itemData.location}
                onChange={(e) => setItemData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., London, UK or SW1A 1AA"
                className="mt-2 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>

            {/* Voice Input Section */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white text-lg">Voice Updates</Label>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Max 30 seconds
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Use voice to add additional details, selling points, or update your listing description.
                The AI will intelligently parse your voice input and update the relevant fields.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setVoiceTargetField('general');
                    startRecording();
                  }}
                  disabled={isRecording}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Recording... ({recordingTime}s)
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Voice Update
                    </>
                  )}
                </Button>
                {isRecording && (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Stop Recording
                  </Button>
                )}
              </div>
              {hasVoiceInput && (
                <div className="mt-3 p-3 bg-cyan-900/20 border border-cyan-700 rounded-lg">
                  <p className="text-sm text-cyan-300 mb-2">Voice input processed:</p>
                  <p className="text-sm text-gray-300 italic">"{voiceTranscription}"</p>
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <Label className="text-white text-lg">Photos *</Label>
              <p className="text-sm text-gray-400 mb-3">Upload images of your item (max 5)</p>
              
              {(!itemData.image_urls || itemData.image_urls.length < 5) && (
                <ImageUpload 
                  images={itemData.image_urls || []}
                  onUpload={handleImageUpload}
                  onRemove={removeImage}
                  isUploading={isUploading}
                />
              )}

              {(() => {
                const safeImageUrls = ensureArray(itemData.image_urls);
                return safeImageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {safeImageUrls
                      .filter(url => url && typeof url === 'string')
                      .map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group">
                      <img 
                        src={url} 
                        alt={`Item ${index + 1}`} 
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-700"
                        onError={(e) => {
                          console.error('Image load error:', url);
                          // Remove the broken image from the array
                          setItemData(prev => ({
                            ...prev,
                            image_urls: prev.image_urls.filter((_, i) => i !== index)
                          }));
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', url);
                        }}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-cyan-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                );
              })()}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-700 flex gap-4">
              <Button
                onClick={() => navigate(createPageUrl('MyItems'))}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInputField
          isOpen={showVoiceInput}
          onClose={() => setShowVoiceInput(false)}
          onTranscript={handleVoiceTranscript}
          maxDuration={maxRecordingTime}
          targetField={voiceTargetField}
        />
      )}
    </div>
  );
}

