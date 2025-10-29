/**
 * AI Image Analysis with Voice & SERP API Integration
 * 
 * This endpoint combines:
 * - Image analysis (GPT-4o Vision) with detailed prompts
 * - Voice transcription (if provided) - weaves into title/description
 * - SERP API market research for accurate pricing
 * - Intelligent merging of all data sources
 * 
 * Based on the working Oct 26 implementation (commit c9fea4e)
 * 
 * Endpoint: POST /api/analyze-image-with-voice
 * Body: { imageUrl: string, voiceTranscript?: string }
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const serperApiKey = process.env.SERPER_API_KEY;

if (!openaiApiKey) {
  console.error('OPENAI_API_KEY not configured');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

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
    const { imageUrl, voiceTranscript } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    console.log('🔄 Analyzing image with voice enhancement...');
    console.log('Voice transcript length:', voiceTranscript?.length || 0);

    // STEP 1: QUICK ITEM IDENTIFICATION (for market research)
    const itemIdentification = await quickIdentifyItem(imageUrl, openaiApiKey);
    console.log('🔍 Item identified:', itemIdentification);

    // STEP 2: MARKET RESEARCH + IMAGE ANALYSIS (parallel)
    const [marketData, imageAnalysis] = await Promise.all([
      serperApiKey && itemIdentification 
        ? searchMarketPrices(itemIdentification, serperApiKey)
        : Promise.resolve(null),
      analyzeImageWithDetailedPrompt(imageUrl, openaiApiKey, voiceTranscript)
    ]);
    
    console.log('✅ Image analysis complete:', imageAnalysis.title);
    if (marketData) {
      console.log('💰 Market data:', marketData);
    }

    // STEP 3: ANALYZE VOICE (if provided)
    let voiceAnalysis = null;
    if (voiceTranscript && voiceTranscript.trim()) {
      voiceAnalysis = await analyzeVoice(voiceTranscript, openaiApiKey);
      console.log('✅ Voice analysis complete:', voiceAnalysis.title);
    }

    // STEP 4: INTELLIGENT MERGE (with market data)
    let finalAnalysis = voiceAnalysis 
      ? mergeAnalyses(imageAnalysis, voiceAnalysis)
      : imageAnalysis;
    
    // Apply market data to final pricing if available
    if (marketData && !voiceAnalysis?.price) {
      finalAnalysis = {
        ...finalAnalysis,
        price: marketData.suggestedPrice,
        minimum_price: marketData.minimumPrice,
        market_research: marketData.summary
      };
      console.log('💰 Applied market pricing:', marketData.summary);
    }

    // Transform to match expected format
    const analysis = {
      category: finalAnalysis.category || 'Other',
      title: finalAnalysis.title || '',
      description: finalAnalysis.description || '',
      condition: finalAnalysis.condition || 'Good',
      priceRange: finalAnalysis.price ? {
        min: finalAnalysis.minimum_price || Math.round(finalAnalysis.price * 0.7),
        max: finalAnalysis.price || Math.round((finalAnalysis.minimum_price || finalAnalysis.price) * 1.3)
      } : {
        min: 0,
        max: 0
      },
      tags: finalAnalysis.tags || [],
      selling_points: finalAnalysis.selling_points || [],
      attributes: finalAnalysis.attributes || {},
      marketingTips: finalAnalysis.marketing_tips || '',
      qualityFlags: finalAnalysis.quality_flags || {},
      market_research: marketData?.summary || null
    };

    // Calculate confidence based on sources used
    let confidence = 0.7;
    if (imageAnalysis) confidence += 0.15;
    if (voiceAnalysis) confidence += 0.1;
    if (marketData) confidence += 0.05;

    return res.status(200).json({
      success: true,
      analysis,
      confidence: Math.min(confidence, 1.0),
      sources_used: {
        image: true,
        voice: !!voiceAnalysis,
        market_research: !!marketData
      },
      market_research: marketData?.summary || null
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze content',
      details: String(error)
    });
  }
}

// ============================================
// QUICK ITEM IDENTIFICATION (for market research)
// ============================================
async function quickIdentifyItem(imageUrl, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'What is this item? Respond with ONLY the item name (e.g., "iPhone 12 Pro" or "Coffee Table"). No other text.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (data.error) return null;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Quick identify failed:', error);
    return null;
  }
}

// ============================================
// SERP API MARKET RESEARCH
// ============================================
async function searchMarketPrices(itemTitle, apiKey) {
  try {
    console.log('🔍 Searching market prices for:', itemTitle);
    
    const searchQuery = `${itemTitle} price Australia sold ebay gumtree`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'au',
        num: 5,
        type: 'search'
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const results = await response.json();
    const prices = extractPricesFromResults(results.organic || []);
    
    if (prices.length === 0) {
      console.log('⚠️ No prices found in search results');
      return null;
    }
    
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const suggestedPrice = Math.round(avgPrice * 1.05);
    const minimumPrice = Math.round(avgPrice * 0.75);
    
    return {
      suggestedPrice,
      minimumPrice,
      summary: `Based on ${prices.length} recent listings: $${minPrice}-$${maxPrice} (avg: $${avgPrice})`,
      priceRange: { min: minPrice, max: maxPrice, average: avgPrice },
      dataPoints: prices.length
    };
  } catch (error) {
    console.error('Market research failed:', error);
    return null;
  }
}

function extractPricesFromResults(results) {
  const prices = [];
  const pricePattern = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    if (text.includes('shipping') || text.includes('postage') || text.includes('delivery')) {
      continue;
    }
    
    const matches = text.matchAll(pricePattern);
    for (const match of matches) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price >= 5 && price <= 10000) {
        prices.push(price);
      }
    }
  }
  
  if (prices.length > 3) {
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    return prices.filter(p => p <= median * 2 && p >= median * 0.5);
  }
  
  return prices;
}

// ============================================
// DETAILED IMAGE ANALYSIS
// ============================================
async function analyzeImageWithDetailedPrompt(imageUrl, apiKey, voiceTranscript) {
  const prompt = `Analyze this product image and respond with ONLY valid JSON (no markdown, no explanation).

**Required JSON format:**
{
  "title": "Brand Model - Key Feature (Condition)",
  "description": "Detailed paragraph description (4-6 sentences, 150-300 words)",
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
- Price: Fair asking price
- Minimum price: 70% of asking price (negotiation floor)
- Both must be numbers

**Category**: Choose the best fit from the allowed categories
**Condition**: Be strict and honest
**Tags**: 3-5 searchable keywords (lowercase)
**Selling Points**: 2-4 key highlights that make this item attractive

${voiceTranscript ? `\n\nIMPORTANT: The seller provided voice context: "${voiceTranscript}"\n- Incorporate details from voice into title and description\n- Use seller's words about condition, features, and use cases\n- Weave voice context naturally into the description` : ''}

Return ONLY the JSON object.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 800,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Image analysis failed');
  }

  const aiResponse = data.choices[0].message.content.trim();
  const cleanJson = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanJson);
}

// ============================================
// VOICE ANALYSIS
// ============================================
async function analyzeVoice(transcript, apiKey) {
  const prompt = `You are analyzing a voice transcript from someone describing an item they want to sell.

**User said:**
---
${transcript}
---

**Extract the following details and respond with ONLY valid JSON:**

{
  "title": "Concise marketplace title (max 50 chars)",
  "description": "Natural 2-3 sentence description from their words",
  "price": 50,
  "minimum_price": 40,
  "category": "electronics",
  "condition": "good"
}

**CRITICAL**: Return ONLY the JSON object.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  const cleanJson = data.choices[0].message.content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanJson);
}

// ============================================
// INTELLIGENT MERGE
// ============================================
function mergeAnalyses(imageAnalysis, voiceAnalysis) {
  // Prefer voice title if it's more specific, otherwise enhance image title with voice info
  let title = imageAnalysis.title;
  if (voiceAnalysis.title && voiceAnalysis.title.length > 10) {
    // Use voice title if it's detailed, otherwise combine
    title = voiceAnalysis.title.length > imageAnalysis.title.length 
      ? voiceAnalysis.title 
      : `${imageAnalysis.title} - ${voiceAnalysis.title}`;
  }

  // Merge descriptions - start with voice, enhance with image details
  let description = voiceAnalysis.description || imageAnalysis.description;
  if (voiceAnalysis.description && imageAnalysis.description) {
    description = `${voiceAnalysis.description}\n\n${imageAnalysis.description}`;
  }

  // Prefer voice price if provided
  const price = voiceAnalysis.price || imageAnalysis.price || 0;
  const minimum_price = voiceAnalysis.minimum_price || imageAnalysis.minimum_price || Math.round(price * 0.7);

  // Use voice category if provided, otherwise image category
  const category = voiceAnalysis.category || imageAnalysis.category || 'other';

  // Prefer voice condition if provided
  const condition = voiceAnalysis.condition || imageAnalysis.condition || 'good';

  return {
    title: title.substring(0, 100),
    description: description.substring(0, 1000),
    category,
    condition,
    price,
    minimum_price,
    tags: imageAnalysis.tags || [],
    selling_points: imageAnalysis.selling_points || [],
    attributes: imageAnalysis.attributes || {}
  };
}
