
import React, { useState, useEffect } from "react";
import { Request } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Plus, X, Save, Briefcase } from "lucide-react";

import ImageUpload from "../components/additem/ImageUpload";

const categories = [
  { value: "home_repair", label: "Home Repair" },
  { value: "cleaning", label: "Cleaning" },
  { value: "gardening", label: "Gardening" },
  { value: "moving", label: "Moving" },
  { value: "handyman", label: "Handyman" },
  { value: "tutoring", label: "Tutoring" },
  { value: "pet_care", label: "Pet Care" },
  { value: "delivery", label: "Delivery" },
  { value: "tech_support", label: "Tech Support" },
  { value: "creative", label: "Creative" },
  { value: "other", label: "Other" }
];

const urgencyLevels = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent" }
];

const contactPreferences = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "message", label: "In-app Message" }
];

export default function AddRequest() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "other",
    urgency: "medium",
    location: "",
    timeline: "",
    tags: [],
    image_urls: [],
    contact_preference: "email"
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      // Pre-fill location if user has it in their profile
      if (user.city && user.state_region) {
        setRequestData(prev => ({
          ...prev,
          location: `${user.city}, ${user.state_region}`
        }));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !requestData.tags.includes(newTag.trim())) {
      setRequestData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setRequestData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (files) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return file_url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setRequestData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls]
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images. Please try again.");
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setRequestData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to post requests");
      return;
    }

    if (!requestData.title || !requestData.description || !requestData.budget) {
      alert("Please fill in the title, description, and budget");
      return;
    }

    setIsSubmitting(true);
    try {
      await Request.create({
        ...requestData,
        budget: parseFloat(requestData.budget),
        requester_id: currentUser.id,
        status: "active"
      });

      alert("Request posted successfully!");
      navigate(createPageUrl("Requests"));
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Error posting request. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Requests"))}
              className="rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">Post a Request</h1>
              <p className="text-lg text-gray-400 mt-1">Find local help for your tasks and projects</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Optional Images */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-6 h-6 text-pink-500" />
                  Photos (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ImageUpload
                  images={requestData.image_urls}
                  onUpload={handleImageUpload}
                  onRemove={handleRemoveImage}
                />
                <p className="text-sm text-gray-500 mt-4">
                  Add photos to help explain what needs to be done.
                </p>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-800/50 border-b border-gray-700">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Briefcase className="w-6 h-6 text-pink-500" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-400">Title *</Label>
                  <Input
                    id="title"
                    value={requestData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="What do you need help with?"
                    className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-400">Description *</Label>
                  <Textarea
                    id="description"
                    value={requestData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the work or task in detail..."
                    className="min-h-32 rounded-xl bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-gray-400">Budget *</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={requestData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      placeholder="0.00"
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeline" className="text-gray-400">Timeline</Label>
                    <Input
                      id="timeline"
                      value={requestData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      placeholder="e.g., Within 2 weeks, ASAP"
                      className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-400">Category</Label>
                    <Select
                      value={requestData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-gray-400">Priority</Label>
                    <Select
                      value={requestData.urgency}
                      onValueChange={(value) => handleInputChange('urgency', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {urgencyLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_preference" className="text-gray-400">Contact Method</Label>
                    <Select
                      value={requestData.contact_preference}
                      onValueChange={(value) => handleInputChange('contact_preference', value)}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {contactPreferences.map(pref => (
                          <SelectItem key={pref.value} value={pref.value}>
                            {pref.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-400">Location</Label>
                  <Input
                    id="location"
                    value={requestData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Where does this work need to be done?"
                    className="h-12 rounded-xl bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="text-gray-400">Tags</Label>
                  <div className="flex gap-2 flex-wrap">
                    {requestData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-cyan-900/50 text-cyan-300 border-cyan-700 px-3 py-1"
                      >
                        #{tag}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
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
                      className="flex-1 h-10 rounded-xl bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="px-4 rounded-xl bg-gray-800 border-gray-700 hover:bg-gray-700"
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
                onClick={() => navigate(createPageUrl("Requests"))}
                className="h-12 px-6 rounded-xl border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !requestData.title || !requestData.description || !requestData.budget}
                className="h-12 px-8 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting Request...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Post Request
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
