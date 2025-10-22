import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AgentChat({ itemId, itemTitle, itemPrice }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [offerAccepted, setOfferAccepted] = useState(false);
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

  const sendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || loading) return;

    const userMessage = messageToSend;
    if (!customMessage) {
      setInput('');
    }
    setLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, {
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

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
        const delayMs = 2000 + Math.random() * 1000; // Random 2-3 seconds
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Set conversation ID for future messages
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }

        // Extract counter-offer from AI response
        const counterOfferMatch = data.response.match(/\$(\d+(?:\.\d{2})?)/);
        const counterOfferAmount = counterOfferMatch ? parseFloat(counterOfferMatch[1]) : null;

        // Add AI response
        setMessages(prev => [...prev, {
          sender: 'ai',
          content: data.response,
          timestamp: new Date().toISOString(),
          offer_accepted: data.offer_accepted,
          counter_offer: counterOfferAmount
        }]);

        // Handle accepted offer
        if (data.offer_accepted) {
          setOfferAccepted(true);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              sender: 'system',
              content: `🎉 Congratulations! Your offer has been accepted! The seller will contact you shortly to complete the purchase.`,
              timestamp: new Date().toISOString()
            }]);
          }, 1000);
        }
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
    <Card className="bg-slate-700/80 border-slate-600 shadow-xl">
      <CardHeader className="border-b border-slate-600 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <CardTitle className="flex items-center justify-center">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
            <Bot className="w-6 h-6 text-white" />
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
                      : 'bg-slate-600 text-gray-200 border border-slate-500'
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
                  {msg.offer_accepted && (
                    <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                      <CheckCircle className="w-4 h-4" />
                      <span>Offer Accepted!</span>
                    </div>
                  )}
                </div>
                
                {/* Show Accept Deal button if there's a counter-offer */}
                {msg.sender === 'ai' && msg.counter_offer && !offerAccepted && (
                  <Button
                    onClick={() => sendMessage(`I accept your offer of $${msg.counter_offer}`)}
                    className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg"
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Deal - ${msg.counter_offer}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-600 border border-slate-500 rounded-2xl px-4 py-2.5">
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
        <div className="border-t border-slate-600 p-4 bg-gray-950/50">
          {offerAccepted ? (
            <div className="text-center p-4 bg-green-900/20 border border-green-800 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-300 font-semibold">Your offer has been accepted!</p>
              <p className="text-gray-400 text-sm mt-1">The seller will contact you soon.</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the item or make an offer..."
                disabled={loading}
                className="flex-1 bg-slate-600 border-slate-500 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
              <Button
                onClick={sendMessage}
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

