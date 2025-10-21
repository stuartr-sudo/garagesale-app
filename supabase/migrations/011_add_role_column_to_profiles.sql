-- Migration: Add role column to profiles table
-- Created: 2025-01-21
-- Purpose: Enable role-based access control for admin features

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create an index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment to document the column
COMMENT ON COLUMN profiles.role IS 'User role for access control. Values: user, admin, super_admin';

-- Optional: Add a check constraint to ensure only valid roles
ALTER TABLE profiles
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'admin', 'super_admin'));

