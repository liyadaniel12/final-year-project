-- Run this in Supabase SQL Editor to ensure the profiles table has the necessary columns

-- 1. Add full_name and status to profiles
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- NOTE: If your users table is actually named "users" instead of "profiles", uncomment and run the following instead:
-- ALTER TABLE IF EXISTS users
-- ADD COLUMN IF NOT EXISTS full_name TEXT,
-- ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
