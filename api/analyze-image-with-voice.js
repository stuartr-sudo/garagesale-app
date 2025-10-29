/**
 * AI Image Analysis with Voice & SERP API Integration
 * 
 * This endpoint calls the Supabase edge function that combines:
 * - Image analysis (GPT-4o Vision)
 * - Voice transcription (if provided)
 * - SERP API market research for pricing
 * - Intelligent merging of all data sources
 * 
 * Endpoint: POST /api/analyze-image-with-voice
 * Body: { imageUrl: string, voiceTranscript?: string }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('🔄 Calling Supabase edge function analyze-image-with-voice...');
    console.log('Image URL:', imageUrl.substring(0, 80) + '...');
    console.log('Voice transcript length:', voiceTranscript?.length || 0);

    // Call the Supabase edge function
    const { data, error } = await supabase.functions.invoke('analyze-image-with-voice', {
      body: {
        imageUrl,
        voiceTranscript: voiceTranscript || null
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw new Error(error.message || 'Failed to analyze with edge function');
    }

    if (!data || !data.success) {
      console.error('❌ Edge function returned error:', data?.error);
      throw new Error(data?.error || 'Edge function returned unsuccessful response');
    }

    console.log('✅ Analysis complete:', {
      title: data.title?.substring(0, 50),
      hasVoice: !!data.voiceTranscript,
      hasMarketData: !!data.market_research
    });

    // Transform the response to match expected format
    const analysis = {
      category: data.category || 'Other',
      title: data.title || '',
      description: data.description || '',
      condition: data.condition || 'Good',
      priceRange: data.price ? {
        min: data.minimum_price || Math.round(data.price * 0.7),
        max: data.price || Math.round((data.minimum_price || data.price) * 1.3)
      } : {
        min: 0,
        max: 0
      },
      tags: data.tags || [],
      selling_points: data.selling_points || [],
      attributes: data.attributes || {},
      marketingTips: data.marketing_tips || '',
      qualityFlags: data.quality_flags || {},
      market_research: data.market_research || null,
      sources_used: data.sources_used || {}
    };

    // Calculate confidence based on sources used
    let confidence = 0.7; // Base confidence
    if (data.sources_used?.image) confidence += 0.15;
    if (data.sources_used?.voice) confidence += 0.1;
    if (data.market_research) confidence += 0.05;

    return res.status(200).json({
      success: true,
      analysis,
      confidence: Math.min(confidence, 1.0),
      sources_used: data.sources_used || {},
      market_research: data.market_research || null
    });

  } catch (error) {
    console.error('❌ Error in analyze-image-with-voice API:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to analyze image with voice',
      details: error.message 
    });
  }
}
