import React, { useState, useEffect } from "react";
import { Announcement } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Save, ArrowLeft, Megaphone, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createPageUrl } from "@/utils";

const categoryOptions = [
  { value: "community_event", label: "Community Event", icon: "🎉" },
  { value: "market_day", label: "Market Day", icon: "🛍️" },
  { value: "charity_drive", label: "Charity Drive", icon: "❤️" },
  { value: "workshop", label: "Workshop", icon: "🔧" },
  { value: "festival", label: "Festival", icon: "🎪" },
  { value: "meeting", label: "Meeting", icon: "👥" },
  { value: "other", label: "Other", icon: "📢" }
];

export default function AnnouncementEditor() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "community_event",
    event_date: "",
    location: "",
    contact_info: "",
    image_url: "",
    expires_at: ""
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Check if user has admin or super_admin role
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to create announcements.",
            variant: "destructive"
          });
          navigate(createPageUrl("Announcements"));
          return;
        }
      } catch (error) {
        console.error("Error loading user:", error);
        navigate(createPageUrl("Announcements"));
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, [navigate, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Title is required.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: "Validation Error", 
          description: "Description is required.",
          variant: "destructive"
        });
        return;
      }

      // Prepare announcement data
      const announcementData = {
        ...formData,
        status: "active",
        created_by: currentUser.id
      };

      // Create the announcement
      const newAnnouncement = await Announcement.create(announcementData);

      toast({
        title: "Success!",
        description: "Announcement created successfully."
      });

      // Navigate back to announcements
      navigate(createPageUrl("Announcements"));

    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to create announcement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Announcements"))}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Announcements
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Megaphone className="w-10 h-10 text-pink-500" />
                Create Announcement
              </h1>
              <p className="text-lg text-gray-400">Share community events and important updates</p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-800 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Announcement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white text-lg">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter announcement title"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white text-lg">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the event or announcement details"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[120px]"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white text-lg">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Date */}
                <div className="space-y-2">
                  <Label htmlFor="event_date" className="text-white text-lg">Event Date</Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white text-lg">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Event location or venue"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <Label htmlFor="contact_info" className="text-white text-lg">Contact Information</Label>
                  <Input
                    id="contact_info"
                    name="contact_info"
                    value={formData.contact_info}
                    onChange={handleInputChange}
                    placeholder="Phone, email, or contact person"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-white text-lg">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                  <p className="text-sm text-gray-500">Optional: Add an image to make your announcement more engaging</p>
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="text-white text-lg">Expiration Date</Label>
                  <Input
                    id="expires_at"
                    name="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-sm text-gray-500">Optional: Set when this announcement should expire</p>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Creating..." : "Create Announcement"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Announcements"))}
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
