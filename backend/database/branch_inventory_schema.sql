-- Create branch_inventory table
CREATE TABLE IF NOT EXISTS branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE branch_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view inventory" ON branch_inventory FOR SELECT USING (true);
CREATE POLICY "Branch managers and admins can insert inventory" ON branch_inventory FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) IN ('admin', 'branch_manager', 'main_manager')
);
CREATE POLICY "Branch managers and admins can update inventory" ON branch_inventory FOR UPDATE USING (
  get_user_role(auth.uid()) IN ('admin', 'branch_manager', 'main_manager')
);
CREATE POLICY "Admins can delete inventory" ON branch_inventory FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- Create a helper function to seed data safely
CREATE OR REPLACE FUNCTION seed_branch_inventory_data() RETURNS VOID AS $$
DECLARE
  b_record RECORD;
  p_record RECORD;
BEGIN
  -- Loop through all branches
  FOR b_record IN SELECT id FROM branches LOOP
    -- Loop through a few products for each branch limit 5
    FOR p_record IN SELECT id FROM products LIMIT 5 LOOP
      -- Insert dummy data
      -- random stock between 10 and 200
      -- 1 record: valid expiry in 6 months
      INSERT INTO branch_inventory(branch_id, product_id, stock, expiry_date)
      VALUES (b_record.id, p_record.id, floor(random() * 200 + 10)::int, CURRENT_DATE + interval '6 months');

      -- 1 record: near expiry (within 10 days)
      INSERT INTO branch_inventory(branch_id, product_id, stock, expiry_date)
      VALUES (b_record.id, p_record.id, floor(random() * 30 + 5)::int, CURRENT_DATE + interval '10 days');

      -- 1 record: expired (past date)
      INSERT INTO branch_inventory(branch_id, product_id, stock, expiry_date)
      VALUES (b_record.id, p_record.id, floor(random() * 10 + 1)::int, CURRENT_DATE - interval '5 days');
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the seed function
SELECT seed_branch_inventory_data();

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS branch_inventory_branch_id_idx ON branch_inventory(branch_id);
CREATE INDEX IF NOT EXISTS branch_inventory_expiry_date_idx ON branch_inventory(expiry_date);
