-- Make yourself Super Admin
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/sql

-- Option 1: If you know your email address
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Option 2: If you know your user ID
-- Replace 'your-user-id-here' with your actual user ID
-- UPDATE profiles 
-- SET role = 'super_admin'
-- WHERE id = 'your-user-id-here';

-- Option 3: Make ALL users super admin (for testing only!)
-- Uncomment if you want to make everyone super admin
-- UPDATE profiles 
-- SET role = 'super_admin';

-- Verify the change
SELECT id, email, full_name, role, account_type 
FROM profiles 
WHERE role = 'super_admin';

