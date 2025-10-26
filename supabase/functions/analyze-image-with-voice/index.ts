// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const { imageUrl, voiceTranscript } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    console.log('🔄 Analyzing image with voice enhancement...')
    console.log('Voice transcript length:', voiceTranscript?.length || 0)

    // ============================================
    // STEP 1: QUICK ITEM IDENTIFICATION (for market research)
    // ============================================
    const itemIdentification = await quickIdentifyItem(imageUrl, openaiApiKey)
    console.log('🔍 Item identified:', itemIdentification)

    // ============================================
    // STEP 2: MARKET RESEARCH (parallel with image analysis)
    // ============================================
    const serperApiKey = Deno.env.get('SERPER_API_KEY')
    
    // Run market research and full image analysis in parallel for speed
    const [marketData, imageAnalysis] = await Promise.all([
      serperApiKey && itemIdentification 
        ? searchMarketPrices(itemIdentification, serperApiKey)
        : Promise.resolve(null),
      analyzeImageWithMarketData(imageUrl, openaiApiKey, null) // Will get market data added later
    ])
    
    console.log('✅ Image analysis complete:', imageAnalysis.title)
    if (marketData) {
      console.log('💰 Market data:', marketData)
    }

    // ============================================
    // STEP 3: ANALYZE VOICE (if provided)
    // ============================================
    let voiceAnalysis = null
    if (voiceTranscript && voiceTranscript.trim()) {
      voiceAnalysis = await analyzeVoice(voiceTranscript, openaiApiKey)
      console.log('✅ Voice analysis complete:', voiceAnalysis.title)
    }

    // ============================================
    // STEP 4: INTELLIGENT MERGE (with market data)
    // ============================================
    let finalAnalysis = voiceAnalysis 
      ? mergeAnalyses(imageAnalysis, voiceAnalysis)
      : imageAnalysis
    
    // Apply market data to final pricing if available
    if (marketData && !voiceAnalysis?.price) {
      // Only use market data if user didn't specify price in voice
      finalAnalysis = {
        ...finalAnalysis,
        price: marketData.suggestedPrice,
        minimum_price: marketData.minimumPrice,
        market_research: marketData.summary
      }
      console.log('💰 Applied market pricing:', marketData.summary)
    }

    console.log('✅ Final merged analysis:', finalAnalysis.title)

    return new Response(
      JSON.stringify({
        success: true,
        ...finalAnalysis,
        sources_used: {
          image: true,
          voice: !!voiceAnalysis
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Analysis error:', error)
    // Return a 200 with success:false so the client can show a friendly error
    // and we can see the exact server-side message in the response body.
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as any)?.message || 'Failed to analyze content',
        details: String(error)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

// ============================================
// IMAGE ANALYSIS FUNCTION
// ============================================
async function analyzeImage(imageUrl: string, apiKey: string) {
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

Return ONLY the JSON object.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
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
      max_tokens: 800,
      temperature: 0.4
    })
  })

  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error.message || 'Image analysis failed')
  }

  const aiResponse = data.choices[0].message.content.trim()
  const cleanJson = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  
  const parsed = JSON.parse(cleanJson)
  
  return sanitizeAnalysis(parsed)
}

// ============================================
// VOICE ANALYSIS FUNCTION
// ============================================
async function analyzeVoice(transcript: string, apiKey: string) {
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
**description**: Expand their words into a detailed, compelling 4-6 sentence paragraph (150-300 words). Cover features, condition, value, and appeal. Make it flow naturally and sound professional while keeping their authentic details.
**price**: The asking price they mention (if they say "around $100" → 100)
**minimum_price**: Extract if they say "but I'd take...", "willing to accept...", "at least...", "no lower than..." (if not mentioned → 70% of price)
**category**: Choose best fit from: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other
**condition**: Map from their words (new, like_new, good, fair, poor)
**tags**: 3-5 searchable keywords (lowercase)
**selling_points**: 2-4 key highlights they emphasize

Return ONLY the JSON object.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.4
    })
  })

  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.error.message || 'Voice analysis failed')
  }

  const aiResponse = data.choices[0].message.content.trim()
  const cleanJson = aiResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  
  const parsed = JSON.parse(cleanJson)
  
  return sanitizeAnalysis(parsed)
}

// ============================================
// INTELLIGENT MERGE FUNCTION
// ============================================
function mergeAnalyses(imageAnalysis: any, voiceAnalysis: any) {
  console.log('🔀 Merging analyses...')
  
  // TITLE: Prioritize voice if more specific, else use image
  const title = (voiceAnalysis.title && voiceAnalysis.title.length > 10)
    ? voiceAnalysis.title
    : imageAnalysis.title

  // DESCRIPTION: Combine both for richer context
  const description = combineDescriptions(
    imageAnalysis.description, 
    voiceAnalysis.description
  )

  // PRICE: Prioritize voice if explicitly mentioned, else use image
  const price = voiceAnalysis.price && voiceAnalysis.price > 0
    ? voiceAnalysis.price
    : imageAnalysis.price

  // MINIMUM PRICE: Use voice if mentioned, else calculate from final price
  let minimum_price
  if (voiceAnalysis.minimum_price && voiceAnalysis.minimum_price > 0) {
    minimum_price = voiceAnalysis.minimum_price
  } else if (imageAnalysis.minimum_price && imageAnalysis.minimum_price > 0) {
    minimum_price = imageAnalysis.minimum_price
  } else {
    minimum_price = Math.round(price * 0.7)
  }

  // Ensure minimum doesn't exceed price
  if (minimum_price > price) {
    const temp = minimum_price
    minimum_price = price
    price = temp
  }

  // CATEGORY & CONDITION: Use most specific
  const category = voiceAnalysis.category !== 'other' 
    ? voiceAnalysis.category 
    : imageAnalysis.category

  const condition = voiceAnalysis.condition || imageAnalysis.condition

  // TAGS: Combine and deduplicate
  const allTags = [
    ...new Set([
      ...imageAnalysis.tags,
      ...voiceAnalysis.tags
    ])
  ].slice(0, 6)

  // SELLING POINTS: Combine unique points
  const allSellingPoints = [
    ...new Set([
      ...imageAnalysis.selling_points,
      ...voiceAnalysis.selling_points
    ])
  ].slice(0, 5)

  return {
    title,
    description,
    price,
    minimum_price,
    category,
    condition,
    tags: allTags,
    selling_points: allSellingPoints
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function combineDescriptions(imageDesc: string, voiceDesc: string) {
  if (imageDesc && voiceDesc) {
    const imageLower = imageDesc.toLowerCase()
    const voiceLower = voiceDesc.toLowerCase()
    
    if (!imageLower.includes(voiceLower.substring(0, 30))) {
      return `${imageDesc} ${voiceDesc}`.trim()
    }
    
    return voiceDesc
  }
  
  return voiceDesc || imageDesc
}

function sanitizeAnalysis(data: any) {
  return {
    title: String(data.title || 'Item for Sale').substring(0, 50),
    description: String(data.description || '').substring(0, 500),
    price: validatePrice(data.price),
    minimum_price: data.minimum_price ? validatePrice(data.minimum_price) : null,
    category: validateCategory(data.category),
    condition: validateCondition(data.condition),
    tags: Array.isArray(data.tags) 
      ? data.tags.slice(0, 6).map((t: any) => String(t).toLowerCase().trim())
      : [],
    selling_points: Array.isArray(data.selling_points)
      ? data.selling_points.slice(0, 5).map((p: any) => String(p).trim())
      : []
  }
}

function validatePrice(price: any): number {
  const parsed = parseFloat(price)
  if (isNaN(parsed) || parsed < 0) return 25
  if (parsed > 999999) return 999999
  return Math.round(parsed * 100) / 100
}

function validateCategory(category: any): string {
  const validCategories = [
    'electronics', 'clothing', 'furniture', 'books', 
    'toys', 'sports', 'home_garden', 'automotive', 
    'collectibles', 'other'
  ]
  
  const normalized = String(category || 'other').toLowerCase().replace(/\s+/g, '_')
  return validCategories.includes(normalized) ? normalized : 'other'
}

function validateCondition(condition: any): string {
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor']
  const normalized = String(condition || 'good').toLowerCase().replace(/[\s-]/g, '_')
  return validConditions.includes(normalized) ? normalized : 'good'
}

// ============================================
// QUICK ITEM IDENTIFICATION (for market research)
// ============================================
async function quickIdentifyItem(imageUrl: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Use a vision-capable model for image input; gpt-4o-mini may not support images
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Identify this item in 3-5 words (brand, model, key feature). Examples: "iPhone 12 Pro 128GB", "Nike Air Max 90", "IKEA KALLAX Shelf". Be specific and concise.' 
              },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 30,
        temperature: 0.1
      })
    })

    const data = await response.json()
    const identification = data.choices[0].message.content.trim()
    return identification
  } catch (error) {
    console.error('Quick identification failed:', error)
    return '' // Fallback to no market research
  }
}

// ============================================
// MARKET RESEARCH WITH SERPER API
// ============================================
async function searchMarketPrices(itemTitle: string, apiKey: string) {
  try {
    console.log('🔍 Searching market prices for:', itemTitle)
    
    // Search for sold/completed listings (most accurate pricing)
    const searchQuery = `${itemTitle} price Australia sold ebay gumtree`
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'au', // Australia
        num: 5, // Only 5 results for speed
        type: 'search'
      })
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`)
    }

    const results = await response.json()
    
    // Extract prices from search results
    const prices = extractPricesFromResults(results.organic || [])
    
    if (prices.length === 0) {
      console.log('⚠️ No prices found in search results')
      return null
    }
    
    // Calculate pricing statistics
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const suggestedPrice = Math.round(avgPrice * 1.05) // 5% above average for wiggle room
    const minimumPrice = Math.round(avgPrice * 0.75) // 75% of average for negotiation floor
    
    return {
      suggestedPrice,
      minimumPrice,
      summary: `Based on ${prices.length} recent listings: $${minPrice}-$${maxPrice} (avg: $${avgPrice})`,
      priceRange: { min: minPrice, max: maxPrice, average: avgPrice },
      dataPoints: prices.length
    }
  } catch (error) {
    console.error('Market research failed:', error)
    return null // Graceful fallback
  }
}

// ============================================
// EXTRACT PRICES FROM SEARCH RESULTS
// ============================================
function extractPricesFromResults(results: any[]): number[] {
  const prices: number[] = []
  const pricePattern = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    
    // Skip if it's clearly not a price (shipping, description, etc.)
    if (text.includes('shipping') || text.includes('postage') || text.includes('delivery')) {
      continue
    }
    
    // Extract all dollar amounts
    const matches = text.matchAll(pricePattern)
    for (const match of matches) {
      const price = parseFloat(match[1].replace(/,/g, ''))
      
      // Filter reasonable prices (between $5 and $10,000)
      if (price >= 5 && price <= 10000) {
        prices.push(price)
      }
    }
  }
  
  // Remove outliers (prices more than 2x the median)
  if (prices.length > 3) {
    prices.sort((a, b) => a - b)
    const median = prices[Math.floor(prices.length / 2)]
    return prices.filter(p => p <= median * 2 && p >= median * 0.5)
  }
  
  return prices
}

// ============================================
// MODIFIED IMAGE ANALYSIS (with market data support)
// ============================================
async function analyzeImageWithMarketData(imageUrl: string, apiKey: string, marketData: any) {
  // Use the existing analyzeImage function
  return analyzeImage(imageUrl, apiKey)
}

