import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEW_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    switch (method) {
      case 'GET':
        // Get all todos for a user
        const { data: todos, error: fetchError } = await supabase
          .from('baggage_todos')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching todos:', fetchError);
          return res.status(500).json({ error: 'Failed to fetch todos' });
        }

        return res.status(200).json({ todos });

      case 'POST':
        // Create a new todo
        const { title, description, priority = 'medium', due_date } = req.body;

        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const { data: newTodo, error: createError } = await supabase
          .from('baggage_todos')
          .insert({
            user_id,
            title,
            description,
            priority,
            due_date: due_date || null
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating todo:', createError);
          return res.status(500).json({ error: 'Failed to create todo' });
        }

        return res.status(201).json({ todo: newTodo });

      case 'PUT':
        // Update a todo
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Todo ID is required' });
        }

        const { data: updatedTodo, error: updateError } = await supabase
          .from('baggage_todos')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating todo:', updateError);
          return res.status(500).json({ error: 'Failed to update todo' });
        }

        return res.status(200).json({ todo: updatedTodo });

      case 'DELETE':
        // Delete a todo
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({ error: 'Todo ID is required' });
        }

        const { error: deleteError } = await supabase
          .from('baggage_todos')
          .delete()
          .eq('id', deleteId)
          .eq('user_id', user_id);

        if (deleteError) {
          console.error('Error deleting todo:', deleteError);
          return res.status(500).json({ error: 'Failed to delete todo' });
        }

        return res.status(200).json({ message: 'Todo deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
