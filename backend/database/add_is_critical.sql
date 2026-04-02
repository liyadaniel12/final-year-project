-- Run this in Supabase SQL Editor
ALTER TABLE IF EXISTS customer_feedbacks 
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Optional index if we frequently filter by critical feedback
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_is_critical ON customer_feedbacks(is_critical);
