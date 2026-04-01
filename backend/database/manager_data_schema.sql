-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES branch_inventory(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Admins and managers can insert sales" ON sales FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'branch_manager', 'main_manager'));

-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES branch_inventory(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'In-transit', 'Completed', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view transfers" ON transfers FOR SELECT USING (true);
CREATE POLICY "Admins and managers can insert/update transfers" ON transfers FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'branch_manager', 'main_manager'));

-- Optional: Seed data function 
CREATE OR REPLACE FUNCTION seed_manager_demo_data() RETURNS VOID AS $$
DECLARE
  b1 UUID;
  b2 UUID;
  p1 UUID;
  inv1 UUID;
  user1 UUID;
BEGIN
  -- Get some existing IDs just to link data
  SELECT id INTO b1 FROM branches LIMIT 1;
  SELECT id INTO b2 FROM branches WHERE id != b1 LIMIT 1;
  SELECT id INTO p1 FROM products LIMIT 1;
  SELECT id INTO inv1 FROM branch_inventory LIMIT 1;
  SELECT id INTO user1 FROM profiles LIMIT 1;

  IF b1 IS NOT NULL AND p1 IS NOT NULL THEN
    -- Seed sales
    INSERT INTO sales (branch_id, product_id, batch_id, quantity, recorded_by)
    VALUES 
      (b1, p1, inv1, 45.00, user1),
      (COALESCE(b2, b1), p1, inv1, 12.50, user1),
      (b1, p1, inv1, 8.00, user1);
    
    -- Seed transfers
    IF b2 IS NOT NULL THEN
      INSERT INTO transfers (from_branch_id, to_branch_id, product_id, batch_id, quantity, status)
      VALUES 
        (b1, b2, p1, inv1, 30.00, 'Pending'),
        (b2, b1, p1, inv1, 20.00, 'Accepted'),
        (b1, b2, p1, inv1, 15.00, 'In-transit'),
        (b1, b2, p1, inv1, 50.00, 'Completed'),
        (b1, b2, p1, inv1, 25.00, 'Rejected');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute seed (Optional)
SELECT seed_manager_demo_data();
