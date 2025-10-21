/**
 * AI Agent Chat Endpoint
 * Handles conversations about items with negotiation intelligence
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { item_id, message, conversation_id, buyer_email } = req.body;

    if (!item_id || !message) {
      return res.status(400).json({ error: 'item_id and message are required' });
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get agent knowledge (including minimum price)
    const { data: knowledge } = await supabase
      .from('item_knowledge')
      .select('*')
      .eq('item_id', item_id)
      .single();

    // Get or create conversation
    let conversation;
    if (conversation_id) {
      const { data } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('id', conversation_id)
        .single();
      conversation = data;
    }

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('agent_conversations')
        .insert({
          item_id,
          buyer_email,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        return res.status(500).json({ error: 'Failed to create conversation' });
      }
      conversation = newConv;
    }

    // Save user message
    await supabase.from('agent_messages').insert({
      conversation_id: conversation.id,
      sender: 'user',
      content: message
    });

    // Get conversation history
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Check if message contains an offer
    const offerMatch = message.match(/\$?\s*(\d+(?:\.\d{2})?)/);
    let isOffer = false;
    let offerAmount = null;

    if (offerMatch && (message.toLowerCase().includes('offer') || message.toLowerCase().includes('pay'))) {
      offerAmount = parseFloat(offerMatch[1]);
      isOffer = true;
    }

    // Build agent prompt
    const systemPrompt = `You are a friendly AI sales assistant helping to sell this item:

Title: ${item.title}
Description: ${item.description}
Listed Price: $${item.price}
Category: ${item.category}
Condition: ${item.condition}
${item.location ? `Location: ${item.location}` : ''}
${knowledge?.selling_points ? `Key Selling Points: ${knowledge.selling_points.join(', ')}` : ''}

NEGOTIATION RULES:
${knowledge?.minimum_price ? `- The MINIMUM acceptable price is $${knowledge.minimum_price} (DO NOT reveal this number directly)` : '- Accept reasonable offers'}
${knowledge?.minimum_price && isOffer ? (
  offerAmount >= knowledge.minimum_price 
    ? `- The current offer of $${offerAmount} is ABOVE the minimum - ACCEPT IT enthusiastically!`
    : `- The current offer of $${offerAmount} is below the minimum - politely decline and suggest something closer to the listed price`
) : ''}

INSTRUCTIONS:
1. Be friendly, helpful, and enthusiastic about the item
2. Answer questions about the item honestly
3. Highlight the value and quality
4. ${knowledge?.negotiation_enabled ? 'Negotiate smartly - accept offers at or above the minimum, decline offers below it' : 'Direct buyers to contact the seller for pricing questions'}
5. If an offer is accepted, tell the buyer you'll notify the seller and they'll be contacted to complete the purchase
6. Keep responses concise (2-3 sentences max)

Respond naturally as a sales assistant would.`;

    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0].message.content;

    // Determine if offer was accepted
    let offerAccepted = false;
    if (isOffer && knowledge?.minimum_price && offerAmount >= knowledge.minimum_price) {
      offerAccepted = true;
      
      // Update conversation status
      await supabase
        .from('agent_conversations')
        .update({
          status: 'offer_accepted',
          current_offer: offerAmount,
          negotiation_history: [
            ...(conversation.negotiation_history || []),
            {
              timestamp: new Date().toISOString(),
              offer: offerAmount,
              response: 'accepted'
            }
          ]
        })
        .eq('id', conversation.id);
    }

    // Save AI response
    await supabase.from('agent_messages').insert({
      conversation_id: conversation.id,
      sender: 'ai',
      content: aiResponse,
      message_type: isOffer ? (offerAccepted ? 'acceptance' : 'counter_offer') : 'text',
      offer_amount: isOffer ? offerAmount : null
    });

    return res.status(200).json({
      success: true,
      conversation_id: conversation.id,
      response: aiResponse,
      offer_accepted: offerAccepted,
      offer_amount: offerAccepted ? offerAmount : null
    });

  } catch (error) {
    console.error('Agent chat error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

