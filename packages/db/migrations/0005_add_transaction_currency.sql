-- Migration 0005: Add currency to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'RUB';
