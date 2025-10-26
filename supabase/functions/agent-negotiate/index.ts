import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      itemId, 
      userMessage, 
      conversationId, 
      buyerId 
    } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found')
    }

    // ============================================
    // FETCH ITEM AND SELLER DATA
    // ============================================
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select(`
        id,
        title,
        price,
        condition,
        description,
        minimum_price,
        seller_id,
        status
      `)
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      throw new Error('Item not found')
    }

    if (item.status !== 'active') {
      throw new Error('Item is no longer available for negotiation')
    }

    // Get seller profile and negotiation settings
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .select(`
        id,
        negotiation_aggressiveness,
        ai_agent_settings,
        full_name
      `)
      .eq('id', item.seller_id)
      .single()

    if (sellerError || !sellerProfile) {
      throw new Error('Seller profile not found')
    }

    // ============================================
    // GET OR CREATE CONVERSATION
    // ============================================
    let conversation
    if (conversationId) {
      const { data: existingConv, error: convError } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      
      if (convError) {
        throw new Error('Conversation not found')
      }
      conversation = existingConv
    } else {
      // Create new conversation
      const { data: newConv, error: newConvError } = await supabase
        .from('agent_conversations')
        .insert({
          item_id: itemId,
          buyer_id: buyerId,
          status: 'active'
        })
        .select()
        .single()
      
      if (newConvError) {
        throw new Error('Failed to create conversation')
      }
      conversation = newConv
    }

    // ============================================
    // GET CONVERSATION HISTORY
    // ============================================
    const { data: messages, error: messagesError } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      throw new Error('Failed to fetch conversation history')
    }

    // ============================================
    // PARSE USER MESSAGE FOR OFFER AMOUNT
    // ============================================
    const offerRegex = /\$?(\d+(?:\.\d{2})?)/g
    const offerMatches = userMessage.match(offerRegex)
    let offerAmount = null
    let isOffer = false

    if (offerMatches) {
      const amount = offerMatches[0].replace('$', '')
      offerAmount = parseFloat(amount)
      isOffer = true
    }

    // ============================================
    // AI NEGOTIATION LOGIC
    // ============================================
    let negotiationResponse = ''
    let counterOfferAmount = null
    let offerAccepted = false
    let expiresAt = null

    if (isOffer && offerAmount !== null) {
      const askingPrice = parseFloat(item.price)
      const minimumPrice = parseFloat(item.minimum_price) || (askingPrice * 0.7) // Default 70% of asking
      const aggressiveness = sellerProfile.negotiation_aggressiveness || 'balanced'

      // Count previous counter-offers
      const previousCounters = messages.filter(m => 
        m.sender === 'ai' && m.counter_offer_amount !== null
      ).length

      console.log('🤖 NEGOTIATION DEBUG:', {
        offerAmount,
        askingPrice,
        minimumPrice,
        aggressiveness,
        previousCounters
      })

      // ============================================
      // NEGOTIATION DECISION TREE
      // ============================================
      if (offerAmount >= askingPrice) {
        // Accept offers at or above asking price
        offerAccepted = true
        negotiationResponse = `✅ Perfect! I accept your offer of $${offerAmount.toFixed(2)} for the ${item.title}. This is exactly what I was asking for. Let's proceed with the purchase!`
        console.log('✅ ACCEPT: At or above asking price')
      } else if (offerAmount < minimumPrice) {
        // Decline offers below minimum
        const gap = minimumPrice - offerAmount
        negotiationResponse = `I appreciate your offer of $${offerAmount.toFixed(2)}, but I can't go below $${minimumPrice.toFixed(2)} for this ${item.title}. The item is in ${item.condition} condition and worth every penny. Would you consider $${minimumPrice.toFixed(2)}?`
        console.log('❌ DECLINE: Below minimum price')
      } else if (previousCounters >= 3) {
        // Maximum 3 counter-offers reached
        if (offerAmount >= minimumPrice) {
          offerAccepted = true
          negotiationResponse = `✅ I've made my best offers already. Your offer of $${offerAmount.toFixed(2)} meets my minimum, so I accept it. Let's close this deal!`
        } else {
          negotiationResponse = `I've made 3 counter-offers already and can't go lower than $${minimumPrice.toFixed(2)}. I understand if this doesn't work for you.`
        }
        console.log('🛑 FINAL: Max counters reached')
      } else {
        // NEGOTIATE based on aggressiveness
        const gapToAsking = askingPrice - offerAmount
        const percentageGap = (gapToAsking / askingPrice) * 100

        // Determine counter strategy based on aggressiveness
        let counterPercentage = 0.5 // Default 50% toward asking price

        switch (aggressiveness) {
          case 'passive':
            counterPercentage = 0.3 // 30% toward asking
            break
          case 'balanced':
            counterPercentage = 0.5 // 50% toward asking
            break
          case 'aggressive':
            counterPercentage = 0.7 // 70% toward asking
            break
          case 'very_aggressive':
            counterPercentage = 0.8 // 80% toward asking
            break
        }

        // Calculate counter-offer
        counterOfferAmount = Math.round((offerAmount + (askingPrice - offerAmount) * counterPercentage) * 100) / 100

        // Ensure counter doesn't exceed asking price
        if (counterOfferAmount >= askingPrice) {
          counterOfferAmount = askingPrice - 0.01
        }

        // Set expiration (10 minutes from now)
        expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

        // Generate negotiation response
        const counterText = `I appreciate your offer of $${offerAmount.toFixed(2)}! How about we meet in the middle at $${counterOfferAmount.toFixed(2)}? This way, you still get a fantastic ${item.title} that's in ${item.condition} condition, and it's a fair compromise for both of us! This offer is valid for the next 10 minutes. What do you think?`

        negotiationResponse = counterText
        console.log('🔄 COUNTER: Negotiating with counter-offer')
      }
    } else {
      // General conversation (not an offer)
      negotiationResponse = `Thanks for your message! I'm here to help you with any questions about this ${item.title}. If you'd like to make an offer, just mention a price like "$50" and I'll be happy to negotiate!`
    }

    // ============================================
    // SAVE MESSAGES TO DATABASE
    // ============================================
    // Save user message
    const { error: userMsgError } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'user',
        content: userMessage,
        offer_amount: offerAmount,
        message_type: isOffer ? 'offer' : 'text'
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'ai',
        content: negotiationResponse,
        counter_offer_amount: counterOfferAmount,
        message_type: 'response'
      })

    if (aiMsgError) {
      console.error('Error saving AI message:', aiMsgError)
    }

    // Update conversation with current offer
    const { error: convUpdateError } = await supabase
      .from('agent_conversations')
      .update({
        current_offer: offerAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    if (convUpdateError) {
      console.error('Error updating conversation:', convUpdateError)
    }

    // ============================================
    // RETURN RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        conversationId: conversation.id,
        response: negotiationResponse,
        counterOfferAmount,
        offerAccepted,
        expiresAt,
        isOffer
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Agent negotiation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
