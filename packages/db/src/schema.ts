import {
  pgTable,
  serial,
  text,
  doublePrecision,
  timestamp,
  uuid,
  integer,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').unique().notNull(),
  username: text('username'),
  currency: text('currency').default('RUB').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  currency: text('currency', { enum: ['RUB', 'BYN', 'USD'] }).default('RUB').notNull(),
}, (t) => [
  index('accounts_user_id_idx').on(t.userId),
])

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: integer('account_id')
    .references(() => accounts.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency', { enum: ['RUB', 'BYN', 'USD'] }).notNull(),
  description: text('description'),
  date: timestamp('date').defaultNow().notNull(),
}, (t) => [
  index('transactions_user_id_idx').on(t.userId),
  index('transactions_account_id_idx').on(t.accountId),
  index('transactions_date_idx').on(t.date),
  index('transactions_user_date_idx').on(t.userId, t.date),
])

export const currencyRates = pgTable('currency_rates', {
  id: serial('id').primaryKey(),
  currency: text('currency', { enum: ['RUB', 'BYN', 'USD'] }).notNull(),
  rateToUSD: doublePrecision('rate_to_usd').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  targetAmount: doublePrecision('target_amount').notNull(),
  currentAmount: doublePrecision('current_amount').default(0).notNull(),
  targetDate: timestamp('target_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiInsights = pgTable('ai_insights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type', { enum: ['spending_alert', 'savings_tip', 'budget_warning', 'trend_analysis'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type CurrencyRate = typeof currencyRates.$inferSelect
export type NewCurrencyRate = typeof currencyRates.$inferInsert
export type SavingsGoal = typeof savingsGoals.$inferSelect
export type NewSavingsGoal = typeof savingsGoals.$inferInsert
export type AiInsight = typeof aiInsights.$inferSelect
export type NewAiInsight = typeof aiInsights.$inferInsert
export type AiChatMessage = typeof aiChatMessages.$inferSelect
export type NewAiChatMessage = typeof aiChatMessages.$inferInsert
