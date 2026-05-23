-- Create customer_feedbacks table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS customer_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  batch_number TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  categories TEXT[] DEFAULT '{}',
  feedback_text TEXT,
  recommend BOOLEAN,
  buy_again TEXT CHECK (buy_again IN ('Yes', 'No', 'Maybe')),
  is_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public-facing form)
DO $$ BEGIN
  CREATE POLICY "Anyone can insert customer feedback" 
    ON customer_feedbacks FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow admins and managers to view feedback
DO $$ BEGIN
  CREATE POLICY "Admins and managers can view feedback" 
    ON customer_feedbacks FOR SELECT USING (
      get_user_role(auth.uid()) IN ('admin', 'main_manager', 'branch_manager')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_branch_id ON customer_feedbacks(branch_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_is_critical ON customer_feedbacks(is_critical);
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_created_at ON customer_feedbacks(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_customer_name ON customer_feedbacks(customer_name);
