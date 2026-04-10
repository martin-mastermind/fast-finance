-- SaaS features migration: role, soft deletes, refresh tokens, subscription plans

-- Add role to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Soft delete columns
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Refresh tokens for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);

-- Subscription plans (free / pro)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('free', 'pro')),
  max_accounts INTEGER NOT NULL,
  max_transactions_per_month INTEGER NOT NULL,
  ai_chat_enabled INTEGER NOT NULL DEFAULT 0,
  price DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- User subscriptions (links user to a plan)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_end TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);

-- Seed default plans (idempotent)
-- -1 for limits means unlimited (used by pro plan)
INSERT INTO subscription_plans (name, max_accounts, max_transactions_per_month, ai_chat_enabled, price)
VALUES
  ('free', 3, 100, 0, 0),
  ('pro', -1, -1, 1, 9.99)
ON CONFLICT (name) DO NOTHING;
