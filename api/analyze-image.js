/**
 * Image Analysis API Endpoint
 * Analyzes photos taken with mobile camera and generates listing details
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    console.log('Analyzing image for marketplace listing...');

    // ============================================
    // ENHANCED PROMPT - STRUCTURED JSON OUTPUT
    // ============================================
    const prompt = `Analyze this product image and respond with ONLY valid JSON (no markdown, no explanation).

**Required JSON format:**
{
  "title": "Brand Model - Key Feature (Condition)",
  "description": "2-3 sentence description covering features, condition, and value",
  "category": "one of: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other",
  "condition": "one of: new, like_new, good, fair, poor",
  "suggested_price": 50,
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

**Category**:
- electronics: phones, laptops, cameras, gadgets
- clothing: shirts, shoes, accessories, fashion
- furniture: chairs, tables, storage, decor
- books: books, magazines, comics
- toys: kids toys, games, puzzles
- sports: equipment, bikes, fitness gear
- home_garden: tools, kitchen, plants, outdoor
- automotive: car parts, accessories, tools
- collectibles: vintage, rare, limited items
- other: anything else

**Condition** (be strict):
- new: Unused, perfect, in original packaging
- like_new: Barely used, no visible wear
- good: Used, minor wear, fully functional
- fair: Noticeable wear, some flaws, still works
- poor: Heavy wear, damage, or not fully functional

**Suggested Price**:
- Research typical market value for the condition
- Consider: brand, age, condition, demand
- Be realistic (not retail price unless new)
- Round to nearest $5 or $10

**Tags** (3-5 keywords):
- Mix of: brand, type, color, size, material
- Lowercase, searchable terms
- Examples: "samsung", "smartphone", "black", "64gb"

**Selling Points** (2-3 points):
- Highlight: quality, features, condition, value
- Be specific: "128GB storage" not "large capacity"
- Focus on what makes it desirable

**CRITICAL**: Output ONLY the JSON object. No text before or after.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: image }
            }
          ]
        }
      ],
      max_tokens: 400, // Reduced from 500 - JSON is more compact
      temperature: 0.3 // Reduced from 0.7 - more consistent/accurate
    });

    const analysisText = response.choices[0].message.content.trim();

    // ============================================
    // PARSE JSON RESPONSE
    // ============================================
    let analysisResult;
    
    try {
      // Remove markdown code blocks if present (GPT sometimes adds them)
      const cleanJson = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysisResult = JSON.parse(cleanJson);
      
      // Validate required fields
      if (!analysisResult.title || !analysisResult.description) {
        throw new Error('Missing required fields');
      }
      
      // Sanitize and validate data
      analysisResult = {
        title: String(analysisResult.title).substring(0, 50),
        description: String(analysisResult.description).substring(0, 300),
        category: validateCategory(analysisResult.category),
        condition: validateCondition(analysisResult.condition),
        suggested_price: Math.max(0, parseFloat(analysisResult.suggested_price) || 0),
        tags: Array.isArray(analysisResult.tags) 
          ? analysisResult.tags.slice(0, 5).map(t => String(t).toLowerCase())
          : ['item', 'sale'],
        selling_points: Array.isArray(analysisResult.selling_points)
          ? analysisResult.selling_points.slice(0, 3).map(p => String(p))
          : ['Good condition', 'Great value']
      };
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw response:', analysisText);
      
      // Fallback to basic parsing if JSON fails
      analysisResult = fallbackParsing(analysisText);
    }

    console.log('Image analysis completed:', {
      title: analysisResult.title,
      category: analysisResult.category,
      condition: analysisResult.condition,
      price: analysisResult.suggested_price
    });

    return res.status(200).json({
      success: true,
      ...analysisResult,
      raw_analysis: analysisText
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image',
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
  
  const normalized = String(category).toLowerCase().replace(/\s+/g, '_');
  return validCategories.includes(normalized) ? normalized : 'other';
}

function validateCondition(condition) {
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  const normalized = String(condition).toLowerCase().replace(/\s+/g, '_');
  return validConditions.includes(normalized) ? normalized : 'good';
}

// ============================================
// FALLBACK PARSER (if JSON fails)
// ============================================

function fallbackParsing(text) {
  console.log('Using fallback parsing...');
  
  const lines = text.split('\n').filter(line => line.trim());
  
  let title = '';
  let description = '';
  let category = 'other';
  let condition = 'good';
  let suggested_price = 25;
  let tags = [];
  let selling_points = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('title')) {
      title = line.split(':').slice(1).join(':').trim().replace(/["*]/g, '');
    } else if (lowerLine.includes('description')) {
      description = line.split(':').slice(1).join(':').trim().replace(/["*]/g, '');
    } else if (lowerLine.includes('category')) {
      const cat = line.split(':').slice(1).join(':').trim().replace(/["*]/g, '');
      category = validateCategory(cat);
    } else if (lowerLine.includes('condition')) {
      const cond = line.split(':').slice(1).join(':').trim().replace(/["*]/g, '');
      condition = validateCondition(cond);
    } else if (lowerLine.includes('price')) {
      const priceMatch = line.match(/\$?(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        suggested_price = parseFloat(priceMatch[1]);
      }
    } else if (lowerLine.includes('tags')) {
      const tagsText = line.split(':').slice(1).join(':').trim().replace(/["\[\]*]/g, '');
      tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
    } else if (lowerLine.includes('selling')) {
      const pointsText = line.split(':').slice(1).join(':').trim().replace(/["\[\]*]/g, '');
      selling_points = pointsText.split(',').map(point => point.trim()).filter(Boolean);
    }
  }

  // Ensure we have something
  if (!title) {
    const sentences = text.split(/[.!?]/);
    title = sentences[0]?.trim().substring(0, 50) || 'Item for Sale';
  }
  
  if (!description) {
    description = text.substring(0, 200) || 'Great item in good condition';
  }

  return {
    title: title.substring(0, 50),
    description: description.substring(0, 300),
    category,
    condition,
    suggested_price: suggested_price || 25,
    tags: tags.length > 0 ? tags.slice(0, 5) : ['item', 'sale'],
    selling_points: selling_points.length > 0 ? selling_points.slice(0, 3) : ['Good condition', 'Great value']
  };
}