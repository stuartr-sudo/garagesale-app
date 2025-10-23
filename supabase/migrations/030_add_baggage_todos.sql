-- Add to-do list feature for baggage management
-- This allows sellers to create individual checklist items

-- Create baggage_todos table
CREATE TABLE IF NOT EXISTS baggage_todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_baggage_todos_user_id ON baggage_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_baggage_todos_completed ON baggage_todos(completed);
CREATE INDEX IF NOT EXISTS idx_baggage_todos_due_date ON baggage_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_baggage_todos_priority ON baggage_todos(priority);

-- Add comments
COMMENT ON TABLE baggage_todos IS 'Individual to-do items for baggage management';
COMMENT ON COLUMN baggage_todos.title IS 'Short title for the to-do item';
COMMENT ON COLUMN baggage_todos.description IS 'Optional detailed description';
COMMENT ON COLUMN baggage_todos.completed IS 'Whether the item has been completed';
COMMENT ON COLUMN baggage_todos.completed_at IS 'Timestamp when the item was completed';
COMMENT ON COLUMN baggage_todos.priority IS 'Priority level: low, medium, high';
COMMENT ON COLUMN baggage_todos.due_date IS 'Optional due date for the to-do item';

-- Enable Row Level Security
ALTER TABLE baggage_todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own todos
CREATE POLICY "Users can view their own todos" ON baggage_todos
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own todos
CREATE POLICY "Users can insert their own todos" ON baggage_todos
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own todos
CREATE POLICY "Users can update their own todos" ON baggage_todos
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own todos
CREATE POLICY "Users can delete their own todos" ON baggage_todos
    FOR DELETE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_baggage_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_baggage_todos_updated_at
    BEFORE UPDATE ON baggage_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_baggage_todos_updated_at();

-- Create function to set completed_at when completed
CREATE OR REPLACE FUNCTION set_baggage_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If item is being marked as completed and completed_at is null, set it
    IF NEW.completed = TRUE AND OLD.completed = FALSE AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- If item is being marked as not completed, clear completed_at
    IF NEW.completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completed_at
CREATE TRIGGER set_baggage_todo_completed_at
    BEFORE UPDATE ON baggage_todos
    FOR EACH ROW
    EXECUTE FUNCTION set_baggage_todo_completed_at();
