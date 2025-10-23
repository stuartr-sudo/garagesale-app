import { supabase } from '@/lib/supabase';

/**
 * Syncs item data with the agent knowledge base
 * This ensures the AI agent has the most up-to-date information about items
 */
export const syncItemWithKnowledgeBase = async (itemId, itemData) => {
  try {
    console.log('Syncing item with knowledge base:', { itemId, itemData });

    // Check if knowledge base entry exists
    const { data: existingKnowledge, error: fetchError } = await supabase
      .from('item_knowledge')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing knowledge:', fetchError);
      return { success: false, error: fetchError };
    }

    // Prepare knowledge base data
    const knowledgeData = {
      item_id: itemId,
      minimum_price: itemData.minimum_price || null,
      negotiation_enabled: true,
      updated_at: new Date().toISOString()
    };

    // If additional_info exists, preserve it
    if (existingKnowledge?.additional_info) {
      knowledgeData.additional_info = existingKnowledge.additional_info;
    }

    // If selling_points exist, preserve them
    if (existingKnowledge?.selling_points) {
      knowledgeData.selling_points = existingKnowledge.selling_points;
    }

    // If FAQs exist, preserve them
    if (existingKnowledge?.faqs) {
      knowledgeData.faqs = existingKnowledge.faqs;
    }

    let result;
    if (existingKnowledge) {
      // Update existing knowledge base entry
      const { data, error } = await supabase
        .from('item_knowledge')
        .update(knowledgeData)
        .eq('item_id', itemId)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new knowledge base entry
      const { data, error } = await supabase
        .from('item_knowledge')
        .insert([{
          ...knowledgeData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error syncing knowledge base:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Successfully synced knowledge base:', result.data);
    return { success: true, data: result.data };

  } catch (error) {
    console.error('Unexpected error syncing knowledge base:', error);
    return { success: false, error };
  }
};

/**
 * Updates the knowledge base with voice transcription data
 */
export const updateKnowledgeWithVoiceData = async (itemId, voiceTranscription) => {
  try {
    console.log('Updating knowledge base with voice data:', { itemId, voiceTranscription });

    // Get existing knowledge base entry
    const { data: existingKnowledge, error: fetchError } = await supabase
      .from('item_knowledge')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing knowledge:', fetchError);
      return { success: false, error: fetchError };
    }

    // Prepare additional_info with voice data
    const additionalInfo = existingKnowledge?.additional_info || {};
    const voiceData = {
      has_voice_input: true,
      voice_transcription: voiceTranscription,
      voice_updated_at: new Date().toISOString()
    };

    const updatedAdditionalInfo = {
      ...additionalInfo,
      ...voiceData
    };

    const knowledgeData = {
      item_id: itemId,
      additional_info: updatedAdditionalInfo,
      updated_at: new Date().toISOString()
    };

    // Preserve existing data
    if (existingKnowledge) {
      knowledgeData.minimum_price = existingKnowledge.minimum_price;
      knowledgeData.selling_points = existingKnowledge.selling_points;
      knowledgeData.faqs = existingKnowledge.faqs;
      knowledgeData.negotiation_enabled = existingKnowledge.negotiation_enabled;
    }

    let result;
    if (existingKnowledge) {
      // Update existing entry
      const { data, error } = await supabase
        .from('item_knowledge')
        .update(knowledgeData)
        .eq('item_id', itemId)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('item_knowledge')
        .insert([{
          ...knowledgeData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error updating knowledge base with voice data:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Successfully updated knowledge base with voice data:', result.data);
    return { success: true, data: result.data };

  } catch (error) {
    console.error('Unexpected error updating knowledge base with voice data:', error);
    return { success: false, error };
  }
};

/**
 * Extracts selling points from voice transcription using AI
 */
export const extractSellingPointsFromVoice = async (voiceTranscription, itemTitle) => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not available for selling points extraction');
      return [];
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const prompt = `Extract key selling points from this voice transcription about "${itemTitle}".

Voice transcription: "${voiceTranscription}"

Return a JSON array of 3-5 key selling points that would help sell this item. Focus on:
- Unique features
- Condition details
- Value propositions
- Special characteristics

Example format: ["Handcrafted from premium materials", "Excellent condition with minimal wear", "Rare vintage piece from 1980s"]

Return only the JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0].message.content.trim();
    const sellingPoints = JSON.parse(content);

    return Array.isArray(sellingPoints) ? sellingPoints : [];

  } catch (error) {
    console.error('Error extracting selling points from voice:', error);
    return [];
  }
};

/**
 * Generates FAQs from voice transcription using AI
 */
export const generateFAQsFromVoice = async (voiceTranscription, itemTitle) => {
  try {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not available for FAQ generation');
      return {};
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const prompt = `Generate 3-5 relevant FAQs based on this voice transcription about "${itemTitle}".

Voice transcription: "${voiceTranscription}"

Return a JSON object with questions as keys and answers as values.
Focus on common buyer questions like:
- Condition details
- Authenticity
- Shipping/pickup
- History/provenance
- Care instructions

Example format: {
  "What condition is this item in?": "The item is in excellent condition with only minor wear",
  "Is this authentic?": "Yes, this is an authentic piece with original markings"
}

Return only the JSON object, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0].message.content.trim();
    const faqs = JSON.parse(content);

    return typeof faqs === 'object' && faqs !== null ? faqs : {};

  } catch (error) {
    console.error('Error generating FAQs from voice:', error);
    return {};
  }
};
