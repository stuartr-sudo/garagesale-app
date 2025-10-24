/**
 * Create Conversation API
 * Creates a new conversation between users or returns existing one
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, other_user_id } = req.body;

    if (!user_id || !other_user_id) {
      return res.status(400).json({ error: 'user_id and other_user_id are required' });
    }

    if (user_id === other_user_id) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists between these users
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user_id);

    if (searchError) throw searchError;

    // Check if any of these conversations also include the other user
    if (existingConversations && existingConversations.length > 0) {
      const conversationIds = existingConversations.map(c => c.conversation_id);
      
      const { data: otherUserParticipants, error: otherError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', other_user_id)
        .in('conversation_id', conversationIds);

      if (otherError) throw otherError;

      if (otherUserParticipants && otherUserParticipants.length > 0) {
        // Conversation already exists
        const existingConversationId = otherUserParticipants[0].conversation_id;
        
        // Get full conversation details
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', existingConversationId)
          .single();

        if (convError) throw convError;

        return res.status(200).json({
          success: true,
          conversation_id: existingConversationId,
          existing: true,
          conversation
        });
      }
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([{}])
      .select()
      .single();

    if (createError) throw createError;

    // Add both participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: user_id },
        { conversation_id: newConversation.id, user_id: other_user_id }
      ]);

    if (participantsError) throw participantsError;

    return res.status(200).json({
      success: true,
      conversation_id: newConversation.id,
      existing: false,
      conversation: newConversation
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({
      error: 'Failed to create conversation',
      details: error.message
    });
  }
}

