-- 1. Add batch_number to branch_inventory if it doesn't exist
ALTER TABLE branch_inventory 
ADD COLUMN IF NOT EXISTS batch_number TEXT UNIQUE;

-- Create customer_feedbacks table
CREATE TABLE IF NOT EXISTS customer_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  batch_number TEXT REFERENCES branch_inventory(batch_number) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  categories TEXT[] DEFAULT '{}',
  feedback_text TEXT,
  recommend BOOLEAN,
  buy_again TEXT CHECK (buy_again IN ('Yes', 'No', 'Maybe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies for customer_feedbacks
CREATE POLICY "Anyone can insert customer feedback" ON customer_feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and managers can view feedback" ON customer_feedbacks FOR SELECT USING (
  get_user_role(auth.uid()) IN ('admin', 'main_manager', 'branch_manager')
);

-- Seed existing branch_inventory with batch_numbers if they don't have one
DO $$
DECLARE
  inv_record RECORD;
  new_batch_num TEXT;
  product_code TEXT;
  year_str TEXT := to_char(CURRENT_DATE, 'YYYY');
  counter INTEGER := 1;
BEGIN
  FOR inv_record IN SELECT id, product_id FROM branch_inventory WHERE batch_number IS NULL LOOP
    -- get product category or use generic code
    SELECT UPPER(SUBSTRING(category, 1, 3)) INTO product_code FROM products WHERE id = inv_record.product_id;
    IF product_code IS NULL OR length(product_code) = 0 THEN
      product_code := 'GEN';
    END IF;
    
    new_batch_num := product_code || '-' || year_str || '-' || lpad(counter::text, 3, '0');
    
    -- Verify uniqueness (in rare case of collision, append random)
    LOOP
      BEGIN
        UPDATE branch_inventory SET batch_number = new_batch_num WHERE id = inv_record.id;
        EXIT; -- Exit loop if successful
      EXCEPTION WHEN unique_violation THEN
        counter := counter + 1;
        new_batch_num := product_code || '-' || year_str || '-' || lpad(counter::text, 3, '0');
      END;
    END LOOP;
    
    counter := counter + 1;
  END LOOP;
END $$;
