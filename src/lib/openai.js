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

/**
 * Generate content from image using GPT-4o Vision
 * @param {string} imageUri - URI of the image (can be local or remote)
 * @param {string} prompt - Prompt for content generation
 * @returns {Promise<string>} - Generated content
 */
export const generateContent = async (imageUri, prompt) => {
  try {
    // For local URIs, we need to convert to base64
    // For remote URLs, we can use directly
    let imageContent;
    
    if (imageUri.startsWith('http')) {
      // Remote URL - use directly
      imageContent = {
        type: 'image_url',
        image_url: { url: imageUri }
      };
    } else {
      // Local URI - convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      imageContent = {
        type: 'image_url',
        image_url: { url: base64 }
      };
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketplace listing creator. Analyze images and generate compelling, accurate content for product listings.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            imageContent
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating content from image:', error);
    throw new Error('Failed to generate AI content');
  }
};

// Detect offer amount from user message
function detectOfferAmount(message) {
  const offerKeywords = [
    'offer', 'pay', 'give', 'how about', 'would you take', 
    'willing to pay', 'can i pay', 'could i pay', 'accept', 
    'buy for', 'purchase for', 'will you take',
    "i'll give", 'my offer is', 'what about', 'can you do',
    'would you accept', 'i can do', 'my budget is', 'tops'
  ];

  const messageLower = message.toLowerCase();
  const hasOfferKeyword = offerKeywords.some(keyword => messageLower.includes(keyword));

  if (hasOfferKeyword) {
    // Try to extract price: $50, 50 dollars, 50 bucks
    const priceMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i);
    if (priceMatch) {
      const priceStr = (priceMatch[1] || priceMatch[2]).replace(/,/g, '');
      return parseFloat(priceStr);
    }
  }

  return null;
}

// Calculate counter-offer based on aggressiveness
function calculateCounterOffer(offerAmount, askingPrice, minimumPrice, aggressiveness = 'balanced') {
  const gapToAsking = askingPrice - offerAmount;
  const marginBelowAsking = ((askingPrice - offerAmount) / askingPrice) * 100;

  // Aggressiveness strategies
  const strategies = {
    passive: {
      high: 0.50,  // >40% below
      medium: 0.40, // >20% below
      low: 0.30     // otherwise
    },
    balanced: {
      high: 0.60,
      medium: 0.45,
      low: 0.35
    },
    aggressive: {
      high: 0.75,
      medium: 0.60,
      low: 0.45
    },
    very_aggressive: {
      high: 0.85,
      medium: 0.75,
      low: 0.60
    }
  };

  const strategy = strategies[aggressiveness] || strategies.balanced;
  
  let counterPercentage;
  if (marginBelowAsking > 40) {
    counterPercentage = strategy.high;
  } else if (marginBelowAsking > 20) {
    counterPercentage = strategy.medium;
  } else {
    counterPercentage = strategy.low;
  }

  // Calculate counter
  let calculatedCounter = offerAmount + (gapToAsking * counterPercentage);
  let counterOfferAmount = Math.ceil(calculatedCounter);

  // Safety checks
  counterOfferAmount = Math.max(
    minimumPrice + 1, 
    Math.min(counterOfferAmount, askingPrice - 1)
  );

  // Ensure meaningful increase
  const minimumIncrease = Math.max(5, offerAmount * 0.02);
  if (counterOfferAmount - offerAmount < minimumIncrease) {
    counterOfferAmount = Math.ceil(offerAmount + minimumIncrease);
  }

  return counterOfferAmount;
}

/**
 * Negotiate price with AI agent
 * @param {Object} itemData - Item details (price, minimumPrice, title, condition, description)
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @param {string} aggressiveness - 'passive', 'balanced', 'aggressive', 'very_aggressive'
 * @param {number} counterCount - Number of times we've countered
 * @returns {Promise<string>} - AI response
 */
export const negotiatePrice = async (itemData, conversationHistory, aggressiveness = 'balanced', counterCount = 0) => {
  try {
    const askingPrice = itemData.price;
    const minimumPrice = itemData.minimumPrice || (askingPrice * 0.70); // Default 70%
    
    // Get user's last message
    const lastUserMessage = conversationHistory[conversationHistory.length - 1];
    const userMessage = lastUserMessage?.content || '';
    
    // Detect offer
    const offerAmount = detectOfferAmount(userMessage);

    // Check if offer should be auto-accepted
    if (offerAmount && offerAmount >= minimumPrice) {
      const marginBelowAsking = ((askingPrice - offerAmount) / askingPrice) * 100;
      const acceptThresholdAsking = 5; // Within 5% of asking
      const acceptThresholdMinimum = 2; // Within 2% above minimum

      if (marginBelowAsking <= acceptThresholdAsking || 
          ((offerAmount - minimumPrice) / minimumPrice * 100) <= acceptThresholdMinimum) {
        // AUTO-ACCEPT
        return `Great offer! I can absolutely accept $${offerAmount.toFixed(2)} for the ${itemData.title}. This is a fair price given the ${itemData.condition.toLowerCase()} condition and everything included. Let's proceed with the purchase!`;
      }
    }

    // If offer is above minimum but not in auto-accept range, counter strategically
    if (offerAmount && offerAmount >= minimumPrice) {
      // If already countered 3 times, accept their offer or offer minimum
      if (counterCount >= 3) {
        const finalPrice = Math.max(offerAmount, minimumPrice);
        return `You know what, I appreciate your persistence! Let's make this happen at $${finalPrice.toFixed(2)}. This is my absolute final offer for the ${itemData.title}. Deal?`;
      }

      const counterAmount = calculateCounterOffer(offerAmount, askingPrice, minimumPrice, aggressiveness);
      
      // CRITICAL: Never counter above asking price
      const safeCounterAmount = Math.min(counterAmount, askingPrice - 0.01);
      
      // Generate response based on aggressiveness
      let tone = '';
      if (aggressiveness === 'passive') {
        tone = 'warm and flexible';
      } else if (aggressiveness === 'balanced') {
        tone = 'friendly but firm';
      } else if (aggressiveness === 'aggressive' || aggressiveness === 'very_aggressive') {
        tone = 'confident and value-focused';
      }

      const isFinalCounter = counterCount >= 2;
      const systemPrompt = `You are negotiating on behalf of a seller. The item is listed at $${askingPrice}.
      
CRITICAL RULES:
- Buyer offered: $${offerAmount}
- You MUST counter with EXACTLY: $${safeCounterAmount.toFixed(2)}
- NEVER go below $${safeCounterAmount.toFixed(2)}
- NEVER go above $${askingPrice}
- NEVER accept less than $${minimumPrice}
- Be ${tone} in tone
- Keep response to 2-3 sentences
- Highlight the value and condition
${isFinalCounter ? '- This is your FINAL counter. Say "This is my final offer"' : ''}
- End with: "Would you consider $${safeCounterAmount.toFixed(2)}?"`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 120
      });

      return response.choices[0].message.content;
    }

    // If below minimum price, politely decline
    if (offerAmount && offerAmount < minimumPrice) {
      return `I appreciate your interest in the ${itemData.title}! Unfortunately, $${offerAmount.toFixed(2)} is below what I can accept for this ${itemData.condition.toLowerCase()} item. The lowest I can go is $${minimumPrice.toFixed(2)}, which reflects its excellent condition and included accessories. Would that work for you?`;
    }

    // General conversation (no offer detected)
    const systemPrompt = `You are a friendly AI assistant helping negotiate the sale of: ${itemData.title}
    
Item Details:
- Listed Price: $${askingPrice}
- Condition: ${itemData.condition}
- Description: ${itemData.description}

Guidelines:
- Be warm and helpful
- Answer questions about the item
- Encourage them to make an offer
- Keep responses to 2-3 sentences
- Don't mention specific prices unless they ask`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5) // Last 5 messages for context
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.8,
      max_tokens: 120
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in negotiation:', error);
    throw new Error('Failed to generate negotiation response');
  }
};

/**
 * Transcribe audio using Whisper API (Web version)
 * @param {string|File} audioSource - Audio file or URI
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudio = async (audioSource) => {
  try {
    console.log('Transcribing audio...');
    
    // Check if we have the API key
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const formData = new FormData();
    
    // Handle both File objects and URIs
    if (audioSource instanceof File) {
      formData.append('file', audioSource);
    } else if (typeof audioSource === 'string') {
      // If it's a URL, fetch it first
      const response = await fetch(audioSource);
      const blob = await response.blob();
      formData.append('file', blob, 'audio.m4a');
    } else {
      throw new Error('Invalid audio source');
    }
    
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Transcription failed: ${JSON.stringify(errorData)}`);
    }

    const transcription = await response.text();
    console.log('Transcription succeeded:', transcription);
    return transcription;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

export default openai;

