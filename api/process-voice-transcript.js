/**
 * Voice Transcript Processing API
 * Processes voice input and extracts listing details using AI
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    console.log('Processing voice transcript:', transcript.substring(0, 100) + '...');

    // ============================================
    // ENHANCED PROMPT - SECURE & COMPREHENSIVE
    // ============================================
    const prompt = `You are analyzing a voice transcript from someone describing an item they want to sell on a marketplace.

**User said:**
---
${transcript}
---

**Extract the following details and respond with ONLY valid JSON (no markdown, no explanation):**

{
  "title": "Concise marketplace title (max 50 chars)",
  "description": "Natural 2-3 sentence description from their words",
  "price": 50,
  "minimum_price": 40,
  "category": "electronics",
  "condition": "good",
  "tags": ["tag1", "tag2", "tag3"],
  "selling_points": ["point1", "point2", "point3"],
  "location": "City, State"
}

**Field Instructions:**

**title**: 
- Create from their description (e.g., "iPhone 12 Pro - 128GB Blue")
- Include: brand, model, key feature, or condition
- Max 50 characters

**description**:
- Use their own words when possible
- 2-3 complete sentences
- Include: what it is, condition, notable features, why selling

**price**:
- The asking/listing price they mention
- If they say "around $100" → 100
- If they say "$80 to $100" → use 100 (higher end)
- If no price mentioned → estimate reasonable market value
- MUST be a number, not string

**minimum_price**:
- Extract if they say: "but I'd take...", "willing to accept...", "at least...", "no lower than..."
- If they say "$80 to $100" → minimum is 80
- If they say "firm on price" → minimum = price
- If not mentioned → null
- MUST be a number or null

**category** (choose best fit):
- electronics: phones, laptops, cameras, gadgets, appliances
- clothing: shirts, shoes, accessories, fashion items
- furniture: chairs, tables, beds, storage, decor
- books: books, magazines, comics, educational materials
- toys: children's toys, games, puzzles, action figures
- sports: equipment, bikes, fitness gear, outdoor gear
- home_garden: tools, kitchenware, plants, outdoor items, DIY
- automotive: car parts, accessories, tools, car care
- collectibles: vintage, antiques, rare items, memorabilia
- other: anything that doesn't fit above

**condition** (map from their words):
- "new", "brand new", "unopened", "never used" → new
- "like new", "barely used", "excellent", "perfect" → like_new
- "good", "gently used", "normal wear", "works great" → good
- "fair", "used", "some wear", "needs TLC", "minor issues" → fair
- "poor", "damaged", "broken", "for parts", "not working" → poor
- If unclear → good

**tags** (3-5 searchable keywords):
- Extract from their description: brand, type, color, size, material, feature
- Lowercase
- Examples: ["samsung", "smartphone", "unlocked", "black"]

**selling_points** (2-4 key highlights):
- Why someone should buy this
- Extract features they emphasize
- Examples: ["Original box included", "Barely used - 9/10 condition", "Fast shipping available"]
- Focus on: condition, features, value, includes/accessories

**location**:
- Extract if they mention: city, state, neighborhood, area
- Format: "City, State" or "Neighborhood, City"
- If not mentioned → null

**CRITICAL**: Return ONLY the JSON object. No text before or after.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 350, // Increased slightly for selling_points
      temperature: 0.3 // Consistent with image analysis
    });

    const aiResponse = response.choices[0].message.content.trim();

    // ============================================
    // PARSE JSON RESPONSE
    // ============================================
    let extractedData;
    
    try {
      // Remove markdown code blocks if present
      const cleanJson = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanJson);
      
      // Validate required fields
      if (!extractedData.title || !extractedData.description) {
        throw new Error('Missing required fields');
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI response:', aiResponse);
      
      // Fallback parsing
      extractedData = fallbackParsing(transcript, aiResponse);
    }

    // ============================================
    // VALIDATE & SANITIZE DATA
    // ============================================
    const result = {
      title: String(extractedData.title || 'Item for Sale').substring(0, 50),
      description: String(extractedData.description || transcript).substring(0, 300),
      price: validatePrice(extractedData.price),
      minimum_price: extractedData.minimum_price ? validatePrice(extractedData.minimum_price) : null,
      category: validateCategory(extractedData.category),
      condition: validateCondition(extractedData.condition),
      tags: Array.isArray(extractedData.tags) 
        ? extractedData.tags.slice(0, 5).map(t => String(t).toLowerCase().trim())
        : ['item', 'sale'],
      selling_points: Array.isArray(extractedData.selling_points)
        ? extractedData.selling_points.slice(0, 4).map(p => String(p).trim())
        : extractDefaultSellingPoints(extractedData.condition),
      location: extractedData.location ? String(extractedData.location).substring(0, 100) : null
    };

    // Validate price logic: minimum can't be higher than price
    if (result.minimum_price && result.minimum_price > result.price) {
      console.warn('⚠️ Minimum price higher than asking price, swapping values');
      [result.price, result.minimum_price] = [result.minimum_price, result.price];
    }

    // Minimum should be at least 50% of asking price (reasonable floor)
    if (result.minimum_price && result.minimum_price < result.price * 0.5) {
      console.warn('⚠️ Minimum price too low, adjusting to 70% of asking');
      result.minimum_price = Math.round(result.price * 0.7);
    }

    console.log('Voice processing completed:', {
      title: result.title,
      price: result.price,
      minimum_price: result.minimum_price,
      category: result.category,
      selling_points: result.selling_points
    });

    return res.status(200).json({
      success: true,
      ...result,
      raw_transcript: transcript
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process voice input',
      details: error.toString()
    });
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

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

function validatePrice(price) {
  const parsed = parseFloat(price);
  if (isNaN(parsed) || parsed < 0) return 25;
  if (parsed > 999999) return 999999; // Max price cap
  return Math.round(parsed * 100) / 100; // Round to 2 decimals
}

function extractDefaultSellingPoints(condition) {
  const conditionMap = {
    'new': ['Brand new condition', 'Unused and ready to use'],
    'like_new': ['Excellent condition', 'Barely used'],
    'good': ['Good working condition', 'Well maintained'],
    'fair': ['Functional with minor wear', 'Great value for price'],
    'poor': ['Sold as-is', 'For parts or repair']
  };
  
  return conditionMap[condition] || ['Good condition', 'Great value'];
}

// ============================================
// FALLBACK PARSER
// ============================================

function fallbackParsing(transcript, aiResponse) {
  console.log('Using fallback parsing...');
  
  // Try to extract price from transcript
  const priceMatch = transcript.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 25;
  
  // Try to extract minimum price keywords
  const minPriceMatch = transcript.match(/(?:at least|minimum|no lower than|won't take less than)\s*\$?\s*(\d+)/i);
  const minimum_price = minPriceMatch ? parseFloat(minPriceMatch[1]) : null;
  
  // Extract first sentence as title
  const sentences = transcript.split(/[.!?]/);
  const title = sentences[0]?.trim().substring(0, 50) || 'Item for Sale';
  
  // Try to infer category from keywords
  const categoryKeywords = {
    electronics: ['phone', 'laptop', 'computer', 'tv', 'camera', 'ipad', 'tablet', 'console'],
    furniture: ['chair', 'table', 'desk', 'couch', 'sofa', 'bed', 'shelf'],
    clothing: ['shirt', 'pants', 'dress', 'shoes', 'jacket', 'coat', 'jeans'],
    automotive: ['car', 'truck', 'bike', 'tire', 'wheel', 'part', 'vehicle'],
    sports: ['bike', 'gym', 'fitness', 'ball', 'equipment', 'golf', 'ski']
  };
  
  let category = 'other';
  const lowerTranscript = transcript.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerTranscript.includes(kw))) {
      category = cat;
      break;
    }
  }
  
  return {
    title,
    description: transcript.substring(0, 200),
    price,
    minimum_price,
    category,
    condition: 'good',
    tags: ['item', 'sale'],
    selling_points: extractDefaultSellingPoints('good'),
    location: null
  };
}