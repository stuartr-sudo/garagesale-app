/**
 * Image Analysis API Endpoint
 * Analyzes photos taken with mobile camera and generates listing details
 */

import OpenAI from 'openai';

const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
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

    const prompt = `Analyze this image and generate a marketplace listing with the following details:

1. **Title**: A catchy, descriptive title (max 50 characters)
2. **Description**: A detailed description highlighting key features, condition, and appeal (2-3 sentences)
3. **Category**: Choose from: electronics, clothing, furniture, books, toys, sports, home_garden, automotive, collectibles, other
4. **Condition**: Choose from: new, like_new, good, fair, poor
5. **Suggested Price**: A reasonable market price estimate (number only)
6. **Tags**: 3-5 relevant tags for search (array of strings)
7. **Selling Points**: 2-3 key selling points (array of strings)

Focus on:
- What the item is
- Its condition and quality
- Unique features or benefits
- Why someone would want to buy it
- Appropriate pricing for the condition

Be specific and helpful for potential buyers.`;

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
      max_tokens: 500,
      temperature: 0.7
    });

    const analysisText = response.choices[0].message.content;

    // Parse the response to extract structured data
    const parseAnalysis = (text) => {
      const lines = text.split('\n').filter(line => line.trim());
      
      let title = '';
      let description = '';
      let category = 'other';
      let condition = 'good';
      let suggested_price = 0;
      let tags = [];
      let selling_points = [];

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('title:') || lowerLine.includes('**title**')) {
          title = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        } else if (lowerLine.includes('description:') || lowerLine.includes('**description**')) {
          description = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
        } else if (lowerLine.includes('category:') || lowerLine.includes('**category**')) {
          const cat = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '').toLowerCase();
          if (['electronics', 'clothing', 'furniture', 'books', 'toys', 'sports', 'home_garden', 'automotive', 'collectibles', 'other'].includes(cat)) {
            category = cat;
          }
        } else if (lowerLine.includes('condition:') || lowerLine.includes('**condition**')) {
          const cond = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '').toLowerCase();
          if (['new', 'like_new', 'good', 'fair', 'poor'].includes(cond)) {
            condition = cond;
          }
        } else if (lowerLine.includes('price:') || lowerLine.includes('**price**')) {
          const priceMatch = line.match(/\$?(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            suggested_price = parseFloat(priceMatch[1]);
          }
        } else if (lowerLine.includes('tags:') || lowerLine.includes('**tags**')) {
          const tagsText = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
          tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (lowerLine.includes('selling points:') || lowerLine.includes('**selling points**')) {
          const pointsText = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
          selling_points = pointsText.split(',').map(point => point.trim()).filter(point => point);
        }
      }

      // Fallback parsing if structured format wasn't followed
      if (!title && analysisText) {
        const sentences = analysisText.split('.');
        title = sentences[0]?.trim().substring(0, 50) || 'Item for Sale';
      }
      
      if (!description && analysisText) {
        description = analysisText.substring(0, 200);
      }

      return {
        title: title || 'Item for Sale',
        description: description || 'Great item in good condition',
        category,
        condition,
        suggested_price: suggested_price || 25,
        tags: tags.length > 0 ? tags : ['item', 'sale'],
        selling_points: selling_points.length > 0 ? selling_points : ['Good condition', 'Great value']
      };
    };

    const analysisResult = parseAnalysis(analysisText);

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
