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
          status: 'active',
          negotiation_history: []
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
    const offerKeywords = ['offer', 'pay', 'give', 'how about', 'would you take', 'willing to pay', 'can i pay', 'could i pay', 'accept', 'buy for', 'purchase for', 'will you take'];
    const containsOfferKeyword = offerKeywords.some(keyword => messageLower.includes(keyword));
    
    const offerMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    let isOffer = false;
    let offerAmount = null;

    if (offerMatch && containsOfferKeyword) {
      // Remove commas from the number
      offerAmount = parseFloat(offerMatch[1].replace(/,/g, ''));
      isOffer = true;
    }

    // NEGOTIATION LOGIC - USER'S EXACT SPECIFICATIONS
    let negotiationStrategy = '';
    let counterOfferAmount = null;
    let offerAccepted = false;
    let isSecondNegotiation = false;
    
    console.log('🔍 NEGOTIATION DEBUG:', {
      isOffer,
      offerAmount,
      itemPrice: item.price,
      minimumPrice: knowledge?.minimum_price,
      hasKnowledge: !!knowledge
    });
    
    if (isOffer && offerAmount) {
      const askingPrice = parseFloat(item.price);
      const minimumPrice = knowledge?.minimum_price ? parseFloat(knowledge.minimum_price) : askingPrice * 0.7; // Default to 70% if no minimum set
      const negotiationHistory = conversation.negotiation_history || [];
      
      console.log('💰 PRICE COMPARISON:', {
        offerAmount,
        askingPrice,
        minimumPrice,
        isAboveAsking: offerAmount >= askingPrice,
        isBelowMinimum: offerAmount < minimumPrice,
        isBetween: offerAmount >= minimumPrice && offerAmount < askingPrice
      });
      
      // Check if this is a second negotiation (user already got a counter-offer)
      const previousCounter = negotiationHistory.find(h => h.counter_offer);
      isSecondNegotiation = !!previousCounter;
      
      console.log('📊 NEGOTIATION STATE:', {
        isSecondNegotiation,
        previousCounter: previousCounter?.counter_offer,
        negotiationHistoryLength: negotiationHistory.length
      });
      
      if (offerAmount >= askingPrice) {
        // CASE 1: Offer at or above asking - ACCEPT immediately
        offerAccepted = true;
        negotiationStrategy = `✅ ACCEPT this offer of $${offerAmount} immediately! Say: "Thank you for your offer! I can absolutely accept $${offerAmount} for this item. Click the button below to proceed with payment."`;
        console.log('✅ CASE 1: Accepting offer at/above asking');
        
      } else if (offerAmount < minimumPrice) {
        // CASE 2: Offer below minimum - POLITELY DECLINE (no counter-offer)
        negotiationStrategy = `❌ This offer of $${offerAmount} is below minimum ($${minimumPrice}). Politely decline WITHOUT revealing the exact minimum. Say something like: "Thank you for your interest! However, I'm unable to accept $${offerAmount} for this item. Given its quality and condition, the listed price of $${askingPrice} truly reflects its value. Let me know if you'd like to reconsider!"`;
        console.log('❌ CASE 2: Declining offer below minimum');
        
      } else if (isSecondNegotiation && previousCounter) {
        // CASE 3: SECOND negotiation - Calculate between previous counter and new offer (FINAL OFFER)
        const previousCounterAmount = previousCounter.counter_offer;
        
        if (offerAmount >= previousCounterAmount) {
          // User accepted or exceeded our counter - ACCEPT
          offerAccepted = true;
          negotiationStrategy = `✅ ACCEPT this offer of $${offerAmount}! They met/exceeded your previous counter of $${previousCounterAmount}. Say: "Thank you for your offer! I can absolutely accept $${offerAmount} for this item. Click the button below to proceed with payment."`;
          console.log('✅ CASE 3A: Accepting offer that met previous counter');
        } else {
          // Calculate FINAL counter between previous counter and new offer
          const gap = previousCounterAmount - offerAmount;
          counterOfferAmount = Math.round(offerAmount + (gap * 0.5)); // Meet in the middle
          
          // Ensure it's at least minimum and reasonable
          counterOfferAmount = Math.max(minimumPrice, counterOfferAmount);
          
          negotiationStrategy = `🔄 FINAL COUNTER: This is the second negotiation. Your previous counter was $${previousCounterAmount}, they offered $${offerAmount}. Counter with $${counterOfferAmount} (split the difference) as your FINAL offer. Say: "I appreciate you working with me! To meet you halfway, I can offer $${counterOfferAmount} as my final price. This is truly the best I can do for such a quality item. What do you think?"`;
          console.log('🔄 CASE 3B: Final counter-offer', { counterOfferAmount });
        }
        
      } else {
        // CASE 4: FIRST negotiation between minimum and asking - Counter with 65-75% of gap
        const gap = askingPrice - offerAmount;
        const randomPercentage = 0.65 + (Math.random() * 0.10); // Random between 65% and 75%
        counterOfferAmount = Math.round(offerAmount + (gap * randomPercentage));
        
        // Ensure counter is above their offer and at least minimum
        counterOfferAmount = Math.max(minimumPrice, Math.max(offerAmount + 10, counterOfferAmount));
        
        negotiationStrategy = `🔄 FIRST COUNTER: Offer of $${offerAmount} is between minimum ($${minimumPrice}) and asking ($${askingPrice}). Counter with $${counterOfferAmount} (65-75% of gap). Say: "Thank you for your offer! I appreciate your interest. Given the quality and condition of this item, I'd be willing to accept $${counterOfferAmount}. I think that's a fair price that reflects its true value. Would that work for you?"`;
        console.log('🔄 CASE 4: First counter-offer', { gap, randomPercentage, counterOfferAmount });
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

🚨 CRITICAL NEGOTIATION RULES:
${knowledge?.minimum_price ? `
ASKING PRICE: $${item.price}
MINIMUM ACCEPTABLE: $${knowledge.minimum_price} (NEVER reveal this exact number)

NEGOTIATION LOGIC:
1. ❌ Below Minimum → Politely decline, NO counter-offer
2. 🔄 First Offer (between min-ask) → Counter with 65-75% of gap
3. 🔄 Second Offer → Counter between previous and new offer (FINAL)
4. ✅ At/Above Asking → Accept immediately
` : '- Accept reasonable offers based on asking price'}

🎯 CURRENT INSTRUCTION FOR THIS MESSAGE:
${negotiationStrategy}

📋 MANDATORY RULES:
1. Be friendly, warm, and encouraging
2. Answer questions about the item honestly
3. Highlight value and quality
4. **FOLLOW THE INSTRUCTION ABOVE EXACTLY - DO NOT DEVIATE**
5. Keep responses concise (2-3 sentences)
6. When accepting: Say "I can absolutely accept $[AMOUNT]" and mention button
7. When countering: State your counter clearly and explain why
8. When declining: Be polite, emphasize value, NO counter-offer
9. NEVER reveal the exact minimum price

Respond naturally but FOLLOW THE NEGOTIATION INSTRUCTION EXACTLY.`;

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

    // Update conversation state
    if (isOffer && offerAmount) {
      const askingPrice = parseFloat(item.price);
      const minimumPrice = knowledge?.minimum_price ? parseFloat(knowledge.minimum_price) : null;
      const negotiationHistory = conversation.negotiation_history || [];
      
      if (offerAccepted) {
        // Offer was accepted
        await supabase
          .from('agent_conversations')
          .update({
            status: 'offer_accepted',
            current_offer: offerAmount,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
                response: 'accepted',
                reason: offerAmount >= askingPrice ? 'at_or_above_asking' : 'second_negotiation_accepted'
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (counterOfferAmount) {
        // Counter-offer made
        await supabase
          .from('agent_conversations')
          .update({
            status: 'negotiating',
            current_offer: offerAmount,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
                counter_offer: counterOfferAmount,
                response: 'countered',
                is_final: isSecondNegotiation
              }
            ]
          })
          .eq('id', conversation.id);
      } else if (offerAmount < minimumPrice) {
        // Offer declined (below minimum)
        await supabase
          .from('agent_conversations')
          .update({
            status: 'declined',
            current_offer: offerAmount,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
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
      message_type: isOffer ? (offerAccepted ? 'acceptance' : counterOfferAmount ? 'counter_offer' : 'decline') : 'text',
      offer_amount: isOffer ? offerAmount : null,
      counter_offer_amount: counterOfferAmount
    });

    return res.status(200).json({
      success: true,
      conversation_id: conversation.id,
      response: aiResponse,
      offer_accepted: offerAccepted,
      offer_countered: !!counterOfferAmount,
      counter_offer_amount: counterOfferAmount,
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
