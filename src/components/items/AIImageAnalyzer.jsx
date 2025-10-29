/**
 * AI Image Analyzer Component
 * 
 * Provides a button to analyze uploaded images with AI and auto-fill item details.
 * Used in both Add Item and Edit Item pages.
 */

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

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
      // Use the edge function endpoint that combines image + voice + SERP API
      const response = await fetch('/api/analyze-image-with-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl,
          voiceTranscript: voiceTranscript || null
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Fallback to basic image analysis if edge function fails
        console.warn('Edge function failed, falling back to basic analysis:', data.error);
        const fallbackResponse = await fetch('/api/analyze-item-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });
        const fallbackData = await fallbackResponse.json();
        if (!fallbackResponse.ok) {
          throw new Error(fallbackData.error || 'Failed to analyze image');
        }
        setLastAnalysis(fallbackData);
        if (onAnalysisComplete) {
          onAnalysisComplete(fallbackData.analysis);
        }
        return;
      }

      setLastAnalysis(data);
      
      // Call the parent component's callback with the analysis
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
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

