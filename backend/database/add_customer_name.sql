-- Add customer_name column to customer_feedbacks table
ALTER TABLE IF EXISTS customer_feedbacks 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Optional index for searching by customer name
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_customer_name ON customer_feedbacks(customer_name);
