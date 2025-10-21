import React, { useState, useEffect } from "react";
import { HomepageContent } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, Trash2, Plus, LayoutTemplate } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const defaultContent = {
    hero_title: "Turn Your Clutter into Cash, Effortlessly",
    hero_subtitle: "Send a photo, set your price, and our AI does the rest. GarageSale is the smartest local marketplace, making selling faster and buying simpler than ever before.",
    hero_button_text: "Start Selling Now - It's Free!",
    dashboard_image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
    how_it_works_title: "How It Works",
    how_it_works_subtitle: "Get your items listed and sold in three simple steps",
    features_title: "Why You'll Love GarageSale",
    features_subtitle: "Everything you need to sell quickly and safely.",
    features: [
        { title: "AI-Powered Listings", description: "Just upload a photo and set your price. Our AI writes the perfect title, description, and even suggests improvements." },
        { title: "Secure Payments", description: "Integrated Stripe payments mean you get paid securely and buyers can purchase with confidence." },
        { title: "Local Community", description: "Connect with buyers and sellers in your area. Easy local pickup and no shipping hassles." }
    ]
};

export default function HomepageEditor() {
    const [content, setContent] = useState(defaultContent);
    const [contentId, setContentId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                const user = await User.me();
                setCurrentUser(user);

                if (user.role !== 'admin') {
                    setLoading(false);
                    return;
                }

                const existingContent = await HomepageContent.list();
                if (existingContent.length > 0) {
                    setContent(existingContent[0]);
                    setContentId(existingContent[0].id);
                } else {
                    // If no content exists, we'll create it on first save
                    setContent(defaultContent);
                }
            } catch (error) {
                console.error("Error initializing editor:", error);
            }
            setLoading(false);
        };
        initialize();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...content.features];
        newFeatures[index][field] = value;
        setContent(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setContent(prev => ({
            ...prev,
            features: [...prev.features, { title: "", description: "" }]
        }));
    };

    const removeFeature = (index) => {
        const newFeatures = content.features.filter((_, i) => i !== index);
        setContent(prev => ({ ...prev, features: newFeatures }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            setContent(prev => ({ ...prev, dashboard_image_url: file_url }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Image upload failed. Please try again.");
        }
        setUploading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (contentId) {
                await HomepageContent.update(contentId, content);
            } else {
                const newRecord = await HomepageContent.create(content);
                setContentId(newRecord.id);
            }
            alert("Homepage content saved successfully!");
        } catch (error) {
            console.error("Error saving content:", error);
            alert("Failed to save content. Please try again.");
        }
        setIsSaving(false);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading editor...</div>;
    }

    if (currentUser?.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2">You must be an administrator to access this page.</p>
            </div>
        );
    }
    
    return (
        <div className="p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-stone-900 mb-2">Homepage Editor</h1>
                        <p className="text-lg text-stone-600">Update the content of your public landing page.</p>
                    </div>
                    <Link to={createPageUrl("Home")} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">View Live Page</Button>
                    </Link>
                </div>
                
                <div className="space-y-8">
                    {/* Hero Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hero Section</CardTitle>
                            <CardDescription>The first thing visitors see.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="hero_title">Main Headline</Label>
                                <Input id="hero_title" name="hero_title" value={content.hero_title} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="hero_subtitle">Sub-headline</Label>
                                <Textarea id="hero_subtitle" name="hero_subtitle" value={content.hero_subtitle} onChange={handleInputChange} rows={3} />
                            </div>
                            <div>
                                <Label htmlFor="hero_button_text">Button Text</Label>
                                <Input id="hero_button_text" name="hero_button_text" value={content.hero_button_text} onChange={handleInputChange} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dashboard Preview Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard Preview Image</CardTitle>
                            <CardDescription>The main screenshot shown on the homepage.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <img src={content.dashboard_image_url} alt="Dashboard preview" className="rounded-lg border max-h-60 w-auto" />
                            <div className="flex items-center gap-4">
                                <Input id="dashboard_image_url" name="dashboard_image_url" value={content.dashboard_image_url} onChange={handleInputChange} placeholder="Image URL"/>
                                <Label htmlFor="dashboard-upload" className="flex-shrink-0">
                                  <Button as="span" variant="outline" disabled={uploading}>
                                      <Upload className="w-4 h-4 mr-2" />
                                      {uploading ? "Uploading..." : "Upload"}
                                  </Button>
                                </Label>
                                <input id="dashboard-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* How It Works Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>How It Works Section</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <Label htmlFor="how_it_works_title">Title</Label>
                                <Input id="how_it_works_title" name="how_it_works_title" value={content.how_it_works_title} onChange={handleInputChange} />
                            </div>
                            <div>
                                <Label htmlFor="how_it_works_subtitle">Subtitle</Label>
                                <Input id="how_it_works_subtitle" name="how_it_works_subtitle" value={content.how_it_works_subtitle} onChange={handleInputChange} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Features Section</CardTitle>
                            <CardDescription>"Why You'll Love GarageSale"</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="features_title">Section Title</Label>
                                <Input id="features_title" name="features_title" value={content.features_title} onChange={handleInputChange} />
                            </div>
                             <div>
                                <Label htmlFor="features_subtitle">Section Subtitle</Label>
                                <Input id="features_subtitle" name="features_subtitle" value={content.features_subtitle} onChange={handleInputChange} />
                            </div>
                            
                            {content.features.map((feature, index) => (
                                <div key={index} className="p-4 border rounded-lg relative space-y-2">
                                    <h4 className="font-semibold">Feature {index + 1}</h4>
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={feature.title} onChange={(e) => handleFeatureChange(index, 'title', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea value={feature.description} onChange={(e) => handleFeatureChange(index, 'description', e.target.value)} />
                                    </div>
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-7 h-7" onClick={() => removeFeature(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addFeature}><Plus className="w-4 h-4 mr-2" />Add Feature</Button>
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8">
                            <Save className="w-5 h-5 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}