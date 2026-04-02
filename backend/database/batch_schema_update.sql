-- Execute this directly in your Supabase SQL Editor
ALTER TABLE public.branch_inventory 
ADD COLUMN IF NOT EXISTS batch_number TEXT;
