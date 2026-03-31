CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  currency TEXT NOT NULL DEFAULT 'RUB',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  amount DOUBLE PRECISION NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default categories if empty
INSERT INTO categories (name, icon, type)
SELECT * FROM (VALUES
  ('Еда', 'UtensilsCrossed', 'expense'),
  ('Транспорт', 'Car', 'expense'),
  ('Покупки', 'ShoppingBag', 'expense'),
  ('Развлечения', 'Gamepad2', 'expense'),
  ('Здоровье', 'Heart', 'expense'),
  ('Жильё', 'Home', 'expense'),
  ('Образование', 'GraduationCap', 'expense'),
  ('Прочее', 'MoreHorizontal', 'expense'),
  ('Зарплата', 'Wallet', 'income'),
  ('Фриланс', 'Laptop', 'income'),
  ('Подарок', 'Gift', 'income')
) AS v(name, icon, type)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
