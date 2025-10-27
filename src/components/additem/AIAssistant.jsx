import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GenerateItemDescription, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Sparkles, MessageSquare, Loader2 } from "lucide-react";

export default function AIAssistant({ images, onAssist }) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleAnalyze = async () => {
    if (!images.length && !prompt.trim()) {
      alert("Please upload at least one image or provide a description");
      return;
    }

    setIsProcessing(true);
    try {
      let analysisData = {};

      // If images are provided, analyze the first one
      if (images.length > 0) {
        const imageAnalysis = await ExtractDataFromUploadedFile({ file_url: images[0] });
        analysisData = {
          title: imageAnalysis.title,
          category: imageAnalysis.category,
          condition: imageAnalysis.condition,
          currentDescription: imageAnalysis.description
        };
      }

      // If user provided additional description, use it
      if (prompt.trim()) {
        analysisData.currentDescription = prompt;
      }

      // Generate enhanced description with OpenAI
      const enhanced = await GenerateItemDescription(analysisData);

      const result = {
        title: enhanced.title || analysisData.title || "Item",
        description: enhanced.description,
        category: analysisData.category || "other",
        condition: analysisData.condition || "good",
        tags: enhanced.tags || [],
        suggested_price: 0,
        price_range: "To be determined based on condition and market",
        reasoning: "AI-generated listing based on image analysis and description"
      };

      setLastResult(result);
      
      // Auto-fill the form with AI suggestions
      onAssist({
        title: result.title,
        description: result.description,
        price: result.suggested_price?.toString() || "",
        category: result.category,
        condition: result.condition,
        tags: result.tags || []
      });

    } catch (error) {
      console.error("AI analysis error:", error);
      alert("Error analyzing item. Please try again.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-4 border border-purple-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">Knowzee - AI-Powered Listing Assistant</h4>
            <p className="text-sm text-gray-300 mt-1">
              Upload photos or describe your item, and I'll help generate a compelling listing with title, description, pricing suggestions, and tags.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your item or ask me to analyze the uploaded images..."
          className="min-h-20 rounded-xl"
        />

        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={isProcessing || (!images.length && !prompt.trim())}
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Listing Details
            </>
          )}
        </Button>
      </div>

      {lastResult && (
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
          <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            AI Analysis Complete
          </h4>
          <div className="text-sm space-y-2 text-gray-300">
            <p><strong>Suggested Price:</strong> ${lastResult.suggested_price} ({lastResult.price_range})</p>
            <p><strong>Category:</strong> {lastResult.category?.replace('_', ' ')}</p>
            <p><strong>Condition:</strong> {lastResult.condition?.replace('_', ' ')}</p>
            <p><strong>Tags:</strong> {lastResult.tags?.join(', ')}</p>
            <p className="text-xs mt-3 italic">{lastResult.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}