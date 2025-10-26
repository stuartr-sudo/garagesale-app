import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, Loader2, X, Mic, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "../components/additem/ImageUpload";
import VoiceInputField from "../components/additem/VoiceInputField";

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
  const totalSteps = 3; // Changed from 7 to 3
  
  const [itemData, setItemData] = useState({
    title: "",
    description: "",
    price: "",
    minimum_price: "",
    condition: "good",
    category: "other",
    postcode: "",
    tags: [],
    image_urls: [],
    collection_date: "",
    collection_address: "",
    collection_flexible: false
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState('main'); // 'main' or 'additional'
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
      if (user.collection_address) {
        setItemData(prev => ({ ...prev, collection_address: user.collection_address }));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  // Voice input handler
  const handleVoiceTranscript = (transcript) => {
    setVoiceTranscription(transcript);
    setHasVoiceInput(true);
    setShowVoiceInput(false);

    toast({
      title: "Voice Input Captured! 🎤",
      description: "Your voice description will enhance the AI analysis.",
    });
  };

  // Add more details voice handler (appends to description)
  const handleAdditionalVoice = (transcript) => {
      setItemData(prev => ({ 
        ...prev, 
      description: prev.description 
        ? `${prev.description}\n\n${transcript}` 
        : transcript
    }));
    setShowVoiceInput(false);
    
    toast({
      title: "Details Added! 🎤",
      description: "Additional information appended to description.",
    });
  };

  // Combined AI Analysis (Voice + Images)
  const analyzeWithVoiceAndImages = async () => {
    if (itemData.image_urls.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image first.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call Supabase Edge Function (secure, server-side)
      const { data: analysis, error } = await supabase.functions.invoke('analyze-image-with-voice', {
        body: {
          imageUrl: itemData.image_urls[0], // Main image
          voiceTranscript: voiceTranscription || null
        }
      });

      if (error) {
        throw new Error(error.message || 'Analysis failed');
      }
      
      if (!analysis.success) {
        throw new Error(analysis.error || 'Analysis failed');
      }

      // Auto-fill all fields
        setItemData(prev => ({
          ...prev,
        title: analysis.title || prev.title,
        description: analysis.description || prev.description,
        price: analysis.price?.toString() || prev.price,
        minimum_price: analysis.minimum_price?.toString() || prev.minimum_price,
        category: analysis.category || prev.category,
        condition: analysis.condition || prev.condition,
        tags: analysis.tags || prev.tags
      }));

      setAiGenerated(true);
        
        toast({
        title: "AI Analysis Complete! ✨",
        description: `Generated ${hasVoiceInput ? 'with voice + images' : 'from images'}. Review and edit as needed.`,
        });

      } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Image compression helper
  const compressImage = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Image upload handler
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
        setIsUploading(false);
        return;
      }

      const uploadedUrls = [];
      
      for (const file of files) {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        const fileExt = 'jpg';
        const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(filePath, compressedFile);

        if (error) throw error;

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
        description: "Failed to upload images. Please try again.",
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

  const setMainImage = (index) => {
    setItemData(prev => {
      const newImages = [...prev.image_urls];
      const [mainImage] = newImages.splice(index, 1);
      return {
        ...prev,
        image_urls: [mainImage, ...newImages]
      };
    });
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !itemData.tags.includes(tagInput.trim().toLowerCase())) {
      setItemData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
        setItemData(prev => ({ 
          ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Navigation
  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      // Validate before moving forward
      if (stepNumber > currentStep) {
        if (currentStep === 1 && itemData.image_urls.length === 0) {
          toast({
            title: "Images Required",
            description: "Please upload at least one image.",
            variant: "destructive"
          });
          return;
        }
        if (currentStep === 2) {
          if (!itemData.title || !itemData.description || !itemData.price) {
          toast({
              title: "Required Fields",
              description: "Please fill in title, description, and price.",
          variant: "destructive" 
        });
            return;
          }
        }
      }
      setCurrentStep(stepNumber);
    }
  };

  const goToNextStep = () => {
    goToStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    goToStep(currentStep - 1);
  };

  // Submit handler
  const handleSubmit = async () => {
    // Final validation
    if (!ownershipConfirmed) {
        toast({ 
        title: "Confirmation Required",
        description: "Please confirm ownership of the item.",
          variant: "destructive" 
        });
      return;
    }

    if (!itemData.collection_date || !itemData.collection_address) {
        toast({ 
        title: "Collection Details Required",
        description: "Please provide collection date and address.",
          variant: "destructive" 
        });
      return;
    }

    setIsSubmitting(true);

    try {
      const itemPayload = {
        title: itemData.title,
        description: itemData.description,
        price: parseFloat(itemData.price),
        condition: itemData.condition,
        category: itemData.category,
        location: itemData.postcode,
        image_urls: itemData.image_urls,
        seller_id: currentUser.id,
        status: 'active',
        collection_date: itemData.collection_date,
        collection_address: itemData.collection_address,
        collection_flexible: itemData.collection_flexible,
        tags: itemData.tags
      };

      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert([itemPayload])
        .select()
        .single();

      if (itemError) throw itemError;

      // Create item_knowledge entry
      const knowledgePayload = {
        item_id: newItem.id,
        minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
        negotiation_enabled: !!itemData.minimum_price,
        selling_points: itemData.tags,
        additional_info: {
          voice_transcription: hasVoiceInput ? voiceTranscription : null,
          has_voice_input: hasVoiceInput,
          ai_generated: aiGenerated
        }
      };

      const { error: knowledgeError } = await supabase
        .from('item_knowledge')
        .insert([knowledgePayload]);

      if (knowledgeError) console.error("Error creating item_knowledge:", knowledgeError);

      toast({
        title: "Success! 🎉",
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

  // Step indicator breadcrumbs
  const renderStepIndicator = () => (
    <div className="flex justify-center gap-2 sm:gap-4 mb-6">
      {[1, 2, 3].map(step => (
        <button
          key={step}
          onClick={() => goToStep(step)}
          disabled={isSubmitting}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
            currentStep === step 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
              : currentStep > step
              ? 'bg-green-900/30 text-green-400 border border-green-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <span className="font-bold">{step}</span>
          <span className="text-xs sm:text-sm hidden sm:inline">
            {step === 1 ? 'Images' : step === 2 ? 'Details' : 'Collection'}
          </span>
          {currentStep > step && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
        </button>
      ))}
    </div>
  );

  // Step 1: Upload Images
  const renderStep1 = () => (
          <div className="space-y-4">
            <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Upload Photos</h2>
        <p className="text-gray-400 text-sm">Add images of your item. First image will be the main photo.</p>
          </div>

                <ImageUpload
                  images={itemData.image_urls}
                  onUpload={handleImageUpload}
                  onRemove={removeImage}
                  onSetMain={setMainImage}
                  isUploading={isUploading}
                />

                {itemData.image_urls.length > 0 && (
        <div className="text-center text-sm text-green-400 flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {itemData.image_urls.length} image{itemData.image_urls.length > 1 ? 's' : ''} uploaded
                  </div>
                )}
          </div>
        );

  // Step 2: Voice + AI Content Generation
  const renderStep2 = () => (
    <div className="space-y-6">
            <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Item Details</h2>
        <p className="text-gray-400 text-sm">Add voice description or let AI generate from images</p>
            </div>

      {/* Voice Input Section */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
        <CardContent className="p-6">
          <div className="text-center">
            <Mic className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Add Voice Description</h3>
            <p className="text-gray-400 text-sm mb-4">
              Describe your item by voice to personalize the AI-generated content
            </p>
            
            {hasVoiceInput && voiceTranscription ? (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium text-sm">Voice captured!</span>
                      </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setVoiceTranscription('');
                      setHasVoiceInput(false);
                    }}
                    className="text-gray-400 hover:text-white h-7"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                    </div>
                <div className="p-2 bg-gray-800 rounded text-xs text-gray-300 text-left max-h-24 overflow-y-auto">
                  "{voiceTranscription}"
                  </div>
                </div>
            ) : null}
            
            <Button
              onClick={() => {
                setVoiceTargetField('main');
                setShowVoiceInput(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Mic className="w-4 h-4 mr-2" />
              {hasVoiceInput ? 'Re-record Voice' : 'Record Voice Description'}
            </Button>
              </div>
        </CardContent>
      </Card>

      {/* AI Generation Button */}
      <div className="flex justify-center">
              <Button
                type="button"
          onClick={analyzeWithVoiceAndImages}
          disabled={isAnalyzing || itemData.image_urls.length === 0}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
                  </>
                ) : (
                  <>
              <Sparkles className="w-5 h-5 mr-2" />
              {hasVoiceInput ? 'Generate with AI + Voice' : 'Generate with AI'}
                  </>
                )}
              </Button>
            </div>

      {aiGenerated && (
        <div className="text-center text-sm text-blue-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI-generated content - edit as needed below
              </div>
            )}

      {/* Editable Fields */}
      <div className="space-y-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-gray-300 mb-2 block">
            Title {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
          </Label>
              <Input
                id="title"
                value={itemData.title}
                onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., iPhone 12 Pro - 128GB Blue"
            className="bg-gray-900 border-gray-700 text-white"
            maxLength={50}
              />
          <p className="text-xs text-gray-500 mt-1">{itemData.title.length}/50 characters</p>
            </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-gray-300 mb-2 block">
            Description {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
          </Label>
              <Textarea
                id="description"
                value={itemData.description}
                onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your item's features, condition, and any important details..."
            className="bg-gray-900 border-gray-700 text-white min-h-[120px]"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{itemData.description.length}/500 characters</p>
            </div>

        {/* Price & Minimum Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="text-gray-300 mb-2 block">
              Price ($) {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
            </Label>
                    <Input
                      id="price"
                      type="number"
                      value={itemData.price}
                onChange={(e) => setItemData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="50"
              className="bg-gray-900 border-gray-700 text-white"
              min="0"
              step="0.01"
                    />
                </div>
          <div>
            <Label htmlFor="minimum_price" className="text-gray-300 mb-2 block">
              Minimum Price ($) {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
              </Label>
              <Input
                id="minimum_price"
                type="number"
                value={itemData.minimum_price}
                onChange={(e) => setItemData(prev => ({ ...prev, minimum_price: e.target.value }))}
              placeholder="35"
              className="bg-gray-900 border-gray-700 text-white"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">For negotiation</p>
            </div>
          </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">
              Category {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
            </Label>
            <Select
              value={itemData.category}
              onValueChange={(value) => setItemData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                <SelectContent>
                        {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
          <div>
            <Label className="text-gray-300 mb-2 block">
              Condition {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
            </Label>
            <Select
              value={itemData.condition}
              onValueChange={(value) => setItemData(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                <SelectContent>
                        {conditions.map(cond => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
          </div>
                  </div>

        {/* Tags */}
        <div>
          <Label className="text-gray-300 mb-2 block">
            Tags {aiGenerated && <Sparkles className="inline w-3 h-3 text-purple-400" />}
          </Label>
          <div className="flex gap-2 mb-2">
                    <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              className="border-gray-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
            </div>
          {itemData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {itemData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-sm text-purple-300"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              </div>
            )}
        </div>
      </div>

      {/* Additional Voice Notes */}
      <div className="text-center">
        <Button
          onClick={() => {
            setShowVoiceInput(true);
            setVoiceTargetField('additional');
          }}
          variant="outline"
          className="border-gray-700 text-gray-300"
        >
          <Mic className="w-4 h-4 mr-2" />
          Add More Details by Voice
        </Button>
      </div>
          </div>
        );

  // Step 3: Collection Details & Submit
  const renderStep3 = () => (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Collection Details</h2>
              <p className="text-gray-400 text-sm">When and where can buyers collect this item?</p>
            </div>

      <div className="space-y-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        {/* Category Dropdown */}
        <div>
          <Label className="text-gray-300 mb-2 block">Category *</Label>
          <Select value={itemData.category} onValueChange={(val) => setItemData(prev => ({ ...prev, category: val }))}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collection Date with visible calendar icon */}
        <div>
          <Label htmlFor="collection_date" className="text-gray-300 mb-2 block">
            Collection Date *
          </Label>
          <Input
            id="collection_date"
            type="date"
            value={itemData.collection_date}
            onChange={(e) => setItemData(prev => ({ ...prev, collection_date: e.target.value }))}
            className="bg-gray-900 border-gray-700 text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Collection Address (auto-filled from user settings) */}
        <div>
          <Label htmlFor="collection_address" className="text-gray-300 mb-2 block">
            Collection Address *
          </Label>
          <Textarea
            id="collection_address"
            value={itemData.collection_address}
            onChange={(e) => setItemData(prev => ({ ...prev, collection_address: e.target.value }))}
            placeholder="Enter the pickup location..."
            className="bg-gray-900 border-gray-700 text-white"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Full address will be revealed 24 hours before collection date
          </p>
        </div>

        {/* Suburb (not postcode) */}
        <div>
          <Label htmlFor="suburb" className="text-gray-300 mb-2 block">
            Suburb *
          </Label>
          <Input
            id="suburb"
            value={itemData.postcode}
            onChange={(e) => setItemData(prev => ({ ...prev, postcode: e.target.value }))}
            placeholder="e.g., Sydney"
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

                  <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="collection_flexible"
            checked={itemData.collection_flexible}
            onChange={(e) => setItemData(prev => ({ ...prev, collection_flexible: e.target.checked }))}
            className="mt-1"
          />
          <Label htmlFor="collection_flexible" className="text-gray-300 text-sm cursor-pointer">
            Collection time is flexible (buyers can arrange alternative times)
          </Label>
                  </div>

        <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="ownership"
              checked={ownershipConfirmed}
              onChange={(e) => setOwnershipConfirmed(e.target.checked)}
              className="mt-1"
            />
            <Label htmlFor="ownership" className="text-gray-300 text-sm cursor-pointer">
              I confirm that I own this item and have the right to sell it *
            </Label>
                    </div>
                    </div>
                  </div>

      {/* Summary Preview */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Listing Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Title:</span>
              <span className="text-white">{itemData.title || 'Not set'}</span>
                    </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Price:</span>
              <span className="text-green-400 font-semibold">${itemData.price || '0.00'}</span>
                    </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Category:</span>
              <span className="text-white">
                {categories.find(c => c.value === itemData.category)?.label || 'Other'}
              </span>
                  </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Condition:</span>
              <span className="text-white">
                {conditions.find(c => c.value === itemData.condition)?.label || 'Good'}
              </span>
                </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Images:</span>
              <span className="text-white">{itemData.image_urls.length}</span>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('MyItems'))}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Items
          </Button>
          <h1 className="text-2xl font-bold text-center mb-2">Create New Listing</h1>
          <p className="text-center text-gray-400 text-sm">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="p-6">
          {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
              <Button
                variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || isSubmitting}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={goToNextStep}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
          ) : (
              <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !ownershipConfirmed}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                  </>
                ) : (
                  <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Listing
                  </>
                )}
              </Button>
          )}
        </div>
      </div>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInputField
          onTranscript={voiceTargetField === 'additional' ? handleAdditionalVoice : handleVoiceTranscript}
          onClose={() => setShowVoiceInput(false)}
          targetField={voiceTargetField}
          placeholder={voiceTargetField === 'additional' ? 'Add more details...' : 'Describe your item...'}
        />
      )}
    </div>
  );
}
