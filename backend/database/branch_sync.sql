-- Run this in Supabase SQL Editor

-- Note: The application uses the `profiles` table to manage application users, 
-- but we keep the foreign key on `auth.users(id)` or `public.profiles(id)` depending on your setup.
-- If your users table is actually `profiles`, run the commented code alternatively.

-- Option A: If your table is indeed "users"
-- Make sure users table has branch_id
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Make sure branches table has manager_id
ALTER TABLE IF EXISTS branches 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);

-- Update existing data to sync relationships
UPDATE branches b
SET manager_id = u.id
FROM users u
WHERE u.branch_id = b.id 
  AND u.role = 'branch_manager';

UPDATE users u
SET branch_id = b.id
FROM branches b
WHERE b.manager_id = u.id 
  AND u.role = 'branch_manager';

  
-- ==========================================
-- Option B: If your user table is "profiles" (which the Node backend uses)
-- Make sure profiles table has branch_id
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Make sure branches table has manager_id
ALTER TABLE IF EXISTS branches 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id_profiles ON branches(manager_id);

-- Update existing data to sync relationships
UPDATE branches b
SET manager_id = p.id
FROM profiles p
WHERE p.branch_id = b.id 
  AND p.role = 'branch_manager';

UPDATE profiles p
SET branch_id = b.id
FROM branches b
WHERE b.manager_id = p.id 
  AND p.role = 'branch_manager';
