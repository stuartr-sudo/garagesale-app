/**
 * AI Image Analyzer Component
 * 
 * Provides a button to analyze uploaded images with AI and auto-fill item details.
 * Uses Supabase edge function for voice + image + SERP API integration.
 * Used in both Add Item and Edit Item pages.
 */

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AIImageAnalyzer({ imageUrl, voiceTranscript, onAnalysisComplete, disabled }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const analyzeImage = async () => {
    if (!imageUrl) {
      setError('Please upload an image first');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Call Supabase edge function directly
      console.log('🔄 Calling Supabase edge function analyze-image-with-voice...');
      
      const { data, error: edgeError } = await supabase.functions.invoke('analyze-image-with-voice', {
        body: {
          imageUrl,
          voiceTranscript: voiceTranscript || null
        }
      });

      if (edgeError) {
        throw new Error(edgeError.message || 'Failed to analyze with edge function');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Edge function returned unsuccessful response');
      }

      console.log('✅ Analysis complete:', {
        title: data.title?.substring(0, 50),
        hasVoice: !!voiceTranscript,
        hasMarketData: !!data.market_research
      });

      // Transform the response to match expected format
      const analysis = {
        category: data.category || 'Other',
        title: data.title || '',
        description: data.description || '',
        condition: data.condition || 'Good',
        priceRange: data.price ? {
          min: data.minimum_price || Math.round(data.price * 0.7),
          max: data.price || Math.round((data.minimum_price || data.price) * 1.3)
        } : {
          min: 0,
          max: 0
        },
        tags: data.tags || [],
        selling_points: data.selling_points || [],
        attributes: data.attributes || {},
        marketingTips: data.marketing_tips || '',
        qualityFlags: data.quality_flags || {},
        market_research: data.market_research || null
      };

      // Calculate confidence based on sources used
      let confidence = 0.7;
      if (data.sources_used?.image) confidence += 0.15;
      if (data.sources_used?.voice) confidence += 0.1;
      if (data.market_research) confidence += 0.05;

      const result = {
        analysis,
        confidence: Math.min(confidence, 1.0),
        sources_used: data.sources_used || {},
        market_research: data.market_research || null
      };

      setLastAnalysis(result);
      
      // Call the parent component's callback with the analysis
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }

    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      <button
        type="button"
        onClick={analyzeImage}
        disabled={disabled || analyzing || !imageUrl}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
          font-medium transition-all
          ${analyzing 
            ? 'bg-purple-100 text-purple-700 cursor-wait' 
            : disabled || !imageUrl
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
          }
        `}
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing image with AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Analyze with AI Magic ✨</span>
          </>
        )}
      </button>

      {/* Info Banner */}
      {!lastAnalysis && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">AI will auto-fill your listing!</p>
            <p className="text-blue-600 mt-1">
              Upload a clear photo, then click "Analyze with AI Magic" to get instant suggestions for title, description, category, price, and more.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Analysis failed</p>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              type="button"
              onClick={analyzeImage}
              className="text-red-700 underline hover:text-red-800 mt-2 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Success Message with Analysis Details */}
      {lastAnalysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">
                AI Analysis Complete! 
                <span className="ml-2 text-sm font-normal text-green-700">
                  ({Math.round(lastAnalysis.confidence * 100)}% confidence)
                </span>
              </p>
              <p className="text-sm text-green-700 mt-1">
                Your listing has been auto-filled. Review and adjust as needed.
              </p>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {lastAnalysis.analysis.category}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Condition:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {lastAnalysis.analysis.condition}
                </span>
              </div>
            </div>

            {lastAnalysis.analysis.attributes?.brand && (
              <div>
                <span className="text-gray-500">Brand:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {lastAnalysis.analysis.attributes.brand}
                </span>
              </div>
            )}

            {lastAnalysis.analysis.priceRange && (
              <div>
                <span className="text-gray-500">Suggested Price:</span>
                <span className="ml-2 font-medium text-gray-900">
                  ${lastAnalysis.analysis.priceRange.min} - ${lastAnalysis.analysis.priceRange.max}
                </span>
              </div>
            )}

            {lastAnalysis.analysis.marketingTips && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-gray-500 mb-1">💡 Marketing Tip:</p>
                <p className="text-gray-700 italic">
                  {lastAnalysis.analysis.marketingTips}
                </p>
              </div>
            )}
          </div>

          {/* Quality Warnings */}
          {hasQualityIssues(lastAnalysis.analysis.qualityFlags) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ Photo Quality Issues:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1">
                {lastAnalysis.analysis.qualityFlags.isBlurry && (
                  <li>• Image is blurry - consider retaking with better focus</li>
                )}
                {lastAnalysis.analysis.qualityFlags.isPoorLighting && (
                  <li>• Poor lighting - try natural daylight or better illumination</li>
                )}
                {lastAnalysis.analysis.qualityFlags.hasClutteredBackground && (
                  <li>• Cluttered background - use a plain backdrop for better presentation</li>
                )}
                {lastAnalysis.analysis.qualityFlags.isStockPhoto && (
                  <li>• Appears to be a stock photo - use actual photos of your item</li>
                )}
              </ul>
            </div>
          )}

          {/* Prohibited Item Warning */}
          {lastAnalysis.analysis.qualityFlags.isProhibited && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <p className="text-sm font-medium text-red-900 mb-1">
                🚫 Prohibited Item Detected
              </p>
              <p className="text-sm text-red-800">
                {lastAnalysis.analysis.qualityFlags.prohibitedReason || 
                 'This item may violate our marketplace policies. Please review our terms of service.'}
              </p>
            </div>
          )}

          {/* Analyze Again */}
          <button
            type="button"
            onClick={analyzeImage}
            className="text-sm text-purple-700 hover:text-purple-800 underline font-medium"
          >
            Analyze again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Check if analysis has any quality issues
 */
function hasQualityIssues(flags) {
  if (!flags) return false;
  return flags.isBlurry || flags.isPoorLighting || flags.hasClutteredBackground || flags.isStockPhoto;
}

