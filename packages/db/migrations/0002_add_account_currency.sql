-- Migration 0002: Add currency to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'RUB' CHECK (currency IN ('RUB', 'BYN', 'USD'));
