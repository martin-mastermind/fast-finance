import { db, transactions, accounts } from '@fast-finance/db'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import type { Transaction } from '@fast-finance/db'
import { AccessDeniedError, NotFoundError } from './account.service'

export interface NewTransactionInput {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: string
}

export const TransactionService = {
  async getTransactions(userId: number, limit: number, offset: number) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId))

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset)

    return { items, total, page: Math.floor(offset / limit) + 1, pageSize: limit }
  },

  async createTransaction(userId: number, input: NewTransactionInput): Promise<Transaction> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    if (!account) throw new AccessDeniedError('Account not found or access denied')

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description || null,
        date: input.date ? new Date(input.date) : new Date(),
      })
      .returning()

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${input.amount}` })
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    return transaction
  },

  async deleteTransaction(userId: number, id: string): Promise<Transaction> {
    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()

    if (!deleted) throw new NotFoundError('Transaction not found')

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${deleted.amount}` })
      .where(eq(accounts.id, deleted.accountId))

    return deleted
  },
}
