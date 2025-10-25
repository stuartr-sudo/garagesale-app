# AI Negotiation Logic for Mobile App

This document provides comprehensive information about the AI negotiation system in the garage sale app, designed for mobile app implementation.

## Overview

The AI negotiation system is an intelligent agent that:
- Automatically negotiates prices with buyers
- Accepts offers at or above seller's minimum price
- Maintains conversation history and momentum tracking
- Provides 24/7 automated customer service
- Uses multiple negotiation strategies based on seller preferences

## Core Components

### 1. Database Schema

#### Tables Required:
```sql
-- Item knowledge and minimum prices
item_knowledge (
  id, item_id, minimum_price, additional_info, created_at
)

-- Conversation tracking
agent_conversations (
  id, item_id, buyer_email, status, negotiation_history, created_at
)

-- Individual messages
agent_messages (
  id, conversation_id, sender, content, created_at
)

-- Negotiation analytics
negotiation_analytics (
  id, item_id, conversation_id, outcome, initial_offer, 
  final_price, num_counters, time_to_close_minutes, 
  seller_minimum, seller_asking, buyer_increased_offer
)

-- Seller profiles with negotiation preferences
profiles (
  id, negotiation_aggressiveness, ...
)
```

### 2. API Endpoints

#### `/api/agent-chat` (POST)
**Purpose**: Main negotiation endpoint
**Input**:
```json
{
  "item_id": "uuid",
  "message": "string",
  "conversation_id": "uuid (optional)",
  "buyer_email": "string (optional)"
}
```

**Output**:
```json
{
  "success": true,
  "response": "AI response text",
  "conversation_id": "uuid",
  "negotiation_round": 1,
  "offer_accepted": false,
  "is_final_counter": false,
  "expires_at": "ISO timestamp"
}
```

## Negotiation Logic

### 1. Offer Detection

The system detects offers using:
- **Keywords**: "offer", "pay", "give", "how about", "would you take", "willing to pay", "can i pay", "could i pay", "accept", "buy for", "purchase for", "will you take", "i'll give", "my offer is", "what about", "can you do", "would you accept", "i can do", "my budget is", "tops"
- **Price Patterns**: `$123`, `$1,234.56`, `123 dollars`, `123 bucks`

### 2. Offer Acceptance Logic

#### Automatic Acceptance Conditions:
```javascript
// If offer >= minimum price
if (offerAmount >= minimumPrice) {
  offerAccepted = true;
  // Accept immediately
}

// Smart acceptance thresholds
const acceptThresholdAsking = 5; // Within 5% of asking price
const acceptThresholdMinimum = 2; // Within 2% above minimum

if (marginBelowAsking <= acceptThresholdAsking) {
  offerAccepted = true; // Accept without negotiating
}

if (marginAboveMinimum <= acceptThresholdMinimum) {
  offerAccepted = true; // Accept edge cases
}
```

### 3. Negotiation Strategies

#### Seller Aggressiveness Levels:

**1. Passive** (`negotiation_aggressiveness: 'passive'`)
- Tone: Warm and friendly, encouraging, flexible
- Counter percentages:
  - >40% below asking: 50% toward asking
  - >20% below asking: 40% toward asking
  - Otherwise: 30% toward asking

**2. Balanced** (`negotiation_aggressiveness: 'balanced'`)
- Tone: Friendly but firm, emphasizes value
- Counter percentages:
  - >40% below asking: 60% toward asking
  - >20% below asking: 45% toward asking
  - Otherwise: 35% toward asking

**3. Aggressive** (`negotiation_aggressiveness: 'aggressive'`)
- Tone: Confident and firm, emphasizes exceptional value
- Counter percentages:
  - >40% below asking: 75% toward asking
  - >20% below asking: 60% toward asking
  - Otherwise: 45% toward asking

**4. Very Aggressive** (`negotiation_aggressiveness: 'very_aggressive'`)
- Tone: Very confident, premium item positioning
- Counter percentages:
  - >40% below asking: 85% toward asking
  - >20% below asking: 75% toward asking
  - Otherwise: 60% toward asking

### 4. Counter-Offer Calculation

```javascript
// Calculate gap between offer and asking price
const gapToAsking = askingPrice - offerAmount;
const marginBelowAsking = ((askingPrice - offerAmount) / askingPrice) * 100;

// Apply aggressiveness percentage
const calculatedCounter = offerAmount + (gapToAsking * counterPercentage);
counterOfferAmount = Math.ceil(calculatedCounter);

// Safety checks
counterOfferAmount = Math.max(minimumPrice + 1, Math.min(counterOfferAmount, askingPrice - 1));

// Ensure meaningful increase
const minimumIncrease = Math.max(5, offerAmount * 0.02);
if (counterOfferAmount - offerAmount < minimumIncrease) {
  counterOfferAmount = Math.ceil(offerAmount + minimumIncrease);
}
```

### 5. Buyer Momentum Tracking

```javascript
function calculateBuyerMomentum(negotiationHistory, conversationStartTime) {
  const offerProgression = negotiationHistory
    .filter(h => h.user_offer)
    .map(h => h.user_offer);
  
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
```

## Mobile App Implementation

### 1. Chat Interface Components

#### Message Types:
- **User Messages**: Buyer input
- **AI Responses**: Agent responses with metadata
- **System Messages**: Error states, confirmations

#### Message Metadata:
```javascript
{
  sender: 'user' | 'ai' | 'system',
  content: 'string',
  timestamp: 'ISO string',
  offer_accepted: boolean,
  counter_offer: number,
  accepted_offer: number,
  is_final_counter: boolean,
  is_second_counter: boolean,
  expires_at: 'ISO string'
}
```

### 2. UI Features

#### Countdown Timer:
- Shows offer expiration time
- Updates every second
- Changes color when expired

#### Negotiation Progress:
- Visual progress bar (3 rounds max)
- Round indicators
- Final offer warnings

#### Action Buttons:
- "Accept Deal" for counter-offers
- "Confirm Purchase" for accepted offers
- Disabled states during loading

### 3. Response Processing

#### Offer Detection:
```javascript
const offerKeywords = [
  'offer', 'pay', 'give', 'how about', 'would you take', 
  'willing to pay', 'can i pay', 'could i pay', 'accept', 
  'buy for', 'purchase for', 'will you take',
  'i\'ll give', 'my offer is', 'what about', 'can you do',
  'would you accept', 'i can do', 'my budget is', 'tops'
];

const offerMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i);
```

#### Response Analysis:
```javascript
// Check for acceptance
const isAcceptingOffer = (responseLower.includes('i can absolutely accept') ||
                          responseLower.includes('i can accept') ||
                          (responseLower.includes('absolutely') && responseLower.includes('accept')) ||
                          (responseLower.includes('happy to accept')) ||
                          (responseLower.includes('great') && responseLower.includes('offer') && responseLower.includes('accept')));

// Check for counter-offer
const isCounterOffer = (responseLower.includes('counter') && responseLower.includes('at')) || 
                       responseLower.includes('how about') || 
                       responseLower.includes('would you consider') ||
                       responseLower.includes('could you do') ||
                       (responseLower.includes('meet') && responseLower.includes('at')) ||
                       responseLower.includes('i can offer') ||
                       responseLower.includes('settle at') ||
                       responseLower.includes('final offer');
```

### 4. Mobile-Specific Considerations

#### Performance:
- Debounced API calls (300ms delay)
- Thoughtful response delays (2-3 seconds)
- Efficient state management

#### UX:
- Auto-scroll to new messages
- Loading states with spinners
- Error handling with retry options
- Offline state handling

#### Security:
- Input validation
- Rate limiting
- Secure API endpoints
- Environment variable protection

## Configuration

### Environment Variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
NEW_SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
```

### Seller Setup:
```javascript
// When creating a listing
{
  "title": "Item Title",
  "price": 150,
  "minimum_price": 120,  // AI will accept offers ≥ $120
  "negotiation_aggressiveness": "balanced" // passive, balanced, aggressive, very_aggressive
}
```

## Analytics & Tracking

### Negotiation Analytics:
- Initial offer amount
- Final accepted price
- Number of counter-offers
- Time to close (minutes)
- Buyer offer progression
- Seller minimum vs asking price

### Success Metrics:
- Conversion rates by aggressiveness level
- Average negotiation rounds
- Time to close analysis
- Offer acceptance rates

## Error Handling

### Common Scenarios:
1. **API Failures**: Retry with exponential backoff
2. **Invalid Offers**: Clear error messages
3. **Network Issues**: Offline state indicators
4. **Rate Limiting**: Queue management
5. **Timeout**: Graceful degradation

### Fallback Strategies:
- Default to balanced negotiation if aggressiveness not set
- Use asking price as minimum if minimum_price not set
- Graceful error messages for failed negotiations

This system provides a complete, intelligent negotiation experience that can be seamlessly integrated into a mobile app environment.
