/**
 * AI Visual Item Recognition API
 * 
 * Uses OpenAI GPT-4 Vision to analyze item photos and extract:
 * - Title, description, category
 * - Brand, model, color, material
 * - Condition assessment
 * - Suggested price range
 * - Quality flags (blurry, prohibited items, etc.)
 * 
 * Endpoint: POST /api/analyze-item-image
 * Body: { imageUrl: string, existingData?: object }
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Categories available on BlockSwap
const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing & Accessories',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Games',
  'Tools & Equipment',
  'Art & Collectibles',
  'Other'
];

// Conditions available on BlockSwap
const CONDITIONS = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, existingData } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact support.' 
      });
    }

    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(existingData);

    console.log('Analyzing image with GPT-4 Vision...');
    
    // Call OpenAI GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest vision model (faster than gpt-4-vision-preview)
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high" // High detail for better accuracy
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.4,
    });

    const aiResponse = response.choices[0].message.content;
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/```\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return res.status(500).json({ 
        error: 'Failed to parse AI analysis',
        rawResponse: aiResponse 
      });
    }

    // Validate and enrich the analysis
    const enrichedAnalysis = enrichAnalysis(analysis);

    // Calculate confidence score
    const confidence = calculateConfidence(enrichedAnalysis);

    // Return the analysis
    return res.status(200).json({
      success: true,
      analysis: enrichedAnalysis,
      confidence,
      tokensUsed: response.usage.total_tokens,
      model: response.model
    });

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'AI service authentication failed. Please contact support.' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'AI service is busy. Please try again in a moment.' 
      });
    }

    return res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
}

/**
 * Build the analysis prompt for GPT-4 Vision
 */
function buildAnalysisPrompt(existingData) {
  const contextNote = existingData 
    ? `\n\nThe seller has already provided: ${JSON.stringify(existingData)}. Use this as context but provide your own analysis.`
    : '';

  return `Analyze this product image and respond with ONLY valid JSON (no markdown, no explanation).

**Required JSON format:**
{
  "title": "Brand Model - Key Feature (Condition)",
  "description": "Detailed paragraph description (4-6 sentences, 150-300 words)",
  "category": "One of: ${CATEGORIES.join(', ')}",
  "condition": "One of: ${CONDITIONS.join(', ')}",
  "priceRange": {
    "min": number - minimum suggested price in AUD,
    "max": number - maximum suggested price in AUD
  },
  "tags": ["tag1", "tag2", "tag3"],
  "selling_points": ["point1", "point2", "point3"],
  "attributes": {
    "brand": "string - brand name if identifiable",
    "model": "string - model name if identifiable",
    "color": "string - primary color",
    "size": "string - size if applicable",
    "material": "string - material if identifiable"
  },
  "marketingTips": "string - helpful tip for better listing presentation",
  "qualityFlags": {
    "isBlurry": boolean,
    "isPoorLighting": boolean,
    "hasClutteredBackground": boolean,
    "isStockPhoto": boolean,
    "isProhibited": boolean,
    "prohibitedReason": "string - reason if prohibited"
  }
}

**Analysis guidelines:**

**Title** (max 50 chars):
- Format: [Brand] [Model/Type] - [Key Feature]
- Include brand if visible
- Be specific (not "Phone" but "iPhone 12 Pro")
- Include color/size if prominent

**Description** (detailed paragraph, 4-6 sentences, 150-300 words):
- Paragraph structure:
  * Opening: What the item is, its primary purpose, and standout feature
  * Features: List 3-5 specific features, specifications, or benefits
  * Condition: Detailed condition assessment - be specific about any wear, marks, functionality
  * Value proposition: Why this is a good buy, what makes it special
  * Use case: Who would love this item or what situations it's perfect for
- Write in an engaging, descriptive style that sells the item
- Be honest and transparent about condition
- Include measurements, dimensions, or specs if visible
- Mention any accessories, original packaging, or extras shown
- Use natural, flowing language (not bullet points)

**Price & Minimum Price**:
- Research typical market value for the condition
- priceRange.min: Fair asking price
- priceRange.max: 130% of asking price (negotiation ceiling)
- Both must be numbers

**Category**: Choose the best fit from the allowed categories
**Condition**: Be strict and honest
**Tags**: 3-5 searchable keywords (lowercase)
**Selling Points**: 2-4 key highlights that make this item attractive

Prohibited items: weapons, drugs, counterfeit goods, adult content, live animals, prescription medications.

Return ONLY the JSON object.

${contextNote}`;
}

/**
 * Enrich and validate the AI analysis
 */
function enrichAnalysis(analysis) {
  // Ensure category is valid
  if (!CATEGORIES.includes(analysis.category)) {
    analysis.category = 'Other';
  }

  // Ensure condition is valid
  if (!CONDITIONS.includes(analysis.condition)) {
    analysis.condition = 'Good';
  }

  // Add helpful defaults
  if (!analysis.attributes) {
    analysis.attributes = {};
  }

  if (!analysis.qualityFlags) {
    analysis.qualityFlags = {
      isBlurry: false,
      isPoorLighting: false,
      hasClutteredBackground: false,
      isStockPhoto: false,
      isProhibited: false
    };
  }

  if (!analysis.tags || analysis.tags.length === 0) {
    analysis.tags = [];
  }

  // Ensure price range is reasonable
  if (analysis.priceRange) {
    if (analysis.priceRange.min < 1) analysis.priceRange.min = 1;
    if (analysis.priceRange.max < analysis.priceRange.min) {
      analysis.priceRange.max = analysis.priceRange.min * 2;
    }
    if (analysis.priceRange.max > 10000) analysis.priceRange.max = 10000;
  }

  return analysis;
}

/**
 * Calculate confidence score based on analysis completeness
 */
function calculateConfidence(analysis) {
  let score = 0.5; // Base score

  // Title and description quality
  if (analysis.title && analysis.title.length > 10) score += 0.1;
  if (analysis.description && analysis.description.length > 50) score += 0.1;

  // Attributes detected
  if (analysis.attributes.brand) score += 0.1;
  if (analysis.attributes.model) score += 0.05;
  if (analysis.attributes.color) score += 0.05;

  // Price range provided
  if (analysis.priceRange && analysis.priceRange.reasoning) score += 0.1;

  // No quality issues
  const flags = analysis.qualityFlags;
  if (!flags.isBlurry && !flags.isPoorLighting && !flags.hasClutteredBackground) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

