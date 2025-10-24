import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Search, 
  ArrowLeft,
  Loader2,
  User as UserIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [otherParticipant, setOtherParticipant] = useState(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        navigate("/signin");
      }
    };
    loadUser();
  }, [navigate]);

  // Load conversations
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadConversations = async () => {
      setLoading(true);
      try {
        // Get user's conversation participations
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select(`
            *,
            conversation:conversations(*)
          `)
          .eq('user_id', currentUser.id)
          .order('last_read_at', { ascending: false });

        if (participationsError) throw participationsError;

        // Get other participants for each conversation
        const conversationsWithParticipants = await Promise.all(
          participations.map(async (participation) => {
            const { data: otherParticipants, error } = await supabase
              .from('conversation_participants')
              .select(`
                *,
                profile:profiles(id, full_name, email)
              `)
              .eq('conversation_id', participation.conversation_id)
              .neq('user_id', currentUser.id);

            if (error) throw error;

            // Get last message
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', participation.conversation_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...participation,
              otherParticipant: otherParticipants[0],
              lastMessage: lastMessage || null
            };
          })
        );

        // Sort by last message time
        conversationsWithParticipants.sort((a, b) => {
          const aTime = a.lastMessage?.created_at || a.conversation.created_at;
          const bTime = b.lastMessage?.created_at || b.conversation.created_at;
          return new Date(bTime) - new Date(aTime);
        });

        setConversations(conversationsWithParticipants);

        // If conversationId in URL, select it
        if (conversationId) {
          const conv = conversationsWithParticipants.find(
            c => c.conversation_id === conversationId
          );
          if (conv) {
            handleSelectConversation(conv);
          }
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser?.id, conversationId, toast]);

  // Load messages for selected conversation
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setOtherParticipant(conversation.otherParticipant);

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name)
        `)
        .eq('conversation_id', conversation.conversation_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('conversation_participants')
        .update({ 
          unread_count: 0,
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversation.conversation_id)
        .eq('user_id', currentUser.id);

      // Update local conversation list
      setConversations(prev => prev.map(c => 
        c.conversation_id === conversation.conversation_id 
          ? { ...c, unread_count: 0 }
          : c
      ));

    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.conversation_id,
          sender_id: currentUser.id,
          content: newMessage.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
        
        // Scroll to bottom
        setTimeout(() => {
          const messageContainer = document.getElementById('message-container');
          if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }
        }, 100);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedConversation?.conversation_id) return;

    const channel = supabase
      .channel(`conversation:${selectedConversation.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.conversation_id}`
        },
        async (payload) => {
          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', payload.new.sender_id)
            .single();

          setMessages(prev => [...prev, { ...payload.new, sender }]);

          // Scroll to bottom
          setTimeout(() => {
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
              messageContainer.scrollTop = messageContainer.scrollHeight;
            }
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.conversation_id]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUser = conv.otherParticipant?.profile?.full_name || "";
    return otherUser.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-pink-500" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <Card className="bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start chatting with sellers or buyers!</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-white truncate">
                            {conv.otherParticipant?.profile?.full_name || "User"}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-pink-500 text-white">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Message View */}
          <Card className="md:col-span-2 bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{otherParticipant?.profile?.full_name || "User"}</p>
                    <p className="text-xs text-gray-400">{otherParticipant?.profile?.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div id="message-container" className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUser.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                                : 'bg-gray-800 text-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      maxLength={500}
                      className="flex-1 bg-gray-800 border-gray-700 text-white"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {newMessage.length}/500 characters
                  </p>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

