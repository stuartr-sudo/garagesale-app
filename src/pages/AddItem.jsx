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
import { ArrowLeft, ArrowRight, Upload, Camera, Sparkles, CheckCircle, Loader2, X, Mic } from "lucide-react";
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
  const totalSteps = 7;
  
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
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState('description');
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

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

  const handleVoiceTranscript = async (transcript) => {
    // Store the voice transcription for AI optimization
    setVoiceTranscription(transcript);
    setHasVoiceInput(true);
    
    // If user specifically chose a field, use that
    if (voiceTargetField === 'title') {
      setItemData(prev => ({ 
        ...prev, 
        title: prev.title ? `${prev.title} - ${transcript}` : transcript 
      }));
    } else if (voiceTargetField === 'description') {
      // For description, append to existing content or replace if empty
      setItemData(prev => ({ 
        ...prev, 
        description: prev.description ? `${prev.description}\n\n${transcript}` : transcript 
      }));
    } else {
      // If no specific field chosen, intelligently parse the voice input
      try {
        const parsed = await parseVoiceInputIntelligently(transcript);
        
        setItemData(prev => ({
          ...prev,
          title: parsed.title ? (prev.title ? `${prev.title} - ${parsed.title}` : parsed.title) : prev.title,
          description: parsed.description ? (prev.description ? `${prev.description}\n\n${parsed.description}` : parsed.description) : prev.description
        }));
        
        toast({
          title: "Voice Input Processed!",
          description: `Intelligently extracted ${parsed.title ? 'title and ' : ''}description from your voice input.`,
        });
      } catch (error) {
        console.error('Error parsing voice input:', error);
        // Fallback to description field
        setItemData(prev => ({ 
          ...prev, 
          description: prev.description ? `${prev.description}\n\n${transcript}` : transcript 
        }));
      }
    }
    setShowVoiceInput(false);
  };

  const openVoiceInput = (field) => {
    setVoiceTargetField(field);
    setShowVoiceInput(true);
  };

  const parseVoiceInputIntelligently = async (voiceText) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Analyze this voice input from a seller describing their item: "${voiceText}"

Intelligently extract and structure the information:

1. TITLE: If the seller mentions a specific name, title, or product name, extract it. If not, create a concise title based on what they're describing.

2. DESCRIPTION: Extract all the descriptive details, features, condition, benefits, and selling points mentioned.

Rules:
- If the voice input is primarily about naming the item, focus on extracting/creating a good title
- If the voice input is primarily descriptive, focus on extracting details for description
- If the voice input contains both, extract both appropriately
- Keep titles under 60 characters
- Keep descriptions under 200 words
- Be natural and conversational in the description

Return in JSON format: {"title": "...", "description": "...", "confidence": "high/medium/low"}`
            }
          ],
          max_tokens: 300,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to parse voice input');
      }
      
      const result = JSON.parse(data.choices[0].message.content);
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

  const setMainImage = (index) => {
    setItemData(prev => {
      const newImages = [...prev.image_urls];
      // Move the selected image to the front (index 0)
      const [selectedImage] = newImages.splice(index, 1);
      newImages.unshift(selectedImage);
      
      return {
        ...prev,
        image_urls: newImages
      };
    });
  };

  const generateWithAI = async (field) => {
    // Check if we have an image to analyze
    if (!itemData.image_urls || itemData.image_urls.length === 0) {
      toast({
        title: "No Image",
        description: "Please upload at least one image first.",
        variant: "destructive"
      });
      return;
    }

    const mainImageUrl = itemData.image_urls[0];

    if (field === 'both') {
      setIsGeneratingContent(true);
      try {
        // Enhanced prompt for superior product recognition and listing generation
        let promptText = `Carefully analyze this product image and provide the following:

**TITLE (max 60 characters):**
Create a concise, searchable title using this exact format:
[Brand] [Model/Product Type] - [1-2 Key Features] ([Condition])

Guidelines:
- Start with brand name if visible/identifiable
- Include specific model numbers or product names
- Add distinguishing features (color, size, capacity)
- Use marketplace-friendly language (avoid special characters)
- Prioritize searchability over creativity

**DESCRIPTION (150-200 words):**
Write a compelling, structured description with:

1. OPENING: Lead with the product's main value proposition
2. SPECIFICATIONS: List key technical details, dimensions, materials
3. CONDITION: Assess and describe condition honestly (New/Like New/Excellent/Good/Fair/Poor)
   - Note any visible wear, damage, or defects
   - Highlight if original packaging/accessories are visible
4. FEATURES & BENEFITS: Emphasize what makes this product desirable
5. USE CASES: Briefly mention who this is ideal for or how it's used

Style requirements:
- Use clear, professional language
- Write in third person or direct product description style
- Include specific measurements if visible
- Mention colors, materials, and finishes accurately
- Avoid exaggeration or unverifiable claims
- Use bullet points for technical specs if needed

**CATEGORY SUGGESTION:**
Recommend the most appropriate marketplace category (e.g., "Electronics > Cameras", "Home & Garden > Furniture")

**QUALITY CHECK:**
If image quality is poor or product is unclear, state: "Image quality insufficient - [specific issue]" and provide best-effort analysis.`;
        
        if (hasVoiceInput && voiceTranscription) {
          promptText += `\n\nIMPORTANT: The seller has provided additional context via voice input: "${voiceTranscription}"\n\nUse this voice context to enhance your analysis:\n- If the seller mentions a specific brand, model, or product name, prioritize that information\n- Incorporate the seller's description of condition, features, and use cases\n- The voice input contains the seller's personal knowledge - use it to make the listing more accurate and authentic\n- Combine visual analysis with the seller's verbal description for the most complete product understanding`;
        }
        
        promptText += '\n\nReturn in JSON format: {"title": "...", "description": "...", "category_suggestion": "...", "quality_note": "..."}';

        // Generate both title and description in a single AI call
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: promptText
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: mainImageUrl,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 500,
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to analyze image');
        }
        
        const result = JSON.parse(data.choices[0].message.content);
        const generatedTitle = result.title?.trim().replace(/^["']|["']$/g, '') || '';
        const generatedDescription = result.description?.trim() || '';
        const categorySuggestion = result.category_suggestion?.trim() || '';
        const qualityNote = result.quality_note?.trim() || '';
        
        setItemData(prev => ({ 
          ...prev, 
          // Append to existing title if it exists, otherwise use generated title
          title: prev.title ? `${prev.title} - ${generatedTitle}` : generatedTitle,
          // Append to existing description if it exists, otherwise use generated description
          description: prev.description ? `${prev.description}\n\n${generatedDescription}` : generatedDescription
        }));
        
        // Show category suggestion if provided
        if (categorySuggestion) {
          toast({
            title: "Category Suggestion",
            description: `AI suggests: ${categorySuggestion}`,
            duration: 5000
          });
        }
        
        // Show quality note if there are issues
        if (qualityNote && qualityNote.includes('insufficient')) {
          toast({
            title: "Image Quality Note",
            description: qualityNote,
            variant: "destructive",
            duration: 7000
          });
        }
        toast({ 
          title: "Success!", 
          description: hasVoiceInput ? "Title and description generated using both image and voice input!" : "Title and description generated from image with AI." 
        });
      } catch (error) {
        console.error("Error generating content:", error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to generate content.", 
          variant: "destructive" 
        });
      } finally {
        setIsGeneratingContent(false);
      }
    } else if (field === 'title') {
      setIsGeneratingContent(true);
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this product image and create a concise, searchable title (max 60 characters) using this format:
[Brand] [Model/Product Type] - [1-2 Key Features] ([Condition])

Guidelines:
- Start with brand name if visible/identifiable
- Include specific model numbers or product names
- Add distinguishing features (color, size, capacity)
- Use marketplace-friendly language (avoid special characters)
- Prioritize searchability over creativity

Return only the title, nothing else.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: mainImageUrl,
                      detail: 'low'
                    }
                  }
                ]
              }
            ],
            max_tokens: 100
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to analyze image');
        }
        
        const generatedTitle = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        
        setItemData(prev => ({ 
          ...prev, 
          title: prev.title ? `${prev.title} - ${generatedTitle}` : generatedTitle 
        }));
        toast({ title: "Success!", description: "Title generated from image with AI." });
      } catch (error) {
        console.error("Error generating title:", error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to generate title.", 
          variant: "destructive" 
        });
      } finally {
        setIsGeneratingContent(false);
      }
    } else if (field === 'description') {
      setIsGeneratingContent(true);
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this product image and write a compelling, structured description (150-200 words) with:

1. OPENING: Lead with the product's main value proposition
2. SPECIFICATIONS: List key technical details, dimensions, materials
3. CONDITION: Assess and describe condition honestly (New/Like New/Excellent/Good/Fair/Poor)
   - Note any visible wear, damage, or defects
   - Highlight if original packaging/accessories are visible
4. FEATURES & BENEFITS: Emphasize what makes this product desirable
5. USE CASES: Briefly mention who this is ideal for or how it's used

Style requirements:
- Use clear, professional language
- Write in third person or direct product description style
- Include specific measurements if visible
- Mention colors, materials, and finishes accurately
- Avoid exaggeration or unverifiable claims
- Use bullet points for technical specs if needed

Return only the description, nothing else.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: mainImageUrl,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 400
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to analyze image');
        }
        
        const generatedDescription = data.choices[0].message.content.trim();
        
        setItemData(prev => ({ 
          ...prev, 
          description: prev.description ? `${prev.description}\n\n${generatedDescription}` : generatedDescription 
        }));
        toast({ title: "Success!", description: "Description generated from image with AI." });
      } catch (error) {
        console.error("Error generating description:", error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to generate description.", 
          variant: "destructive" 
        });
      } finally {
        setIsGeneratingContent(false);
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
      case 5: {
        // Collection address is always required
        if (!itemData.collection_address.trim()) return false;
        
        // If flexible collection, no date validation needed
        if (itemData.collection_flexible) return true;
        
        // If specific date, validate it's set and within 14 days
        if (!itemData.collection_date) return false;
        
        const collectionDate = new Date(itemData.collection_date);
        const now = new Date();
        const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        return collectionDate >= now && collectionDate <= maxDate;
      }
      case 6: return true;
      case 7: return ownershipConfirmed;
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
        status: 'active',
        collection_date: itemData.collection_flexible ? null : itemData.collection_date,
        collection_address: itemData.collection_address,
        collection_flexible: itemData.collection_flexible
      };

      const { data: newItem, error: itemError } = await supabase
        .from('items')
        .insert([itemPayload])
        .select()
        .single();

      if (itemError) throw itemError;

      // Create item_knowledge entry with voice transcription data
      const knowledgePayload = {
        item_id: newItem.id,
        minimum_price: itemData.minimum_price ? parseFloat(itemData.minimum_price) : null,
        negotiation_enabled: !!itemData.minimum_price,
        selling_points: [itemData.title, itemData.condition, itemData.category],
        additional_info: {
          voice_transcription: hasVoiceInput ? voiceTranscription : null,
          has_voice_input: hasVoiceInput,
          created_with_voice: hasVoiceInput
        }
      };

      const { error: knowledgeError } = await supabase
        .from('item_knowledge')
        .insert([knowledgePayload]);

      if (knowledgeError) console.error("Error creating item_knowledge:", knowledgeError);

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
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Add Photos</h2>
              <p className="text-gray-400 text-sm">Upload images of your item. Click "Set as Main" on any image to make it the main photo.</p>
          </div>

                <ImageUpload
                  images={itemData.image_urls}
                  onUpload={handleImageUpload}
                  onRemove={removeImage}
                  onSetMain={setMainImage}
                  isUploading={isUploading}
                />

          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Title & Description</h2>
              <p className="text-gray-400 text-sm">Tell buyers about your item</p>
            </div>

            {/* Image Preview */}
            {itemData.image_urls.length > 0 && (
              <div className="mb-4">
                <Label className="text-gray-300 mb-2 block text-sm">Your Listing Preview</Label>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={itemData.image_urls[0]}
                        alt="Item preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                        {itemData.title || "Your item title will appear here"}
                      </h3>
                      <p className="text-gray-400 text-xs line-clamp-2">
                        {itemData.description || "Your item description will appear here"}
                      </p>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-green-400">
                          ${itemData.price || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Generation Button - Always Visible */}
            <div className="flex justify-center mb-4">
              <Button
                type="button"
                onClick={() => generateWithAI('both')}
                disabled={isGeneratingContent}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 text-white border-purple-500 hover:border-purple-400 transition-all duration-200"
              >
                {isGeneratingContent ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {hasVoiceInput ? "Generate with AI + Voice" : "Generate with AI"}
                  </>
                )}
              </Button>
            </div>

            {/* Voice Input Buttons */}
            {/* Voice Input Status */}
            {hasVoiceInput && voiceTranscription && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium text-sm">Voice input captured!</span>
                </div>
                <p className="text-gray-300 text-xs mb-2">
                  Your voice description will be used to enhance the AI-generated content.
                </p>
                <div className="p-2 bg-gray-800 rounded text-xs text-gray-300">
                  "{voiceTranscription.substring(0, 80)}{voiceTranscription.length > 80 ? '...' : ''}"
                </div>
              </div>
            )}


            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Button
                  type="button"
                  onClick={() => openVoiceInput('title')}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/20 transition-all duration-200"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  Voice
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
                  onClick={() => openVoiceInput('description')}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/20 transition-all duration-200"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  Voice
                </Button>
              </div>
              <Textarea
                id="description"
                value={itemData.description}
                onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your item in detail..."
                rows={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Pricing</h2>
              <p className="text-gray-400 text-sm">Set your price and minimum offer</p>
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
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Details</h2>
              <p className="text-gray-400 text-sm">Category, condition, and location</p>
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
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Collection Details</h2>
              <p className="text-gray-400 text-sm">When and where can buyers collect this item?</p>
            </div>

            {/* Collection Type Selection */}
            <div className="space-y-3">
              <Label className="text-gray-300">Collection Arrangement *</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="collection_type"
                    checked={!itemData.collection_flexible}
                    onChange={() => setItemData(prev => ({ ...prev, collection_flexible: false }))}
                    className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
                  />
                  <div>
                    <p className="text-white font-medium">Specific Collection Date</p>
                    <p className="text-xs text-gray-400">Choose when buyers can collect (within 14 days)</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="collection_type"
                    checked={itemData.collection_flexible}
                    onChange={() => setItemData(prev => ({ ...prev, collection_flexible: true, collection_date: "" }))}
                    className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 focus:ring-pink-500"
                  />
                  <div>
                    <p className="text-white font-medium">Flexible Pickup</p>
                    <p className="text-xs text-gray-400">Buyer will contact you to arrange collection time</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Specific Date Picker (only show if not flexible) */}
            {!itemData.collection_flexible && (
              <div className="space-y-2">
                <Label htmlFor="collection_date" className="text-gray-300">Collection Date *</Label>
                <Input
                  id="collection_date"
                  type="datetime-local"
                  value={itemData.collection_date}
                  onChange={(e) => setItemData(prev => ({ ...prev, collection_date: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                  max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500">
                  Choose a date and time when buyers can collect the item (must be within 14 days of listing)
                </p>
                {itemData.collection_date && (() => {
                  const collectionDate = new Date(itemData.collection_date);
                  const now = new Date();
                  const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                  
                  if (collectionDate < now) {
                    return (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Collection date cannot be in the past
                      </p>
                    );
                  }
                  
                  if (collectionDate > maxDate) {
                    return (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Collection date cannot be more than 14 days from today
                      </p>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="collection_address" className="text-gray-300">Collection Address *</Label>
              <Textarea
                id="collection_address"
                value={itemData.collection_address}
                onChange={(e) => setItemData(prev => ({ ...prev, collection_address: e.target.value }))}
                placeholder="Enter the full address where buyers can collect the item..."
                rows={3}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Provide the complete address including street, suburb, and postcode
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0">ℹ️</div>
                <div>
                  <h3 className="text-blue-400 font-medium mb-1">Collection Information</h3>
                  <p className="text-blue-200 text-sm">
                    Buyers will see this information when they purchase your item. 
                    Make sure the date and address are accurate and accessible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-white mb-1">Review & Confirm</h2>
              <p className="text-gray-400 text-sm">Check your listing before publishing</p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 space-y-3">
                {itemData.image_urls[0] && (
                  <img src={itemData.image_urls[0]} alt="Main" className="w-full h-32 object-cover rounded-lg" />
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

                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-gray-300 font-medium mb-2">Collection Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Collection Date:</span>
                      <span className="text-white ml-2">
                        {itemData.collection_date 
                          ? new Date(itemData.collection_date).toLocaleString('en-AU', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not set'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Collection Address:</span>
                      <span className="text-white ml-2 block mt-1">{itemData.collection_address}</span>
                    </div>
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

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Ownership Confirmation</h2>
              <p className="text-gray-400">Please confirm that you are the legal owner of this item</p>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Legal Ownership</h3>
                      <p className="text-gray-400 text-sm">You must be the legal owner of this item to list it for sale.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Authentic Item</h3>
                      <p className="text-gray-400 text-sm">The item must be authentic and not counterfeit or stolen.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Right to Sell</h3>
                      <p className="text-gray-400 text-sm">You have the legal right to sell this item and transfer ownership.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-yellow-200 font-semibold mb-1">Important Notice</h4>
                      <p className="text-yellow-100 text-sm">
                        By confirming ownership, you declare that you are the legal owner of this item and have the right to sell it. 
                        Listing stolen or counterfeit items is prohibited and may result in account suspension.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Processing Fee Notice */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5">💳</div>
                    <div>
                      <h4 className="text-blue-200 font-semibold mb-2">Payment Processing Fee</h4>
                      <p className="text-blue-100 text-sm mb-2">
                        When your item is sold via credit card payment, a 5% processing fee will be deducted from your payout to cover secure payment processing and fraud protection.
                      </p>
                      <div className="text-blue-200 text-xs">
                        <p className="font-medium mb-1">Example:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Item sells for $100 → You receive $95 (5% fee deducted)</li>
                          <li>Item sells for $50 → You receive $47.50 (5% fee deducted)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Card Hold Notice */}
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5">⏰</div>
                    <div>
                      <h4 className="text-yellow-200 font-semibold mb-2">Credit Card Payment Hold</h4>
                      <p className="text-yellow-100 text-sm mb-2">
                        Credit card payments are held for 14 days to prevent chargebacks and ensure secure transactions.
                      </p>
                      <div className="text-yellow-200 text-xs">
                        <p className="font-medium mb-1">Important Terms:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Payments are held for 14 days before release</li>
                          <li>Any chargebacks will be charged directly to your account</li>
                          <li>This protects both you and the buyer from fraud</li>
                          <li>Bank transfers and crypto payments are not subject to holds</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ownershipConfirmed}
                      onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                      className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="text-white font-medium">
                      I confirm that I am the legal owner of this item and have the right to sell it
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('MyItems'))}
            className="text-gray-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-white mb-2">Add New Item</h1>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-1" />
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 mb-4">
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

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInputField
          onTranscript={handleVoiceTranscript}
          onClose={() => setShowVoiceInput(false)}
          targetField={voiceTargetField}
        />
      )}
    </div>
  );
}
