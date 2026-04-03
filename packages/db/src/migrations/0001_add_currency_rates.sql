-- Migration for currency_rates table
CREATE TABLE IF NOT EXISTS currency_rates (
  id SERIAL PRIMARY KEY,
  currency TEXT NOT NULL CHECK (currency IN ('RUB', 'BYN', 'USD')),
  rate_to_usd DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default rates if table is empty
INSERT INTO currency_rates (currency, rate_to_usd) 
SELECT 'USD', 1 WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency = 'USD');
INSERT INTO currency_rates (currency, rate_to_usd) 
SELECT 'RUB', 0.0115 WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency = 'RUB');
INSERT INTO currency_rates (currency, rate_to_usd) 
SELECT 'BYN', 0.31 WHERE NOT EXISTS (SELECT 1 FROM currency_rates WHERE currency = 'BYN');
