import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId } = req.query;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    // Get item knowledge data including voice transcription
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('item_knowledge')
      .select('additional_info, selling_points, minimum_price, negotiation_enabled')
      .eq('item_id', itemId)
      .single();

    if (knowledgeError) {
      console.error('Error fetching item knowledge:', knowledgeError);
      return res.status(404).json({ error: 'Item knowledge not found' });
    }

    // Extract voice transcription data
    const voiceData = {
      hasVoiceInput: knowledge.additional_info?.has_voice_input || false,
      voiceTranscription: knowledge.additional_info?.voice_transcription || null,
      createdWithVoice: knowledge.additional_info?.created_with_voice || false,
      sellingPoints: knowledge.selling_points || [],
      minimumPrice: knowledge.minimum_price,
      negotiationEnabled: knowledge.negotiation_enabled
    };

    return res.status(200).json({
      success: true,
      voiceData
    });

  } catch (error) {
    console.error('Error getting item voice data:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get item voice data'
    });
  }
}
