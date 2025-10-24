/**
 * AI Agent Chat Endpoint
 * Handles conversations about items with negotiation intelligence
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

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

/**
 * Calculate buyer momentum from offer history
 */
function calculateBuyerMomentum(negotiationHistory, conversationStartTime) {
  const offerProgression = negotiationHistory
    .filter(h => h.user_offer)
    .map(h => h.user_offer);
  
  if (offerProgression.length === 0) {
    return { total_offers: 0, is_increasing: false, avg_increase: 0, time_in_conversation_minutes: 0 };
  }
  
  const isIncreasing = offerProgression.length >= 2 && 
                       offerProgression[offerProgression.length - 1] > offerProgression[offerProgression.length - 2];
  
  const avgIncrease = offerProgression.length >= 2 ? 
                      (offerProgression[offerProgression.length - 1] - offerProgression[0]) / (offerProgression.length - 1) : 0;
  
  const timeInMinutes = Math.round((Date.now() - new Date(conversationStartTime).getTime()) / 60000);
  
  return {
    total_offers: offerProgression.length,
    is_increasing: isIncreasing,
    avg_increase: avgIncrease,
    time_in_conversation_minutes: timeInMinutes,
    last_offer: offerProgression[offerProgression.length - 1],
    first_offer: offerProgression[0]
  };
}

/**
 * Create or update negotiation analytics
 */
async function updateNegotiationAnalytics(supabase, conversation, item, knowledge, outcome, finalPrice = null) {
  const negotiationHistory = conversation.negotiation_history || [];
  const firstOffer = negotiationHistory.find(h => h.user_offer)?.user_offer;
  const numCounters = negotiationHistory.filter(h => h.response === 'countered').length;
  
  const timeToClose = outcome === 'accepted' ? 
    Math.round((Date.now() - new Date(conversation.created_at).getTime()) / 60000) : null;
  
  const offerProgression = negotiationHistory.filter(h => h.user_offer).map(h => h.user_offer);
  const buyerIncreasedOffer = offerProgression.length >= 2 && 
                              offerProgression[offerProgression.length - 1] > offerProgression[0];
  
  await supabase.from('negotiation_analytics').insert({
    item_id: item.id,
    conversation_id: conversation.id,
    closed_at: new Date().toISOString(),
    outcome,
    initial_offer: firstOffer,
    final_price: finalPrice,
    num_counters: numCounters,
    time_to_close_minutes: timeToClose,
    seller_minimum: knowledge?.minimum_price,
    seller_asking: item.price,
    buyer_increased_offer: buyerIncreasedOffer
  });
}

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

    // Get seller's profile to access negotiation preferences
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('negotiation_aggressiveness')
      .eq('id', item.seller_id)
      .single();

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
    const offerKeywords = [
      'offer', 'pay', 'give', 'how about', 'would you take', 
      'willing to pay', 'can i pay', 'could i pay', 'accept', 
      'buy for', 'purchase for', 'will you take',
      'i\'ll give', 'my offer is', 'what about', 'can you do',
      'would you accept', 'i can do', 'my budget is', 'tops'
    ];
    const containsOfferKeyword = offerKeywords.some(keyword => messageLower.includes(keyword));
    
    const offerMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i);
    let isOffer = false;
    let offerAmount = null;

    if (offerMatch && containsOfferKeyword) {
      // Extract the amount from either capture group
      const amount = offerMatch[1] || offerMatch[2];
      if (amount) {
      // Remove commas from the number
        offerAmount = parseFloat(amount.replace(/,/g, ''));
      isOffer = true;
      }
    }

    // ============================================
    // NEGOTIATION LOGIC - ENHANCED WITH ALL IMPROVEMENTS
    // ============================================
    let negotiationStrategy = '';
    let counterOfferAmount = null;
    let offerAccepted = false;
    let isSecondNegotiation = false;
    let isFinalNegotiation = false;
    
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
        let minimumPrice = parseFloat(knowledge.minimum_price);
        
        // Safety check: minimum can't be higher than asking
        if (minimumPrice > askingPrice) {
          console.warn(`⚠️ WARNING: Minimum ($${minimumPrice}) > Asking ($${askingPrice}). Using asking as minimum.`);
          minimumPrice = askingPrice;
        }
        
        const negotiationHistory = conversation.negotiation_history || [];
        
        // Check if previous counter-offer expired
        const lastHistory = negotiationHistory.slice(-1)[0];
        if (lastHistory?.counter_offer && lastHistory?.expires_at) {
          const expiryTime = new Date(lastHistory.expires_at);
          const now = new Date();
          
          if (now > expiryTime) {
            console.log('⏰ Previous counter expired');
            // Could add logic here to handle expired counters differently
          }
        }
        
        // Determine negotiation round and history
        const allCounters = negotiationHistory.filter(h => h.counter_offer && h.response === 'countered');
        const previousCounter = allCounters.length > 0 ? allCounters[allCounters.length - 1] : null;
        isSecondNegotiation = allCounters.length === 1;
        isFinalNegotiation = allCounters.length === 2;
        
        // Check if user is responding to our counter (within 15 minutes)
        const isResponseToCounter = previousCounter && 
                                    Math.abs(Date.now() - new Date(previousCounter.timestamp).getTime()) < 15 * 60 * 1000;
        
        // Track if user increased their offer (good faith signal)
        let userIncreasedOffer = false;
        if (isResponseToCounter && previousCounter.user_offer) {
          userIncreasedOffer = offerAmount > previousCounter.user_offer;
          if (userIncreasedOffer) {
            console.log(`📈 User increased offer from $${previousCounter.user_offer} to $${offerAmount}`);
          } else if (offerAmount < previousCounter.user_offer) {
            console.log(`📉 WARNING: User decreased offer from $${previousCounter.user_offer} to $${offerAmount}`);
          }
        }
        
        console.log('💰 NEGOTIATION STATE:', {
          offerAmount: offerAmount.toFixed(2),
          askingPrice: askingPrice.toFixed(2),
          minimumPrice: minimumPrice.toFixed(2),
          allCounters: allCounters.length,
          isSecondNegotiation,
          isFinalNegotiation,
          previousCounter: previousCounter?.counter_offer,
          userIncreasedOffer
        });
        
        // ============================================
        // ENHANCEMENT: Hard Stop After 3 Counters
        // ============================================
        if (allCounters.length >= 3) {
          // Agent has already made 3 counters - either accept or decline, NO MORE COUNTERS
          if (offerAmount >= minimumPrice) {
            offerAccepted = true;
            negotiationStrategy = `✅ FINAL ACCEPTANCE - You've made 3 counter-offers already. This offer of $${offerAmount.toFixed(2)} meets your minimum of $${minimumPrice.toFixed(2)}. Accept it now to close the deal.`;
            console.log('✅ HARD STOP: Accepting after 3 counters');
          } else {
            negotiationStrategy = `❌ FINAL DECLINE - You've made 3 counter-offers already and this offer of $${offerAmount.toFixed(2)} is still below your minimum of $${minimumPrice.toFixed(2)}. Politely decline and suggest they consider the asking price of $${askingPrice.toFixed(2)}. Mention that you've done your best to negotiate but cannot go lower.`;
            console.log('❌ HARD STOP: Declining after 3 counters');
          }
        }
        
        // ============================================
        // NEGOTIATION DECISION TREE - FIXED
        // ============================================
        else if (offerAmount >= askingPrice) {
          // CASE 1: At or above asking price - Always accept
          offerAccepted = true;
          negotiationStrategy = `✅ ACCEPT IMMEDIATELY - Offer ($${offerAmount.toFixed(2)}) is at or above asking price ($${askingPrice.toFixed(2)}). Accept enthusiastically!`;
          console.log('✅ CASE 1: At or above asking');
        }
        
        else if (offerAmount < minimumPrice) {
          // CASE 2: Below minimum - Always decline
          const gap = minimumPrice - offerAmount;
          negotiationStrategy = `❌ DECLINE - User offered $${offerAmount.toFixed(2)}, which is $${gap.toFixed(2)} below your minimum of $${minimumPrice.toFixed(2)}. Politely decline and emphasize the item's value. Encourage them to consider ${allCounters.length > 0 ? 'your last counter-offer' : 'a higher offer'}.`;
          console.log('❌ CASE 2: Below minimum - declining');
        }
        
        else {
          // CASE 3: Between minimum and asking - NEGOTIATE!
          // This is where the magic happens
          
          const marginAboveMinimum = ((offerAmount - minimumPrice) / minimumPrice) * 100;
          const marginBelowAsking = ((askingPrice - offerAmount) / askingPrice) * 100;
          
          console.log('📊 NEGOTIATION OPPORTUNITY:', {
            offer: offerAmount.toFixed(2),
            minimum: minimumPrice.toFixed(2),
            asking: askingPrice.toFixed(2),
            marginAboveMin: marginAboveMinimum.toFixed(1) + '%',
            marginBelowAsking: marginBelowAsking.toFixed(1) + '%'
          });
          
          // Get seller's negotiation aggressiveness preference
          const aggressiveness = sellerProfile?.negotiation_aggressiveness || 'balanced';
          console.log('🎯 SELLER PREFERENCE:', aggressiveness);
          
          // Define acceptance thresholds based on seller preference
          let acceptThresholdAsking, acceptThresholdMinimum;
          switch (aggressiveness) {
            case 'passive':
              acceptThresholdAsking = 15; // Accept within 15% of asking
              acceptThresholdMinimum = 5; // Accept within 5% above minimum
              break;
            case 'balanced':
              acceptThresholdAsking = 3; // Accept within 3% of asking
              acceptThresholdMinimum = 1; // Accept within 1% above minimum
              break;
            case 'aggressive':
              acceptThresholdAsking = 1; // Accept within 1% of asking
              acceptThresholdMinimum = 0.5; // Accept within 0.5% above minimum
              break;
            case 'very_aggressive':
              acceptThresholdAsking = 0.5; // Accept within 0.5% of asking
              acceptThresholdMinimum = 0.1; // Accept within 0.1% above minimum
              break;
            default:
              acceptThresholdAsking = 3;
              acceptThresholdMinimum = 1;
          }
          
          // Only accept WITHOUT negotiating based on seller preference
          if (marginBelowAsking <= acceptThresholdAsking) {
            offerAccepted = true;
            negotiationStrategy = `✅ SMART ACCEPT - Offer of $${offerAmount.toFixed(2)} is within ${acceptThresholdAsking}% of asking price ($${askingPrice.toFixed(2)}). This is excellent - accept immediately!`;
            console.log(`✅ EXCEPTIONAL: Within ${acceptThresholdAsking}% of asking - accepting`);
          } else if (marginAboveMinimum <= acceptThresholdMinimum) {
            offerAccepted = true;
            negotiationStrategy = `✅ SMART ACCEPT - Offer of $${offerAmount.toFixed(2)} is within ${acceptThresholdMinimum}% above minimum ($${minimumPrice.toFixed(2)}). Accept before they change their mind!`;
            console.log(`✅ EDGE CASE: Within ${acceptThresholdMinimum}% of minimum - accepting`);
          } else {
            // DEFAULT: Always negotiate to maximize value based on seller preference
            // Calculate strategic counter-offer
            const gapToAsking = askingPrice - offerAmount;
            
            // Counter strategy depends on seller aggressiveness and offer position
            let counterPercentage;
            if (aggressiveness === 'passive') {
              // Passive: More likely to accept, lower counters
              if (marginBelowAsking > 30) counterPercentage = 0.40;
              else if (marginBelowAsking > 15) counterPercentage = 0.30;
              else counterPercentage = 0.20;
              console.log('😊 PASSIVE COUNTER: Lower counters, more accepting');
            } else if (aggressiveness === 'balanced') {
              // Balanced: Standard negotiation
              if (marginBelowAsking > 40) counterPercentage = 0.75;
              else if (marginBelowAsking > 20) counterPercentage = 0.60;
              else counterPercentage = 0.40;
              console.log('🔄 BALANCED COUNTER: Standard negotiation');
            } else if (aggressiveness === 'aggressive') {
              // Aggressive: Higher counters, firm negotiation
              if (marginBelowAsking > 30) counterPercentage = 0.85;
              else if (marginBelowAsking > 15) counterPercentage = 0.70;
              else counterPercentage = 0.50;
              console.log('💪 AGGRESSIVE COUNTER: Higher counters, firm negotiation');
            } else if (aggressiveness === 'very_aggressive') {
              // Very aggressive: Maximum value extraction
              if (marginBelowAsking > 20) counterPercentage = 0.90;
              else if (marginBelowAsking > 10) counterPercentage = 0.80;
              else counterPercentage = 0.60;
              console.log('🔥 VERY AGGRESSIVE COUNTER: Maximum value extraction');
            }
            
            // Calculate the counter-offer
            const calculatedCounter = offerAmount + (gapToAsking * counterPercentage);
            counterOfferAmount = Math.ceil(calculatedCounter);
            
            // Safety: ensure counter is above minimum and below asking
            counterOfferAmount = Math.max(minimumPrice + 1, Math.min(counterOfferAmount, askingPrice - 1));
            
            // Safety: ensure counter is meaningfully above user's offer (at least $5 or 2% higher)
            const minimumIncrease = Math.max(5, offerAmount * 0.02);
            if (counterOfferAmount - offerAmount < minimumIncrease) {
              counterOfferAmount = Math.ceil(offerAmount + minimumIncrease);
            }
            
            // Set tone based on seller's aggressiveness preference
            let tone;
            if (aggressiveness === 'passive') {
              tone = 'Be warm and friendly. You appreciate their interest and want to work something out. Be encouraging and flexible.';
            } else if (aggressiveness === 'balanced') {
              tone = marginBelowAsking > 40 ? 
                'Be confident and emphasize the item\'s true value. This is a premium item worth much more.' :
                marginBelowAsking > 20 ?
                'Be friendly but firm. Explain why the item is worth more than their offer.' :
                'Be warm and encouraging. You\'re close to a deal - just need to meet in the middle.';
            } else if (aggressiveness === 'aggressive') {
              tone = 'Be confident and firm. Emphasize the item\'s exceptional value and quality. You know what it\'s worth and won\'t undersell.';
            } else if (aggressiveness === 'very_aggressive') {
              tone = 'Be very confident and assertive. This is a premium item with exceptional value. You\'re not desperate to sell and know its true worth.';
            } else {
              tone = 'Be friendly but firm. Explain why the item is worth more than their offer.';
            }
            
            negotiationStrategy = `🎯 COUNTER OFFER - User offered $${offerAmount.toFixed(2)} (${marginBelowAsking.toFixed(1)}% below asking of $${askingPrice.toFixed(2)}). Counter with $${counterOfferAmount.toFixed(2)} to capture more value. ${tone} Mention the 10-minute validity.`;
            
            console.log('🎯 NEGOTIATING:', {
              userOffer: offerAmount.toFixed(2),
              counterStrategy: counterPercentage.toFixed(0) + '% to asking',
              counterAmount: counterOfferAmount.toFixed(2),
              potentialGain: (counterOfferAmount - offerAmount).toFixed(2)
            });
          }
        }
        
        // ============================================
        // ENHANCEMENT: Third Counter - Split the Difference
        // ============================================
        else if (isFinalNegotiation && previousCounter) {
          const lastCounterAmount = previousCounter.counter_offer;
          const splitDifference = Math.ceil((offerAmount + lastCounterAmount) / 2);
          
          // Ensure it's still above minimum
          counterOfferAmount = Math.max(minimumPrice, splitDifference);
          
          // If split is too close to user's offer (within $5), just accept
          if (counterOfferAmount - offerAmount <= 5) {
            offerAccepted = true;
            negotiationStrategy = `✅ CLOSE ENOUGH - Your counter would be $${counterOfferAmount.toFixed(2)}, which is within $5 of their offer of $${offerAmount.toFixed(2)}. Accept it to close the deal!`;
            console.log('✅ SPLIT TOO CLOSE: Accepting instead');
          } else {
            negotiationStrategy = `🤝 FINAL SPLIT - This is your absolute last counter (3rd and final). Split the difference between their $${offerAmount.toFixed(2)} and your last offer of $${lastCounterAmount.toFixed(2)}. Counter at $${counterOfferAmount.toFixed(2)}. Use language like "This is my absolute final offer - let's make this deal happen." Emphasize this is the last opportunity and expires in 10 minutes.`;
            console.log('🤝 CASE 3 (FINAL): Split the difference', {
              userOffer: offerAmount.toFixed(2),
              lastCounter: lastCounterAmount.toFixed(2),
              split: splitDifference.toFixed(2),
              finalCounter: counterOfferAmount.toFixed(2)
            });
          }
        }
        
        // ============================================
        // ENHANCEMENT: Second Counter - Descending Strategy
        // ============================================
        else if (isSecondNegotiation && previousCounter) {
          const lastCounterAmount = previousCounter.counter_offer;
          const gapToClose = lastCounterAmount - offerAmount;
          
          // Close 40-60% of the remaining gap
          const percentageToClose = 0.40 + (Math.random() * 0.20);
          const rawCounter = offerAmount + (gapToClose * percentageToClose);
          
          counterOfferAmount = Math.ceil(rawCounter);
          
          // Safety: ensure it's above minimum and below previous counter
          counterOfferAmount = Math.max(minimumPrice, Math.min(counterOfferAmount, lastCounterAmount - 1));
          
          // If counter is now too close to user's offer (within $5), just accept
          if (counterOfferAmount - offerAmount <= 5) {
            offerAccepted = true;
            negotiationStrategy = `✅ CLOSE ENOUGH - Counter would be $${counterOfferAmount.toFixed(2)}, which is within $5 of their offer of $${offerAmount.toFixed(2)}. Accept it to secure the sale!`;
            console.log('✅ TOO CLOSE: Accepting instead of countering');
          } else {
            negotiationStrategy = `🔄 SECOND COUNTER - User offered $${offerAmount.toFixed(2)}. Your first counter was $${lastCounterAmount.toFixed(2)}. Move closer by countering at $${counterOfferAmount.toFixed(2)} (closing ${(percentageToClose * 100).toFixed(0)}% of the gap). Be encouraging and mention this is valid for 10 minutes.${userIncreasedOffer ? ' Acknowledge that they increased their offer - good sign!' : ''}`;
            
            console.log('🔄 CASE 2 (SECOND): Descending counter', {
              userOffer: offerAmount.toFixed(2),
              lastCounter: lastCounterAmount.toFixed(2),
              gap: gapToClose.toFixed(2),
              percentageClosed: (percentageToClose * 100).toFixed(0) + '%',
              rawCounter: rawCounter.toFixed(2),
              finalCounter: counterOfferAmount.toFixed(2),
              decreased: (lastCounterAmount - counterOfferAmount).toFixed(2)
            });
          }
        }
        
        // ============================================
        // First Counter - Aggressive Strategy
        // ============================================
        else {
          const gap = askingPrice - minimumPrice;
          const offerDistanceFromAsking = ((askingPrice - offerAmount) / askingPrice) * 100;
          
          let firstCounter;
          
          // If offer is very far from asking (more than 30% below), be more aggressive
          if (offerDistanceFromAsking > 30) {
            // Start closer to asking price (80-90% of the gap)
            const aggressivePercentage = 0.80 + (Math.random() * 0.10);
            firstCounter = Math.ceil(minimumPrice + (gap * aggressivePercentage));
            console.log('🎯 AGGRESSIVE: Offer is ' + offerDistanceFromAsking.toFixed(1) + '% below asking');
          } else {
            // Standard strategy (60-85% of the gap)
            const randomPercentage = 0.60 + (Math.random() * 0.25);
            firstCounter = Math.ceil(minimumPrice + (gap * randomPercentage));
            console.log('🔄 STANDARD: Offer is ' + offerDistanceFromAsking.toFixed(1) + '% below asking');
          }
          
          // Safety checks
          firstCounter = Math.max(minimumPrice, firstCounter);
          
          if (firstCounter <= offerAmount) {
            firstCounter = Math.ceil(offerAmount + Math.min(10, gap * 0.1));
          }
          
          counterOfferAmount = firstCounter;
          
          const tone = offerDistanceFromAsking > 30 ? 
            'Be confident and emphasize the item\'s true value. This is a premium item worth the asking price.' :
            'Be friendly, emphasize value, and mention the offer is valid for 10 minutes.';
          
          negotiationStrategy = `🔄 FIRST COUNTER - User offered $${offerAmount.toFixed(2)} (${offerDistanceFromAsking.toFixed(1)}% below asking). Counter with $${counterOfferAmount.toFixed(2)}. ${tone}`;
          
          console.log('🔄 CASE 1 (FIRST): Initial counter', {
            offerDistance: offerDistanceFromAsking.toFixed(1) + '%',
            gap: gap.toFixed(2),
            finalCounter: counterOfferAmount.toFixed(2)
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

    // Update conversation state and track momentum
    if (isOffer && offerAmount) {
      const askingPrice = parseFloat(item.price);
      const minimumPrice = knowledge?.minimum_price ? parseFloat(knowledge.minimum_price) : null;
      const negotiationHistory = conversation.negotiation_history || [];
      
      // Calculate buyer momentum
      const momentum = calculateBuyerMomentum(negotiationHistory, conversation.created_at);
      
      if (offerAccepted) {
        // Offer was accepted
        await supabase
          .from('agent_conversations')
          .update({
            status: 'offer_accepted',
            current_offer: offerAmount,
            buyer_momentum: momentum,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
                response: 'accepted',
                reason: offerAmount >= askingPrice ? 'at_or_above_asking' : 
                        (momentum.is_increasing ? 'smart_accept_with_momentum' : 'smart_accept')
              }
            ]
          })
          .eq('id', conversation.id);
        
        // Record analytics
        await updateNegotiationAnalytics(supabase, conversation, item, knowledge, 'accepted', offerAmount);
        
      } else if (counterOfferAmount) {
        // Counter-offer made
        const negotiationRound = (negotiationHistory.filter(h => h.counter_offer && h.response === 'countered').length) + 1;
        const isFinalOffer = negotiationRound >= 3;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        await supabase
          .from('agent_conversations')
          .update({
            status: isFinalOffer ? 'final_offer' : 'negotiating',
            current_offer: offerAmount,
            buyer_momentum: momentum,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
                counter_offer: counterOfferAmount,
                response: 'countered',
                round: negotiationRound,
                is_final: isFinalOffer,
                expires_at: expiresAt,
                user_increased: momentum.is_increasing
              }
            ]
          })
          .eq('id', conversation.id);
          
      } else if (minimumPrice && offerAmount < minimumPrice) {
        // Offer declined (below minimum)
        await supabase
          .from('agent_conversations')
          .update({
            status: 'declined',
            current_offer: offerAmount,
            buyer_momentum: momentum,
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
        
        // Record analytics
        await updateNegotiationAnalytics(supabase, conversation, item, knowledge, 'declined');
        
      } else if (!minimumPrice && offerAmount < askingPrice) {
        // No minimum set and offer below asking - decline
        await supabase
          .from('agent_conversations')
          .update({
            status: 'declined',
            current_offer: offerAmount,
            buyer_momentum: momentum,
            negotiation_history: [
              ...negotiationHistory,
              {
                timestamp: new Date().toISOString(),
                user_offer: offerAmount,
                response: 'declined',
                reason: 'no_minimum_below_asking'
              }
            ]
          })
          .eq('id', conversation.id);
        
        // Record analytics
        await updateNegotiationAnalytics(supabase, conversation, item, knowledge, 'declined');
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
      offer_amount: offerAccepted ? offerAmount : null,
      is_final_counter: isFinalNegotiation, // This is the 3rd counter
      is_second_counter: isSecondNegotiation, // This is the 2nd counter
      show_accept_button: offerAccepted || !!counterOfferAmount,
      expires_at: counterOfferAmount ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
      negotiation_round: conversation.negotiation_history?.filter(h => h.response === 'countered').length + (counterOfferAmount ? 1 : 0)
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
