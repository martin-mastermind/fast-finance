-- Make category_id nullable to support transfer transactions (which don't have a category)
ALTER TABLE transactions
ALTER COLUMN category_id DROP NOT NULL;
