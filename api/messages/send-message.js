/**
 * Send Message API
 * Sends a message in a conversation
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
    const { conversation_id, sender_id, content, message_type = 'text', metadata = null } = req.body;

    if (!conversation_id || !sender_id || !content) {
      return res.status(400).json({ error: 'conversation_id, sender_id, and content are required' });
    }

    // Validate sender is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', sender_id)
      .single();

    if (participantError || !participant) {
      return res.status(403).json({ error: 'User is not a participant in this conversation' });
    }

    // Validate message length (500 chars max)
    if (content.length > 500) {
      return res.status(400).json({ error: 'Message content exceeds 500 character limit' });
    }

    // Insert message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id,
        sender_id,
        content,
        message_type,
        metadata
      }])
      .select()
      .single();

    if (messageError) throw messageError;

    // The trigger will automatically:
    // - Update conversation.last_message_at
    // - Increment unread_count for other participants

    // Get sender info for response
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', sender_id)
      .single();

    if (senderError) throw senderError;

    return res.status(200).json({
      success: true,
      message: {
        ...newMessage,
        sender
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
}

