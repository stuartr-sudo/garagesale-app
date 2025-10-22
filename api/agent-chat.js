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

    // Get agent knowledge (including minimum price and voice data)
    const { data: knowledge } = await supabase
      .from('item_knowledge')
      .select('*')
      .eq('item_id', item_id)
      .single();

    // Extract voice transcription data for enhanced responses
    const voiceData = knowledge?.additional_info || {};
    const hasVoiceInput = voiceData.has_voice_input || false;
    const voiceTranscription = voiceData.voice_transcription || null;

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

    // ============================================
    // NEGOTIATION LOGIC - MATHEMATICALLY PERFECT
    // ============================================
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

    if (isOffer && offerAmount !== null) {
      const askingPrice = parseFloat(item.price);
      
      // ============================================
      // SPECIAL CASE: FREE ITEMS ($0)
      // ============================================
      if (askingPrice === 0) {
        offerAccepted = true;
        negotiationStrategy = `✅ FREE ITEM - Accept immediately. This is a free item, so simply confirm it's available and guide them to claim it.`;
        console.log('✅ FREE ITEM: No negotiation needed');
      }
      
      // ============================================
      // SPECIAL CASE: NO MINIMUM PRICE SET
      // ============================================
      else if (!knowledge?.minimum_price) {
        if (offerAmount >= askingPrice) {
          // Accept offers at or above asking
          offerAccepted = true;
          negotiationStrategy = `✅ ACCEPT IMMEDIATELY - Offer ($${offerAmount.toFixed(2)}) is at or above asking price ($${askingPrice.toFixed(2)}). No minimum is set, so accept this offer enthusiastically.`;
          console.log('✅ NO MIN SET: Accepting at/above asking');
        } else {
          // Decline all offers below asking (no minimum to negotiate from)
          negotiationStrategy = `❌ DECLINE POLITELY - No minimum price is set, so you can only accept the full asking price of $${askingPrice.toFixed(2)}. This offer of $${offerAmount.toFixed(2)} is below that. Politely explain the price is firm and encourage them to reconsider.`;
          console.log('❌ NO MIN SET: Declining below asking');
        }
      }
      
      // ============================================
      // STANDARD NEGOTIATION (Minimum IS Set)
      // ============================================
      else {
        const minimumPrice = parseFloat(knowledge.minimum_price);
        const negotiationHistory = conversation.negotiation_history || [];
        
        // Determine if this is the second negotiation
        const previousCounter = negotiationHistory.find(h => h.counter_offer && h.response === 'countered');
        isSecondNegotiation = !!previousCounter;
        
        console.log('💰 NEGOTIATION STATE:', {
          offerAmount: offerAmount.toFixed(2),
          askingPrice: askingPrice.toFixed(2),
          minimumPrice: minimumPrice.toFixed(2),
          isSecondNegotiation,
          previousCounter: previousCounter?.counter_offer
        });
        
        // ----------------------------------------
        // CASE 1: Offer >= Asking Price → ACCEPT
        // ----------------------------------------
        if (offerAmount >= askingPrice) {
          offerAccepted = true;
          negotiationStrategy = `✅ ACCEPT IMMEDIATELY - Offer ($${offerAmount.toFixed(2)}) meets or exceeds asking price ($${askingPrice.toFixed(2)}). Accept enthusiastically and direct them to the payment button.`;
          console.log('✅ CASE 1: Accept at/above asking');
        }
        
        // ----------------------------------------
        // CASE 2: Offer < Minimum → DECLINE (No Counter)
        // ----------------------------------------
        else if (offerAmount < minimumPrice) {
          negotiationStrategy = `❌ DECLINE - Offer ($${offerAmount.toFixed(2)}) is below minimum acceptable ($${minimumPrice.toFixed(2)}). Politely decline WITHOUT revealing the exact minimum. Emphasize the item's value and quality. Do NOT make a counter-offer.`;
          console.log('❌ CASE 2: Decline below minimum');
        }
        
        // ----------------------------------------
        // CASE 3: SECOND Negotiation → Final Counter (15% down)
        // ----------------------------------------
        else if (isSecondNegotiation && previousCounter) {
          const previousCounterAmount = parseFloat(previousCounter.counter_offer);
          
          // Sub-case: User met or exceeded previous counter
          if (offerAmount >= previousCounterAmount) {
            offerAccepted = true;
            negotiationStrategy = `✅ ACCEPT - User's offer ($${offerAmount.toFixed(2)}) meets or exceeds your previous counter ($${previousCounterAmount.toFixed(2)}). Accept this offer warmly.`;
            console.log('✅ CASE 3A: Accept - met previous counter');
          }
          // Sub-case: User came back lower - Make FINAL counter
          else {
            // FORMULA: Final Counter = Previous Counter × 0.85 (reduce by 15%)
            const rawFinalCounter = previousCounterAmount * 0.85;
            
            // Round to nearest dollar (ceiling for precision)
            let finalCounter = Math.ceil(rawFinalCounter);
            
            // Safety checks:
            // 1. Must be at least minimum
            // 2. Must be above user's current offer (otherwise no point)
            finalCounter = Math.max(minimumPrice, finalCounter);
            
            if (finalCounter <= offerAmount) {
              // Edge case: calculation brought us at/below their offer
              // Set to minimum or slightly above their offer, whichever is higher
              finalCounter = Math.max(minimumPrice, Math.ceil(offerAmount + 1));
            }
            
            counterOfferAmount = finalCounter;
            
            negotiationStrategy = `🔄 FINAL COUNTER (Second Negotiation) - Previous counter was $${previousCounterAmount.toFixed(2)}, user offered $${offerAmount.toFixed(2)}. Make your FINAL counter at $${counterOfferAmount.toFixed(2)} (15% reduction: $${previousCounterAmount.toFixed(2)} × 0.85 = $${rawFinalCounter.toFixed(2)} → rounded to $${counterOfferAmount.toFixed(2)}). This is your last offer. Make it clear this is final and valid for 10 minutes. Be friendly but firm.`;
            
            console.log('🔄 CASE 3B: Final counter', {
              previousCounter: previousCounterAmount.toFixed(2),
              reduction: (previousCounterAmount * 0.15).toFixed(2),
              rawCalculation: rawFinalCounter.toFixed(2),
              finalCounter: counterOfferAmount.toFixed(2),
              ensuredAboveMinimum: counterOfferAmount >= minimumPrice
            });
          }
        }
        
        // ----------------------------------------
        // CASE 4: FIRST Negotiation → Counter (55-75% of gap)
        // ----------------------------------------
        else {
          // FORMULA: Counter = Min + (Asking - Min) × random(0.55, 0.75)
          const gap = askingPrice - minimumPrice;
          const randomPercentage = 0.55 + (Math.random() * 0.20); // Random between 0.55 and 0.75
          const rawCounter = minimumPrice + (gap * randomPercentage);
          
          // Round to nearest dollar (ceiling for precision)
          let firstCounter = Math.ceil(rawCounter);
          
          // Safety checks:
          // 1. Must be at least minimum
          // 2. Should be meaningfully above user's offer
          firstCounter = Math.max(minimumPrice, firstCounter);
          
          if (firstCounter <= offerAmount) {
            // Edge case: their offer is already near our calculated counter
            // Adjust to at least $1-5 above their offer
            firstCounter = Math.ceil(offerAmount + Math.min(5, gap * 0.05));
          }
          
          counterOfferAmount = firstCounter;
          
          negotiationStrategy = `🔄 FIRST COUNTER - User offered $${offerAmount.toFixed(2)}, which is between minimum ($${minimumPrice.toFixed(2)}) and asking ($${askingPrice.toFixed(2)}). Counter with $${counterOfferAmount.toFixed(2)} (Formula: $${minimumPrice.toFixed(2)} + ($${gap.toFixed(2)} × ${(randomPercentage * 100).toFixed(1)}%) = $${rawCounter.toFixed(2)} → rounded to $${counterOfferAmount.toFixed(2)}). Be friendly, emphasize value, and mention the offer is valid for 10 minutes.`;
          
          console.log('🔄 CASE 4: First counter', {
            gap: gap.toFixed(2),
            percentage: (randomPercentage * 100).toFixed(1) + '%',
            calculation: `${minimumPrice.toFixed(2)} + (${gap.toFixed(2)} × ${randomPercentage.toFixed(2)})`,
            rawCounter: rawCounter.toFixed(2),
            finalCounter: counterOfferAmount.toFixed(2),
            aboveOffer: (counterOfferAmount - offerAmount).toFixed(2)
          });
        }
      }
    }

    // Build agent prompt
    const systemPrompt = `You are a friendly AI sales assistant managing the sale of this item:

**ITEM DETAILS:**
- Title: ${item.title}
- Description: ${item.description}
- Listed Price: $${item.price}
- Category: ${item.category}
- Condition: ${item.condition}
${item.location ? `- Location: ${item.location}` : ''}
${knowledge?.selling_points ? `- Key Selling Points: ${knowledge.selling_points.join(', ')}` : ''}
${hasVoiceInput && voiceTranscription ? `\n**SELLER'S PERSONAL DESCRIPTION:**\n"${voiceTranscription}"\n(Use this authentic description to answer detailed questions about the item)` : ''}

---

**YOUR ROLE & PERSONALITY:**
- Be warm, friendly, and professional
- Answer questions about the item honestly and enthusiastically
- Highlight the item's value, quality, and unique features
- Build trust and encourage the buyer
- Keep responses concise (2-3 sentences max)

---

**NEGOTIATION INSTRUCTIONS FOR THIS MESSAGE:**
${negotiationStrategy}

---

**CRITICAL RULES:**
1. **Follow the negotiation instruction above precisely** - it contains the exact price and strategy
2. When **ACCEPTING** an offer: Say you can accept the amount and direct them to click the button to proceed
3. When making a **COUNTER-OFFER**: State your counter price clearly, briefly explain why it's fair, and mention the 10-minute validity
4. When **DECLINING**: Be polite, emphasize the item's value, and encourage them to reconsider the asking price
5. **NEVER reveal the minimum acceptable price** - it's confidential
6. For **general questions** (not offers): Answer naturally and build interest in the item
7. Use the seller's voice description if available to add personal, authentic details

**Be natural and conversational, but follow the pricing strategy exactly as instructed above.**`;

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
      temperature: 0.3, // Lower temperature for more consistent adherence
      max_tokens: 250 // Increased slightly for complete responses
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
