-- Make yourself Super Admin
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/biwuxtvgvkkltrdpuptl/sql

-- NOTE: This has already been done for stuartr@doubleclick.work!
-- The role column has been added to the profiles table.

-- Option 1: Make a specific user super admin by email
-- Replace 'their-email@example.com' with the user's actual email
UPDATE profiles 
SET role = 'super_admin'
WHERE email = 'their-email@example.com';

-- Option 2: Make a specific user super admin by user ID
-- Replace 'user-id-here' with the actual user ID
-- UPDATE profiles 
-- SET role = 'super_admin'
-- WHERE id = 'user-id-here';

-- Option 3: Make a user admin (not super_admin)
-- UPDATE profiles 
-- SET role = 'admin'
-- WHERE email = 'their-email@example.com';

-- Option 4: Remove admin access (set back to regular user)
-- UPDATE profiles 
-- SET role = 'user'
-- WHERE email = 'their-email@example.com';

-- Verify the changes
SELECT id, email, full_name, role, account_type 
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY role, email;

