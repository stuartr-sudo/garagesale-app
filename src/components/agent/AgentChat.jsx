import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2, CheckCircle, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Countdown Timer Component
function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry - now;
      
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsExpired(true);
        return true; // Signal to stop
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setIsExpired(false);
        return false;
      }
    };
    
    // Initial update
    const expired = updateTimer();
    if (expired) return;
    
    // Update every second
    const interval = setInterval(() => {
      const expired = updateTimer();
      if (expired) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return (
    <div className={`mt-2 text-xs flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
      <Clock className="w-3 h-3" />
      <span>{isExpired ? 'Offer expired' : `Offer expires in: ${timeLeft}`}</span>
    </div>
  );
}

export default function AgentChat({ itemId, itemTitle, itemPrice, onAcceptOffer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [negotiationRound, setNegotiationRound] = useState(0); // NEW
  const [theme, setTheme] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    // Only scroll within the chat container, not the whole page
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest', // Prevents page scroll
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll if there are messages (not on initial load)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      sender: 'ai',
      content: `Hi! I'm the AI assistant for "${itemTitle}". I can answer any questions you have about this item, including pricing. Feel free to make an offer!`,
      timestamp: new Date().toISOString()
    }]);
  }, [itemTitle]);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('marketplace-theme');
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Error parsing theme:', error);
      }
    }
  }, []);

  const sendMessage = async (customMessage = null) => {
    // Handle case where event object is passed instead of string
    const isCustomMessage = customMessage && typeof customMessage === 'string';
    const messageToSend = isCustomMessage ? customMessage : input.trim();
    if (!messageToSend || loading) return;

    const userMessage = String(messageToSend);
    
    // Always clear input after sending
    setInput('');
    setLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, {
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    // Check if user is accepting an offer - handle this case specially
    if (userMessage.toLowerCase().includes('i accept your offer') || 
        userMessage.toLowerCase().includes('i accept the offer')) {
      // Extract the amount from the message
      const amountMatch = userMessage.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const acceptedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
      
      if (acceptedAmount) {
        // Add simple agent response without API call
        setMessages(prev => [...prev, {
          sender: 'ai',
          content: "That's great. Please confirm you'd like to proceed?",
          timestamp: new Date().toISOString(),
          accepted_offer: acceptedAmount
        }]);
        setLoading(false);
        return;
      }
    }

    try {
      // Fetch the response
      const response = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          message: userMessage,
          conversation_id: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to send message');
      }

      const data = await response.json();

      if (data.success) {
        // Add a thoughtful delay (2-3 seconds) before showing the response
        const delayMs = 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Set conversation ID and negotiation round
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        if (data.negotiation_round !== undefined) {
          setNegotiationRound(data.negotiation_round);
        }

        // Extract counter-offer or accepted offer amount
        const responseLower = data.response.toLowerCase();
        const allPriceMatches = [...data.response.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
        
        let counterOfferAmount = null;
        let acceptedOfferAmount = null;
        
        // Check for rejection/decline phrases
        const isRejection = responseLower.includes("can't accept") ||
                           responseLower.includes("cannot accept") ||
                           responseLower.includes("can not accept") ||
                           responseLower.includes("unable to accept") ||
                           responseLower.includes("too low") ||
                           responseLower.includes("below") ||
                           responseLower.includes("minimum") ||
                           (responseLower.includes('however') && responseLower.includes('can')) ||
                           (responseLower.includes('while') && responseLower.includes('appreciate'));
        
        // If offer was accepted by API
        if (data.offer_accepted && allPriceMatches.length > 0) {
          acceptedOfferAmount = parseFloat(allPriceMatches[0][1].replace(/,/g, ''));
        } else if (!isRejection && allPriceMatches.length > 0) {
          // Check if AI is accepting
          const isAcceptingOffer = (responseLower.includes('i can absolutely accept') ||
                                    responseLower.includes('i can accept') ||
                                    (responseLower.includes('absolutely') && responseLower.includes('accept')) ||
                                    (responseLower.includes('happy to accept')) ||
                                    (responseLower.includes('great') && responseLower.includes('offer') && responseLower.includes('accept')));
          
          if (isAcceptingOffer) {
            acceptedOfferAmount = parseFloat(allPriceMatches[0][1].replace(/,/g, ''));
          } else {
            // Check for counter-offer
            const isCounterOffer = (responseLower.includes('counter') && responseLower.includes('at')) || 
                                   responseLower.includes('how about') || 
                                   responseLower.includes('would you consider') ||
                                   responseLower.includes('could you do') ||
                                   (responseLower.includes('meet') && responseLower.includes('at')) ||
                                   responseLower.includes('i can offer') ||
                                   responseLower.includes('settle at') ||
                                   responseLower.includes('final offer');
            
            if (isCounterOffer) {
              const lastPriceMatch = allPriceMatches[allPriceMatches.length - 1];
              counterOfferAmount = parseFloat(lastPriceMatch[1].replace(/,/g, ''));
            }
          }
        }

        // Add AI response with metadata
        setMessages(prev => [...prev, {
          sender: 'ai',
          content: data.response,
          timestamp: new Date().toISOString(),
          offer_accepted: data.offer_accepted,
          counter_offer: counterOfferAmount,
          accepted_offer: acceptedOfferAmount,
          is_final_counter: data.is_final_counter,
          is_second_counter: data.is_second_counter,
          expires_at: data.expires_at
        }]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        sender: 'system',
        content: 'Sorry, there was an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card 
      className="border-4 border-white shadow-2xl ring-4 ring-white/30"
      style={{
        background: `linear-gradient(to bottom right, ${theme?.agentBackgroundFrom || '#581c87'}, ${theme?.agentBackgroundTo || '#be185d'})`,
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)'
      }}
    >
      <CardHeader 
        className="border-b border-white/30"
        style={{
          background: `linear-gradient(to right, ${theme?.agentHeaderFrom || '#7c3aed'}, ${theme?.agentHeaderTo || '#ec4899'})`
        }}
      >
        <CardTitle className="flex items-center justify-center">
          <div 
            className="p-4 rounded-2xl shadow-xl ring-2 ring-white/30"
            style={{
              background: `linear-gradient(to right, ${theme?.agentIconFrom || '#a855f7'}, ${theme?.agentIconTo || '#ec4899'})`
            }}
          >
            <Bot className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="ml-3">
            <div className="text-white font-bold text-lg">AI Assistant</div>
            <div className="text-white/80 text-sm">Ask me anything!</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.sender === 'user' ? '' : 'w-full'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white'
                      : msg.sender === 'system'
                      ? 'bg-green-900/30 border border-green-800 text-green-300'
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-1 text-purple-400 text-xs">
                      <Bot className="w-3 h-3" />
                      <span>AI Assistant</span>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  
                  {/* Success indicator */}
                  {msg.offer_accepted && (
                    <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      <span>Offer Accepted!</span>
                    </div>
                  )}
                  
                  {/* Countdown timer for counter-offers */}
                  {msg.counter_offer && msg.expires_at && (
                    <CountdownTimer expiresAt={msg.expires_at} />
                  )}
                  
                  {/* Final counter warning */}
                  {msg.counter_offer && msg.is_final_counter && (
                    <div className="flex items-center gap-1 mt-2 text-orange-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>⚠️ FINAL OFFER - Last chance to negotiate!</span>
                    </div>
                  )}
                  
                  {/* Second counter indicator */}
                  {msg.counter_offer && msg.is_second_counter && (
                    <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs">
                      <TrendingUp className="w-4 h-4" />
                      <span>Moving closer to a deal...</span>
                    </div>
                  )}
                  
                  {/* Negotiation progress bar */}
                  {msg.counter_offer && negotiationRound > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i <= negotiationRound ? 'bg-yellow-400' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Show Accept Deal button if there's a counter-offer */}
                {msg.sender === 'ai' && msg.counter_offer && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const offerAmount = msg.counter_offer;
                      sendMessage(`I accept your offer of $${offerAmount}`);
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg"
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Deal - ${msg.counter_offer}
                  </Button>
                )}
                
                {/* Show Buy Now button if there's an accepted offer */}
                {msg.sender === 'ai' && msg.accepted_offer && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const acceptedAmount = msg.accepted_offer;
                      setOfferAccepted(true);
                      // Call the parent component to open purchase modal with negotiated price
                      if (onAcceptOffer) {
                        onAcceptOffer(acceptedAmount);
                      }
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg animate-pulse"
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Purchase - ${msg.accepted_offer}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-gray-400 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 bg-gray-950/50">
          {!offerAccepted && (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the item or make an offer..."
                disabled={loading}
                className="flex-1 bg-white/10 border-2 border-purple-400/50 text-white placeholder-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 rounded-xl h-12 text-lg"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

