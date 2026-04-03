-- Migration: Add userId to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Update existing categories to be accessible by all users (NULL = global)
UPDATE categories SET user_id = NULL WHERE user_id IS NULL;