# AI Agent System Documentation

## Overview

The GarageSale marketplace now includes an intelligent AI agent that can:
- Answer questions about listed items
- Negotiate prices with buyers
- Automatically accept offers at or above the seller's minimum price
- Maintain conversation history
- Provide 24/7 customer service

---

## Architecture

### Components

1. **Database Tables** (Supabase)
   - `item_knowledge` - Stores agent knowledge and minimum prices
   - `agent_conversations` - Tracks buyer-seller conversations
   - `agent_messages` - Stores individual chat messages

2. **API Endpoints** (Vercel Serverless Functions)
   - `/api/create-listing` - Creates items with optional agent configuration
   - `/api/agent-chat` - Handles chat conversations and negotiations

3. **UI Components** (React)
   - `AgentChat.jsx` - Chat interface component
   - `ItemDetail.jsx` - Item detail page with integrated agent

---

## How It Works

### For Sellers (via Webhook)

When creating a listing via the webhook, include `minimum_price`:

```json
{
  "title": "Vintage Chair",
  "description": "Beautiful vintage chair",
  "price": 150,
  "minimum_price": 120,  // ← AI agent will accept offers ≥ $120
  "images": [...]
}
```

The AI agent will:
- ✅ Answer questions about the item
- ✅ Negotiate with buyers
- ✅ Automatically accept offers ≥ $120
- ✅ Politely decline offers < $120
- ✅ Notify the seller when an offer is accepted

---

### For Buyers (UI)

1. **Browse Marketplace** → Click on any item
2. **Item Detail Page** → See AI agent chat interface
3. **Ask Questions** → Get instant responses
4. **Make Offers** → AI negotiates intelligently

---

## Agent Intelligence

### Conversation Capabilities

The AI agent can:
- Answer product questions
- Highlight key features
- Provide condition details
- Discuss location/shipping
- Handle price negotiations

### Negotiation Logic

```javascript
if (offer >= minimum_price) {
  // ✅ Accept immediately
  return "Great! Your offer is accepted!";
} else {
  // ❌ Politely decline and counter
  return "Thanks for your interest! The listed price is $X...";
}
```

### Smart Features

- **Context Aware**: Knows full item details
- **Never Reveals**: Doesn't expose minimum price
- **Natural Language**: Converses like a real person
- **Auto-Acceptance**: Accepts good offers instantly
- **Seller Notification**: Alerts seller of accepted offers

---

## Database Schema

### `item_knowledge`
```sql
CREATE TABLE item_knowledge (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  minimum_price DECIMAL(10,2),
  selling_points TEXT[],
  additional_info JSONB,
  faqs JSONB,
  negotiation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(item_id)
);
```

### `agent_conversations`
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  buyer_id UUID REFERENCES profiles(id),
  buyer_email TEXT,
  status TEXT DEFAULT 'active',
  current_offer DECIMAL(10,2),
  negotiation_history JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `agent_messages`
```sql
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES agent_conversations(id),
  sender TEXT, -- 'ai' or 'user'
  content TEXT,
  message_type TEXT, -- 'text', 'offer', 'counter_offer', 'acceptance'
  offer_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ
);
```

---

## API Reference

### POST `/api/agent-chat`

Send a message to the AI agent.

**Request:**
```json
{
  "item_id": "uuid-of-item",
  "message": "Is this still available? Would you take $100?",
  "conversation_id": "uuid-if-continuing-conversation",
  "buyer_email": "buyer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "response": "Yes, it's available! Your offer of $100 is accepted!",
  "offer_accepted": true,
  "offer_amount": 100
}
```

---

## Example Conversations

### Example 1: Question About Item

**Buyer:** "What condition is this in?"

**AI Agent:** "This vintage leather chair is in like-new condition! It's been well-maintained with minimal signs of wear. The leather is still supple and there are no tears or scratches. Would you like to know anything else about it?"

### Example 2: Successful Negotiation

**Buyer:** "Would you take $120 for this?"

**AI Agent:** "Great offer! I'm happy to accept $120. The seller will be notified and will contact you shortly to complete the purchase. Thanks for your interest!"

### Example 3: Offer Below Minimum

**Buyer:** "How about $80?"

**AI Agent:** "Thanks for your interest! The listed price is $150, which reflects the excellent condition and quality of this chair. Given its vintage nature and pristine condition, I'd recommend considering something closer to the asking price. Would you like to make another offer?"

---

## Configuration

### Environment Variables

Add to Vercel:

```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
VITE_OPENAI_API_KEY=your-openai-key
```

### OpenAI Model

Currently using: `gpt-4o-mini` (cost-effective and fast)

Can upgrade to `gpt-4o` for more sophisticated negotiations.

---

## Monitoring & Analytics

### Track Conversations

```javascript
// Get all conversations for an item
const { data } = await supabase
  .from('agent_conversations')
  .select('*')
  .eq('item_id', itemId);
```

### View Messages

```javascript
// Get conversation history
const { data } = await supabase
  .from('agent_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### Check Accepted Offers

```javascript
// Find accepted offers
const { data } = await supabase
  .from('agent_conversations')
  .select('*')
  .eq('status', 'offer_accepted');
```

---

## Best Practices

### For Sellers

1. **Set Realistic Minimum Prices**
   - Allow 10-20% negotiation room
   - Consider market conditions
   - Factor in time value

2. **Provide Good Descriptions**
   - AI uses description to answer questions
   - More detail = better conversations

3. **Add Selling Points**
   - Highlight unique features
   - Mention condition thoroughly
   - Include any extras/accessories

### For Developers

1. **Rate Limiting**
   - Implement per-user rate limits
   - Monitor API costs (OpenAI)
   - Cache common responses

2. **Error Handling**
   - Handle OpenAI timeouts gracefully
   - Fallback responses for errors
   - Log all conversations

3. **Security**
   - Never expose minimum_price in frontend
   - Use RLS policies properly
   - Validate all inputs

---

## Future Enhancements

### Planned Features

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Image recognition (ask about specific parts)
- [ ] Comparison with similar items
- [ ] Seller personality customization
- [ ] Automated counter-offers (e.g., "best I can do is $X")
- [ ] Integration with payment processing
- [ ] SMS notifications for sellers
- [ ] Analytics dashboard

### Advanced Negotiation

- Dynamic pricing based on time listed
- Market trend analysis
- Competitor price checking
- Bundle deal suggestions

---

## Troubleshooting

### Agent Not Appearing

**Problem:** Chat interface not showing on item detail page

**Solutions:**
1. Check `item_knowledge` table for entry
2. Verify `negotiation_enabled` is true
3. Ensure `minimum_price` was set when creating listing

### Agent Not Accepting Valid Offers

**Problem:** Offers above minimum are rejected

**Solutions:**
1. Check OpenAI API key is valid
2. Review conversation logs in `agent_messages`
3. Verify minimum_price in `item_knowledge`

### Messages Not Sending

**Problem:** Chat messages fail to send

**Solutions:**
1. Check `/api/agent-chat` endpoint logs
2. Verify Supabase connection
3. Check browser console for errors

---

## Support

For issues or questions:
- Check Vercel logs: https://vercel.com/doubleclicks/garage-sale-40afc1f5/logs
- Review Supabase logs: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/logs
- Monitor OpenAI usage: https://platform.openai.com/usage

---

## Cost Estimation

### OpenAI API Costs

Using `gpt-4o-mini`:
- ~$0.00015 per message (150 tokens avg)
- 1000 conversations ≈ $0.15
- Very affordable for small-medium volume

### Scaling Considerations

- Cache common questions/answers
- Use response streaming for better UX
- Implement message batching
- Monitor and set usage limits

---

## Changelog

### v1.0.0 (2025-10-21)
- Initial AI agent implementation
- Chat interface on item detail pages
- Automatic offer acceptance
- Negotiation intelligence
- Conversation history
- Database schema and RLS policies

