-- Update customer_feedbacks table to support resolution management
ALTER TABLE customer_feedbacks
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);

-- Create index for resolution status
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_is_resolved ON customer_feedbacks(is_resolved);

-- Add comment column if not present (Prisma schema used 'comment', we use 'feedback_text')
-- We already have feedback_text, so we'll stick with that.
