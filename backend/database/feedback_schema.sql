-- Feedback Table Schema
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Normally we'd want RLS on this table, but since we are inserting 
-- exclusively via the trusted backend using the Service Role Key, RLS is perfectly fine left default (secure).
-- We'll explicitly leave it secure.
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
