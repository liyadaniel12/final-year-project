-- Run this script in your Supabase SQL Editor to update your tables!

-- 1. Add full_name and status to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Add status to branches
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 3. Update the handle_new_user trigger to populate default active status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, status)
  VALUES (NEW.id, 'user', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: to get the exact data from your mockup out of the box, you can run these seed queries:
-- (Only run if you are okay erasing existing dummy branches/users first!)
/*
UPDATE profiles SET full_name = 'Ahmed Al-Hassan', role = 'admin', status = 'active' WHERE email LIKE '%admin%';
*/
