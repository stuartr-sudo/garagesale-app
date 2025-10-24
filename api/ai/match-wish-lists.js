import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI-powered wish list matching system
 * Matches new items or processes all active wishes
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { itemId, processAll } = req.body;

    let itemsToMatch = [];

    if (itemId) {
      // Match specific item against all active wishes
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('status', 'available')
        .single();

      if (itemError || !item) {
        return res.status(404).json({ error: 'Item not found or unavailable' });
      }

      itemsToMatch = [item];
    } else if (processAll) {
      // Process all recently added items (last 24 hours)
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'available')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (itemsError) throw itemsError;
      itemsToMatch = items || [];
    } else {
      return res.status(400).json({ error: 'Either itemId or processAll must be provided' });
    }

    // Get all active wish list items
    const { data: activeWishes, error: wishesError } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        wishlist:wishlists(
          user_id,
          privacy_setting,
          profile:profiles(id, full_name, email)
        )
      `)
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (wishesError) throw wishesError;

    if (!activeWishes || activeWishes.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active wishes to match',
        matches_created: 0
      });
    }

    let totalMatches = 0;
    const matchResults = [];

    // Process each item
    for (const item of itemsToMatch) {
      const itemMatches = await matchItemToWishes(item, activeWishes);
      
      // Create match records in database
      for (const match of itemMatches) {
        try {
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from('wishlist_matches')
            .select('id')
            .eq('wishlist_item_id', match.wishlist_item_id)
            .eq('item_id', item.id)
            .single();

          if (existingMatch) {
            console.log(`Match already exists for wish ${match.wishlist_item_id} and item ${item.id}`);
            continue;
          }

          // Create new match
          const { data: newMatch, error: matchError } = await supabase
            .from('wishlist_matches')
            .insert({
              wishlist_item_id: match.wishlist_item_id,
              item_id: item.id,
              seller_id: item.seller_id,
              buyer_id: match.buyer_id,
              match_score: match.score,
              price_locked: item.price,
              match_details: {
                reasoning: match.reasoning,
                matched_on: match.matched_on,
                timestamp: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (matchError) {
            console.error('Error creating match:', matchError);
            continue;
          }

          totalMatches++;
          matchResults.push({
            wishlist_item_id: match.wishlist_item_id,
            item_id: item.id,
            score: match.score,
            seller_id: item.seller_id,
            buyer_id: match.buyer_id
          });

          // Send notification to seller (async, don't wait)
          notifySeller(newMatch, item, match).catch(err => 
            console.error('Error sending notification:', err)
          );

        } catch (error) {
          console.error('Error processing match:', error);
        }
      }
    }

    return res.status(200).json({
      success: true,
      items_processed: itemsToMatch.length,
      matches_created: totalMatches,
      matches: matchResults
    });

  } catch (error) {
    console.error('Error in wish list matching:', error);
    return res.status(500).json({ 
      error: 'Failed to process wish list matching',
      details: error.message 
    });
  }
}

/**
 * Match a single item against all active wishes using AI
 */
async function matchItemToWishes(item, wishes) {
  const matches = [];
  const MIN_MATCH_SCORE = 0.70; // Only create matches with 70%+ confidence

  for (const wish of wishes) {
    try {
      // Skip if buyer is the seller (can't buy your own item)
      if (wish.wishlist?.user_id === item.seller_id) {
        continue;
      }

      // Basic filters first (cheap, no API call needed)
      const passesBasicFilters = checkBasicFilters(item, wish);
      if (!passesBasicFilters) {
        continue;
      }

      // Use OpenAI to determine semantic similarity
      const matchScore = await calculateMatchScore(item, wish);

      if (matchScore >= MIN_MATCH_SCORE) {
        matches.push({
          wishlist_item_id: wish.id,
          buyer_id: wish.wishlist.user_id,
          score: matchScore,
          reasoning: await generateMatchReasoning(item, wish, matchScore),
          matched_on: determineMatchedCriteria(item, wish)
        });
      }

    } catch (error) {
      console.error(`Error matching item ${item.id} to wish ${wish.id}:`, error);
    }
  }

  return matches;
}

/**
 * Check basic filters before expensive AI call
 */
function checkBasicFilters(item, wish) {
  // Category match (if specified)
  if (wish.category && item.category && wish.category.toLowerCase() !== item.category.toLowerCase()) {
    return false;
  }

  // Price range check (if specified)
  if (wish.preferred_price_min && item.price < wish.preferred_price_min) {
    return false;
  }
  if (wish.preferred_price_max && item.price > wish.preferred_price_max) {
    return false;
  }

  // Condition check (if specified)
  if (wish.acceptable_conditions && wish.acceptable_conditions.length > 0) {
    if (!wish.acceptable_conditions.includes(item.condition)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate match score using OpenAI embeddings or GPT
 */
async function calculateMatchScore(item, wish) {
  try {
    // Use GPT-4 to analyze the match
    const prompt = `You are a marketplace matching expert. Determine if this item matches the buyer's wish.

ITEM FOR SALE:
Title: ${item.title}
Description: ${item.description || 'No description'}
Price: $${item.price}
Condition: ${item.condition}
Category: ${item.category || 'Uncategorized'}

BUYER'S WISH:
Looking for: ${wish.item_name}
Description: ${wish.description || 'No additional details'}
Price Range: ${wish.preferred_price_min ? `$${wish.preferred_price_min}` : 'Any'} - ${wish.preferred_price_max ? `$${wish.preferred_price_max}` : 'Any'}
Acceptable Conditions: ${wish.acceptable_conditions?.join(', ') || 'Any'}
Priority: ${wish.priority}

Analyze if this item matches the buyer's wish. Consider:
1. Title/name similarity
2. Description relevance
3. Price alignment
4. Condition acceptability
5. Category fit

Respond ONLY with a JSON object:
{
  "match_score": 0.85,
  "reasoning": "Brief explanation of why this is a match"
}

Match score should be 0.00 to 1.00, where:
- 0.70-0.79: Good match
- 0.80-0.89: Great match
- 0.90-1.00: Perfect match`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return Math.min(1.0, Math.max(0.0, result.match_score || 0));

  } catch (error) {
    console.error('Error calculating match score:', error);
    // Fallback: simple keyword matching
    return simpleKeywordMatch(item, wish);
  }
}

/**
 * Fallback matching if OpenAI fails
 */
function simpleKeywordMatch(item, wish) {
  const itemText = `${item.title} ${item.description}`.toLowerCase();
  const wishText = `${wish.item_name} ${wish.description}`.toLowerCase();
  
  const itemWords = new Set(itemText.split(/\s+/));
  const wishWords = wishText.split(/\s+/).filter(w => w.length > 3);
  
  const matches = wishWords.filter(word => itemText.includes(word)).length;
  const score = Math.min(1.0, matches / Math.max(wishWords.length, 1));
  
  return score;
}

/**
 * Generate human-readable reasoning for the match
 */
async function generateMatchReasoning(item, wish, score) {
  if (score >= 0.90) {
    return `Perfect match! This ${item.title} closely matches "${wish.item_name}" in all key criteria including price, condition, and description.`;
  } else if (score >= 0.80) {
    return `Great match! This ${item.title} strongly aligns with the buyer's request for "${wish.item_name}".`;
  } else {
    return `Good match! This ${item.title} could be what the buyer is looking for when they requested "${wish.item_name}".`;
  }
}

/**
 * Determine which criteria matched
 */
function determineMatchedCriteria(item, wish) {
  const criteria = [];
  
  if (wish.category && item.category === wish.category) {
    criteria.push('category');
  }
  
  if (wish.preferred_price_min && wish.preferred_price_max) {
    if (item.price >= wish.preferred_price_min && item.price <= wish.preferred_price_max) {
      criteria.push('price');
    }
  }
  
  if (wish.acceptable_conditions?.includes(item.condition)) {
    criteria.push('condition');
  }
  
  // Title similarity (simple check)
  const titleWords = item.title.toLowerCase().split(/\s+/);
  const wishWords = wish.item_name.toLowerCase().split(/\s+/);
  const commonWords = titleWords.filter(w => wishWords.includes(w) && w.length > 3);
  if (commonWords.length > 0) {
    criteria.push('title');
  }
  
  return criteria;
}

/**
 * Send notification to seller about the match
 */
async function notifySeller(match, item, matchDetails) {
  try {
    // Get buyer info
    const { data: buyer } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', matchDetails.buyer_id)
      .single();

    // Create or get conversation between buyer and seller
    const conversationResponse = await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/create-conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user1_id: item.seller_id,
        user2_id: matchDetails.buyer_id
      })
    });

    if (conversationResponse.ok) {
      const { conversation_id } = await conversationResponse.json();
      
      // Send automated message
      await fetch(`${process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/api/messages/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id,
          sender_id: matchDetails.buyer_id, // System message appearing from buyer
          content: `🎯 AI Match Alert: ${buyer?.full_name || 'A buyer'} is looking for items like your "${item.title}"!\n\nMatch confidence: ${Math.round(matchDetails.score * 100)}%\nPrice locked at: $${item.price}\n\n${matchDetails.reasoning}`
        })
      });
    }

    // TODO: Send email notification
    console.log(`Notification sent to seller ${item.seller_id} for wish match`);

  } catch (error) {
    console.error('Error sending seller notification:', error);
  }
}

