import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createStripeProduct } from "@/api/functions";

// This page allows an onboarded seller to create a new product.
export default function AddProductPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert("Title and Price are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Call the backend function to create the product on Stripe and in the local DB.
      await createStripeProduct({
        title,
        description,
        price: parseFloat(price),
        image_urls: imageUrl ? [imageUrl] : [],
      });
      alert("Product created successfully!");
      // Redirect to the storefront to see the new product.
      navigate(createPageUrl("Store"));
    } catch (error) {
      console.error("Failed to create product:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white p-8">
      <div className="max-w-xl mx-auto">
        <Card className="bg-slate-700/95 border-2 border-cyan-500/20 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/10">
          <CardHeader>
            <CardTitle>Create a New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Vintage T-Shirt" required className="bg-slate-600 border-slate-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product" className="bg-slate-600 border-slate-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required className="pl-8 bg-slate-600 border-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL (Optional)</Label>
                <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" className="pl-8 bg-slate-600 border-slate-500" />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-pink-600 hover:bg-pink-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Product
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}