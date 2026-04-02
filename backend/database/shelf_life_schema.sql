-- Add shelf_life_days to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER DEFAULT 14;

-- Seed meaningful defaults based on product categories
-- Milk: ~7 days
UPDATE products SET shelf_life_days = 7 WHERE LOWER(category) LIKE '%milk%';
-- Yogurt: ~21 days
UPDATE products SET shelf_life_days = 21 WHERE LOWER(category) LIKE '%yogurt%';
-- Cheese: ~60 days
UPDATE products SET shelf_life_days = 60 WHERE LOWER(category) LIKE '%cheese%';
-- Butter: ~90 days
UPDATE products SET shelf_life_days = 90 WHERE LOWER(category) LIKE '%butter%';
-- Cream: ~14 days
UPDATE products SET shelf_life_days = 14 WHERE LOWER(category) LIKE '%cream%';
