/**
 * AI Agent Chat Endpoint
 * Handles conversations about items with negotiation intelligence
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

// Debug environment variables
console.log('Environment check:', {
  supabaseUrl: !!supabaseUrl,
  supabaseServiceKey: !!supabaseServiceKey,
  openaiApiKey: !!openaiApiKey
});

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const openai = new OpenAI({ apiKey: openaiApiKey });

export default async function handler(req, res) {
  console.log('=== AGENT CHAT REQUEST START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check environment variables
    console.log('Checking environment variables...');
    console.log('supabaseUrl exists:', !!supabaseUrl);
    console.log('supabaseServiceKey exists:', !!supabaseServiceKey);
    console.log('openaiApiKey exists:', !!openaiApiKey);
    
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error('MISSING ENVIRONMENT VARIABLES!');
      return res.status(500).json({ 
        error: 'Server configuration error - missing environment variables',
        debug: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceKey: !!supabaseServiceKey,
          openaiApiKey: !!openaiApiKey
        }
      });
    }

    console.log('Environment variables OK, processing request...');
    const { item_id, message, conversation_id, buyer_email } = req.body;

    if (!item_id || !message) {
      return res.status(400).json({ error: 'item_id and message are required' });
    }

    // Get item details
    console.log('Querying item with ID:', item_id);
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', item_id)
      .single();

    console.log('Item query result:', { item, itemError });

    if (itemError || !item) {
      console.error('Item not found:', itemError);
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

    // Determine negotiation strategy
    let negotiationStrategy = '';
    let counterOfferAmount = null;
    if (knowledge?.minimum_price && isOffer && offerAmount) {
      const askingPrice = parseFloat(item.price);
      const minimumPrice = parseFloat(knowledge.minimum_price);
      
      if (offerAmount >= askingPrice) {
        // Offer at or above asking - accept immediately
        negotiationStrategy = `- ACCEPT this offer of $${offerAmount} immediately! It's at or above the asking price. Tell them you accept and provide payment details.`;
      } else if (offerAmount >= minimumPrice && offerAmount < askingPrice) {
        // Offer above minimum but below asking - counter offer with randomness
        // Instead of always meeting in the middle, use a random percentage between 55-75%
        const randomPercentage = 0.55 + (Math.random() * 0.20); // Random between 55% and 75%
        const gap = askingPrice - offerAmount;
        counterOfferAmount = Math.round(offerAmount + (gap * randomPercentage));
        
        // Make sure counter offer is at least above their offer and below asking
        counterOfferAmount = Math.max(offerAmount + 5, Math.min(counterOfferAmount, askingPrice - 5));
        
        negotiationStrategy = `- This offer of $${offerAmount} is good but below asking. Counter with $${counterOfferAmount}. Be friendly and explain why this price is fair given the item's condition and value.`;
      } else {
        // Offer below minimum - politely decline
        negotiationStrategy = `- This offer of $${offerAmount} is below minimum. Politely decline and suggest they consider the listed price of $${askingPrice}, emphasizing the item's quality and value.`;
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

NEGOTIATION RULES:
${knowledge?.minimum_price ? `- The MINIMUM acceptable price is $${knowledge.minimum_price} (DO NOT reveal this number directly)` : '- Accept reasonable offers'}
${negotiationStrategy}

INSTRUCTIONS:
1. Be friendly, helpful, and enthusiastic about the item
2. Answer questions about the item honestly
3. Highlight the value and quality
4. ${knowledge?.negotiation_enabled ? 'Negotiate smartly using the strategy above' : 'Direct buyers to contact the seller for pricing questions'}
5. If an offer is ACCEPTED (at or above asking price), provide these Commonwealth Bank payment details:
   - Account Name: GarageSale Marketplace
   - BSB: 062-000
   - Account Number: 1234 5678
   - Reference: Use item title as reference
   Then tell them the seller will confirm receipt and arrange collection/delivery.
6. Keep responses concise (2-3 sentences max)

Respond naturally as a sales assistant would.`;

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

    // Determine if offer was accepted (only if at or above asking price)
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
        const counterOffer = Math.round((offerAmount + askingPrice) / 2);
        
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
                counter_offer: counterOffer,
                response: 'countered',
                reason: 'below_asking_above_minimum'
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (minimumPrice && offerAmount < minimumPrice) {
        // Decline offers below minimum
        await supabase
          .from('agent_conversations')
          .update({
            current_offer: offerAmount,
            negotiation_history: [
              ...(conversation.negotiation_history || []),
              {
                timestamp: new Date().toISOString(),
                offer: offerAmount,
                response: 'declined',
                reason: 'below_minimum'
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
    console.error('=== AGENT CHAT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openaiApiKey: !!openaiApiKey
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      type: error.name,
      stack: error.stack,
      env: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        openaiApiKey: !!openaiApiKey
      }
    });
  }
}

