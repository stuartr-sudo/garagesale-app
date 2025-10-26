/**
 * Combined Image + Voice Analysis API Endpoint
 * Analyzes images and voice transcripts together for intelligent listing generation
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, voiceTranscript } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('🔄 Analyzing image with voice enhancement...');
    console.log('Voice transcript length:', voiceTranscript?.length || 0);

    // ============================================
    // STEP 1: ANALYZE IMAGE
    // ============================================
    const imageAnalysis = await analyzeImage(imageUrl);
    console.log('✅ Image analysis complete:', imageAnalysis.title);

    // ============================================
    // STEP 2: ANALYZE VOICE (if provided)
    // ============================================
    let voiceAnalysis = null;
    if (voiceTranscript && voiceTranscript.trim()) {
      voiceAnalysis = await analyzeVoice(voiceTranscript);
      console.log('✅ Voice analysis complete:', voiceAnalysis.title);
    }

    // ============================================
    // STEP 3: INTELLIGENT MERGE
    // ============================================
    const finalAnalysis = voiceAnalysis 
      ? mergeAnalyses(imageAnalysis, voiceAnalysis)
      : imageAnalysis;

    console.log('✅ Final merged analysis:', finalAnalysis.title);

    return res.status(200).json({
      success: true,
      ...finalAnalysis,
      sources_used: {
        image: true,
        voice: !!voiceAnalysis
      }
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze content',
      details: error.toString()
    });
  }
}

// ============================================
// IMAGE ANALYSIS FUNCTION
// ============================================
async function analyzeImage(imageUrl) {
  const prompt = `Analyze this product image and respond with ONLY valid JSON (no markdown, no explanation).

**Required JSON format:**
{
  "title": "Brand Model - Key Feature (Condition)",
  "description": "2-3 sentence description covering features, condition, and value",
  "category": "one of: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other",
  "condition": "one of: new, like_new, good, fair, poor",
  "price": 50,
  "minimum_price": 35,
  "tags": ["tag1", "tag2", "tag3"],
  "selling_points": ["point1", "point2", "point3"]
}

**Analysis guidelines:**

**Title** (max 50 chars):
- Format: [Brand] [Model/Type] - [Key Feature]
- Include brand if visible
- Be specific (not "Phone" but "iPhone 12 Pro")
- Include color/size if prominent

**Description** (2-3 sentences):
- Sentence 1: What it is + main appeal
- Sentence 2: Condition details + notable features
- Sentence 3: Who it's for or use case
- Be honest about visible wear/damage

**Price & Minimum Price**:
- Research typical market value for the condition
- Price: Fair asking price
- Minimum price: 70% of asking price (negotiation floor)
- Both must be numbers

**Category**: Choose the best fit from the allowed categories
**Condition**: Be strict and honest
**Tags**: 3-5 searchable keywords (lowercase)
**Selling Points**: 2-4 key highlights that make this item attractive

Return ONLY the JSON object.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0.3
  });

  const aiResponse = response.choices[0].message.content.trim();
  const cleanJson = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  const parsed = JSON.parse(cleanJson);
  
  return sanitizeAnalysis(parsed);
}

// ============================================
// VOICE ANALYSIS FUNCTION
// ============================================
async function analyzeVoice(transcript) {
  const prompt = `You are analyzing a voice transcript from someone describing an item they want to sell.

**User said:**
---
${transcript}
---

**Extract the following details and respond with ONLY valid JSON (no markdown):**

{
  "title": "Concise marketplace title (max 50 chars)",
  "description": "Natural 2-3 sentence description from their words",
  "price": 50,
  "minimum_price": 40,
  "category": "electronics",
  "condition": "good",
  "tags": ["tag1", "tag2", "tag3"],
  "selling_points": ["point1", "point2", "point3"]
}

**Field Instructions:**

**title**: Create from their description (e.g., "iPhone 12 Pro - 128GB Blue")
**description**: Use their own words when possible, 2-3 complete sentences
**price**: The asking price they mention (if they say "around $100" → 100)
**minimum_price**: Extract if they say "but I'd take...", "willing to accept...", "at least...", "no lower than..." (if not mentioned → 70% of price)
**category**: Choose best fit from: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other
**condition**: Map from their words (new, like_new, good, fair, poor)
**tags**: 3-5 searchable keywords (lowercase)
**selling_points**: 2-4 key highlights they emphasize

Return ONLY the JSON object.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 350,
    temperature: 0.3
  });

  const aiResponse = response.choices[0].message.content.trim();
  const cleanJson = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  const parsed = JSON.parse(cleanJson);
  
  return sanitizeAnalysis(parsed);
}

// ============================================
// INTELLIGENT MERGE FUNCTION
// ============================================
function mergeAnalyses(imageAnalysis, voiceAnalysis) {
  console.log('🔀 Merging analyses...');
  
  // TITLE: Prioritize voice if more specific, else use image
  const title = (voiceAnalysis.title && voiceAnalysis.title.length > 10)
    ? voiceAnalysis.title
    : imageAnalysis.title;

  // DESCRIPTION: Combine both for richer context
  // Start with image features, add personal context from voice
  const description = combineDescriptions(
    imageAnalysis.description, 
    voiceAnalysis.description
  );

  // PRICE: Prioritize voice if explicitly mentioned, else use image
  const price = voiceAnalysis.price && voiceAnalysis.price > 0
    ? voiceAnalysis.price
    : imageAnalysis.price;

  // MINIMUM PRICE: Use voice if mentioned, else calculate from final price
  let minimum_price;
  if (voiceAnalysis.minimum_price && voiceAnalysis.minimum_price > 0) {
    minimum_price = voiceAnalysis.minimum_price;
  } else if (imageAnalysis.minimum_price && imageAnalysis.minimum_price > 0) {
    minimum_price = imageAnalysis.minimum_price;
  } else {
    minimum_price = Math.round(price * 0.7);
  }

  // Ensure minimum doesn't exceed price
  if (minimum_price > price) {
    [price, minimum_price] = [minimum_price, price];
  }

  // CATEGORY & CONDITION: Use most specific
  const category = voiceAnalysis.category !== 'other' 
    ? voiceAnalysis.category 
    : imageAnalysis.category;

  const condition = voiceAnalysis.condition || imageAnalysis.condition;

  // TAGS: Combine and deduplicate
  const allTags = [
    ...new Set([
      ...imageAnalysis.tags,
      ...voiceAnalysis.tags
    ])
  ].slice(0, 6);

  // SELLING POINTS: Combine unique points
  const allSellingPoints = [
    ...new Set([
      ...imageAnalysis.selling_points,
      ...voiceAnalysis.selling_points
    ])
  ].slice(0, 5);

  return {
    title,
    description,
    price,
    minimum_price,
    category,
    condition,
    tags: allTags,
    selling_points: allSellingPoints
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function combineDescriptions(imageDesc, voiceDesc) {
  // If both exist, intelligently combine them
  if (imageDesc && voiceDesc) {
    // Check if voice description is significantly different
    const imageLower = imageDesc.toLowerCase();
    const voiceLower = voiceDesc.toLowerCase();
    
    // If voice adds new information, append it
    if (!imageLower.includes(voiceLower.substring(0, 30))) {
      return `${imageDesc} ${voiceDesc}`.trim();
    }
    
    // Otherwise, voice is more personal, use it
    return voiceDesc;
  }
  
  return voiceDesc || imageDesc;
}

function sanitizeAnalysis(data) {
  return {
    title: String(data.title || 'Item for Sale').substring(0, 50),
    description: String(data.description || '').substring(0, 500),
    price: validatePrice(data.price),
    minimum_price: data.minimum_price ? validatePrice(data.minimum_price) : null,
    category: validateCategory(data.category),
    condition: validateCondition(data.condition),
    tags: Array.isArray(data.tags) 
      ? data.tags.slice(0, 6).map(t => String(t).toLowerCase().trim())
      : [],
    selling_points: Array.isArray(data.selling_points)
      ? data.selling_points.slice(0, 5).map(p => String(p).trim())
      : []
  };
}

function validatePrice(price) {
  const parsed = parseFloat(price);
  if (isNaN(parsed) || parsed < 0) return 25;
  if (parsed > 999999) return 999999;
  return Math.round(parsed * 100) / 100;
}

function validateCategory(category) {
  const validCategories = [
    'electronics', 'clothing', 'furniture', 'books', 
    'toys', 'sports', 'home_garden', 'automotive', 
    'collectibles', 'other'
  ];
  
  const normalized = String(category || 'other').toLowerCase().replace(/\s+/g, '_');
  return validCategories.includes(normalized) ? normalized : 'other';
}

function validateCondition(condition) {
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  const normalized = String(condition || 'good').toLowerCase().replace(/[\s-]/g, '_');
  return validConditions.includes(normalized) ? normalized : 'good';
}

