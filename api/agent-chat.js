/**
 * AI Agent Chat Endpoint
 * Handles conversations about items with negotiation intelligence
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY?.trim();

// Verify environment variables are set
if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('MISSING ENVIRONMENT VARIABLES:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    openaiApiKey: !!openaiApiKey
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error('MISSING ENVIRONMENT VARIABLES!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        success: false
      });
    }

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
      console.error('Item not found:', itemError);
      return res.status(404).json({ error: 'Item not found', success: false });
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
    const messageLower = message.toLowerCase();
    const offerKeywords = ['offer', 'pay', 'give', 'how about', 'would you take', 'willing to pay', 'can i pay', 'could i pay', 'accept', 'buy for', 'purchase for'];
    const containsOfferKeyword = offerKeywords.some(keyword => messageLower.includes(keyword));
    
    const offerMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    let isOffer = false;
    let offerAmount = null;

    if (offerMatch && containsOfferKeyword) {
      // Remove commas from the number
      offerAmount = parseFloat(offerMatch[1].replace(/,/g, ''));
      isOffer = true;
    }

    // Determine negotiation strategy
    let negotiationStrategy = '';
    let counterOfferAmount = null;
    if (knowledge?.minimum_price && isOffer && offerAmount) {
      const askingPrice = parseFloat(item.price);
      const minimumPrice = parseFloat(knowledge.minimum_price);
      
      if (offerAmount >= askingPrice) {
        // Offer at or above asking - ACCEPT immediately
        negotiationStrategy = `- ACCEPT this offer of $${offerAmount} immediately! It meets or exceeds the asking price. Say something like "Thank you for your offer! I can absolutely accept $${offerAmount} for this item. Click the button below to proceed with payment."`;
      } else if (offerAmount >= minimumPrice && offerAmount < askingPrice) {
        // Offer between minimum and asking - COUNTER OFFER
        // Calculate counter: offer + (55-70% of the gap between offer and asking)
        const gap = askingPrice - offerAmount;
        const randomPercentage = 0.55 + (Math.random() * 0.15); // Random between 55% and 70%
        counterOfferAmount = Math.round(offerAmount + (gap * randomPercentage));
        
        // Ensure counter is above their offer and below asking
        counterOfferAmount = Math.max(offerAmount + 10, Math.min(counterOfferAmount, askingPrice - 10));
        
        negotiationStrategy = `- This offer of $${offerAmount} is good but below asking. Counter with $${counterOfferAmount}. Say something like "Thank you for your offer! While I appreciate it, I believe the [mention quality/condition] make it worth a bit more. How about we settle at $${counterOfferAmount}? I think that's a fair price for such a [quality descriptor] piece!" Keep it friendly and encouraging.`;
      } else {
        // Offer below minimum - politely decline and suggest minimum
        negotiationStrategy = `- This offer of $${offerAmount} is below the minimum acceptable price of $${minimumPrice}. Politely decline but be encouraging. Say something like "I really appreciate your offer! However, considering the [mention item quality/condition], I can only accept offers at or above $${minimumPrice}. Would you be willing to go for that?" Keep it friendly and positive.`;
      }
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

🚨 CRITICAL NEGOTIATION RULES - FOLLOW THESE EXACTLY:
${knowledge?.minimum_price ? `
ASKING PRICE: $${item.price}
MINIMUM ACCEPTABLE PRICE: $${knowledge.minimum_price} (NEVER reveal this exact number to the buyer)

THREE-TIER NEGOTIATION RULES:
1. ✅ Offer >= $${item.price} (at or above asking) → ACCEPT IMMEDIATELY
2. 🔄 Offer >= $${knowledge.minimum_price} AND < $${item.price} (between minimum and asking) → COUNTER OFFER
   - Your counter should be 55-70% of the gap between their offer and asking price
   - Be friendly and explain why the item is worth more
3. ❌ Offer < $${knowledge.minimum_price} (below minimum) → POLITELY DECLINE
   - Suggest they consider the minimum price range
   - Emphasize item quality and value
` : '- Accept reasonable offers based on asking price'}

CURRENT NEGOTIATION INSTRUCTION FOR THIS MESSAGE:
${negotiationStrategy}

📋 MANDATORY INSTRUCTIONS:
1. Be friendly, helpful, and enthusiastic about the item
2. Answer questions about the item honestly
3. Highlight the value and quality
4. **FOLLOW THE NEGOTIATION STRATEGY ABOVE EXACTLY**
5. Keep responses concise (2-3 sentences max)
6. When accepting an offer, say "I can absolutely accept $[AMOUNT]" and mention clicking the button below
7. When countering, clearly state your counter-offer amount and explain why
8. When declining, be polite but firm, emphasizing the item's quality

Respond naturally as a sales assistant would, but ALWAYS follow the negotiation rules above.`;

    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    // Get AI response
    console.log('Calling OpenAI API...');
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
    console.log('OpenAI API response received');

    const aiResponse = completion.choices[0].message.content;

    // Determine if offer was accepted or countered
    let offerAccepted = false;
    let offerCountered = false;
    const askingPrice = parseFloat(item.price);
    const minimumPrice = knowledge?.minimum_price ? parseFloat(knowledge.minimum_price) : null;
    
    if (isOffer && offerAmount) {
      if (offerAmount >= askingPrice) {
        // Accept offers at or above asking price
        offerAccepted = true;
        
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
                response: 'accepted',
                reason: 'at_or_above_asking'
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (minimumPrice && offerAmount >= minimumPrice && offerAmount < askingPrice) {
        // Counter offer for amounts between minimum and asking
        offerCountered = true;
        
        await supabase
          .from('agent_conversations')
          .update({
            status: 'negotiating',
            current_offer: offerAmount,
            negotiation_history: [
              ...(conversation.negotiation_history || []),
              {
                timestamp: new Date().toISOString(),
                offer: offerAmount,
                counter_offer: counterOfferAmount,
                response: 'countered',
                reason: 'between_minimum_and_asking'
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (minimumPrice && offerAmount < minimumPrice) {
        // Decline offers below minimum
        await supabase
          .from('agent_conversations')
          .update({
            status: 'declined',
            current_offer: offerAmount,
            negotiation_history: [
              ...(conversation.negotiation_history || []),
              {
                timestamp: new Date().toISOString(),
                offer: offerAmount,
                response: 'declined',
                reason: 'below_minimum',
                suggested_counter: minimumPrice
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (!minimumPrice && offerAmount >= askingPrice) {
        // No minimum set, accept offers at or above asking
        offerAccepted = true;
        
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
                response: 'accepted',
                reason: 'at_or_above_asking'
              }
            ]
          })
          .eq('id', conversation.id);
      }
    }

    // Save AI response
    await supabase.from('agent_messages').insert({
      conversation_id: conversation.id,
      sender: 'ai',
      content: aiResponse,
      message_type: isOffer ? (offerAccepted ? 'acceptance' : offerCountered ? 'counter_offer' : 'decline') : 'text',
      offer_amount: isOffer ? offerAmount : null,
      counter_offer_amount: offerCountered ? counterOfferAmount : null
    });

    return res.status(200).json({
      success: true,
      conversation_id: conversation.id,
      response: aiResponse,
      offer_accepted: offerAccepted,
      offer_countered: offerCountered,
      counter_offer_amount: offerCountered ? counterOfferAmount : null,
      offer_amount: offerAccepted ? offerAmount : null
    });

  } catch (error) {
    console.error('Agent chat error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      success: false
    });
  }
}

