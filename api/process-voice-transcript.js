/**
 * Voice Transcript Processing API
 * Processes voice input and extracts listing details using AI
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
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

    const prompt = `Extract marketplace listing details from this spoken description:

"${transcript}"

Extract and return ONLY a JSON object with these fields:
{
  "title": "Short, catchy title (max 50 chars)",
  "description": "Detailed description (2-3 sentences)",
  "price": number,
  "minimum_price": number (if mentioned, otherwise null),
  "category": "one of: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other",
  "condition": "one of: new, like_new, good, fair, poor",
  "tags": ["array", "of", "relevant", "tags"],
  "location": "string if mentioned, otherwise null"
}

Rules:
1. Extract the title from the description (don't make one up)
2. If multiple prices mentioned, use the higher one as price, lower as minimum_price
3. Infer category from item description
4. Infer condition from description (excellent=like_new, good=good, etc.)
5. Generate 3-5 relevant tags
6. Only return valid JSON, no other text
7. If unclear, make reasonable assumptions
8. Price should be a number, not string`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content.trim();

    // Parse JSON response
    let extractedData;
    try {
      // Clean up the response to ensure it's valid JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI response:', aiResponse);
      
      // Fallback parsing
      extractedData = {
        title: transcript.split('.')[0].substring(0, 50) || 'Item for Sale',
        description: transcript.substring(0, 200),
        price: 25,
        minimum_price: null,
        category: 'other',
        condition: 'good',
        tags: ['item', 'sale'],
        location: null
      };
    }

    // Validate and clean the data
    const result = {
      title: extractedData.title || 'Item for Sale',
      description: extractedData.description || transcript.substring(0, 200),
      price: typeof extractedData.price === 'number' ? extractedData.price : 25,
      minimum_price: typeof extractedData.minimum_price === 'number' ? extractedData.minimum_price : null,
      category: ['electronics', 'clothing', 'furniture', 'books', 'toys', 'sports', 'home_garden', 'automotive', 'collectibles', 'other'].includes(extractedData.category) 
        ? extractedData.category : 'other',
      condition: ['new', 'like_new', 'good', 'fair', 'poor'].includes(extractedData.condition) 
        ? extractedData.condition : 'good',
      tags: Array.isArray(extractedData.tags) ? extractedData.tags.slice(0, 5) : ['item', 'sale'],
      location: extractedData.location || null
    };

    console.log('Voice processing completed:', {
      title: result.title,
      price: result.price,
      minimum_price: result.minimum_price,
      category: result.category
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
