import {
  pgTable,
  serial,
  text,
  doublePrecision,
  timestamp,
  uuid,
  integer,
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
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
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
    .references(() => categories.id)
    .notNull(),
  amount: doublePrecision('amount').notNull(),
  description: text('description'),
  date: timestamp('date').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
