import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through a backend
});

export const generateItemDescription = async (itemData) => {
  try {
    const prompt = `Generate a compelling marketplace listing for the following item:
    
Title: ${itemData.title}
Category: ${itemData.category}
Condition: ${itemData.condition}
${itemData.currentDescription ? `Current description: ${itemData.currentDescription}` : ''}

Please provide:
1. An enhanced, SEO-friendly title (if needed)
2. A detailed, engaging description that highlights key features and benefits
3. 5-7 relevant tags for better discoverability

Format the response as JSON with keys: title, description, tags (array)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates compelling product listings for a marketplace. Your descriptions should be honest, engaging, and optimized for search.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error generating description:', error);
    throw new Error('Failed to generate AI description');
  }
};

export const analyzeItemImage = async (imageUrl) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              content: 'Analyze this image and provide: 1) Item category 2) Suggested title 3) Brief description 4) Estimated condition. Format as JSON with keys: category, title, description, condition'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
};

export default openai;

