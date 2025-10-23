-- Rename created_date column to created_at in items table
ALTER TABLE items RENAME COLUMN created_date TO created_at;

-- Update any indexes that might reference the old column name
-- (This will be handled automatically by PostgreSQL)

-- Update the database types to reflect the change
-- Note: This migration fixes the mismatch between code and database schema
