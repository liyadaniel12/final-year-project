-- Add unit column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unit';

-- Optional: Seed default units based on category
UPDATE products SET unit = 'L' WHERE LOWER(category) LIKE '%milk%';
UPDATE products SET unit = 'g' WHERE LOWER(category) LIKE '%yogurt%';
UPDATE products SET unit = 'kg' WHERE LOWER(category) LIKE '%cheese%' OR LOWER(category) LIKE '%butter%';
