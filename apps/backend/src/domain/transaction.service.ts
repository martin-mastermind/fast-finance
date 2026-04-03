import { db, transactions, accounts, categories } from '@fast-finance/db'
import { eq, and, desc, count, sql, gte, lt, between } from 'drizzle-orm'
import type { Transaction } from '@fast-finance/db'
import { AccessDeniedError, NotFoundError } from './account.service'

export interface NewTransactionInput {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: string
  currency: string
}

export interface TransferInput {
  fromAccountId: number
  toAccountId: number
  amount: number
  description?: string
  currency: string
}

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  let start: Date

  switch (period) {
    case 'week':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return { start, end }
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

  async getTransactionStats(userId: number, period: string) {
    const { start, end } = getDateRange(period)

    const expenseData = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        sql`${transactions.amount} < 0`,
        gte(transactions.date, start),
        lt(transactions.date, end)
      ))
      .groupBy(transactions.categoryId)

    const incomeData = await db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        sql`${transactions.amount} > 0`,
        gte(transactions.date, start),
        lt(transactions.date, end)
      ))
      .groupBy(transactions.categoryId)

    const categoryMap = new Map<number, { name: string; icon: string }>()
    const allCategoryIds = [...expenseData.map(d => d.categoryId), ...incomeData.map(d => d.categoryId)]
    if (allCategoryIds.length > 0) {
      const cats = await db
        .select({ id: categories.id, name: categories.name, icon: categories.icon })
        .from(categories)
        .where(sql`${categories.id} IN ${allCategoryIds}`)
      cats.forEach(c => categoryMap.set(c.id, { name: c.name, icon: c.icon }))
    }

    const totalIncome = incomeData.reduce((sum, d) => sum + Math.abs(Number(d.total)), 0)
    const totalExpense = expenseData.reduce((sum, d) => sum + Math.abs(Number(d.total)), 0)

    const expenseByCategory = expenseData
      .map(d => ({
        categoryId: d.categoryId,
        categoryName: categoryMap.get(d.categoryId)?.name || 'Unknown',
        categoryIcon: categoryMap.get(d.categoryId)?.icon || '?',
        amount: Math.abs(Number(d.total)),
        percentage: totalExpense > 0 ? Math.round(Math.abs(Number(d.total)) / totalExpense * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const incomeByCategory = incomeData
      .map(d => ({
        categoryId: d.categoryId,
        categoryName: categoryMap.get(d.categoryId)?.name || 'Unknown',
        categoryIcon: categoryMap.get(d.categoryId)?.icon || '?',
        amount: Math.abs(Number(d.total)),
        percentage: totalIncome > 0 ? Math.round(Math.abs(Number(d.total)) / totalIncome * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return {
      period,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expenseByCategory,
      incomeByCategory,
    }
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
        currency: input.currency as 'RUB' | 'BYN' | 'USD',
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

  async transfer(userId: number, input: TransferInput): Promise<Transaction> {
    const [fromAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, userId)))

    if (!fromAccount) throw new AccessDeniedError('Source account not found or access denied')

    const [toAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, userId)))

    if (!toAccount) throw new AccessDeniedError('Destination account not found or access denied')

    return await db.transaction(async (dbTx) => {
      const [transaction] = await dbTx
        .insert(transactions)
        .values({
          userId,
          accountId: input.fromAccountId,
          categoryId: null,
          amount: input.amount,
          currency: input.currency as 'RUB' | 'BYN' | 'USD',
          description: JSON.stringify({
            type: 'transfer',
            fromAccountId: input.fromAccountId,
            fromAccountName: fromAccount.name,
            toAccountId: input.toAccountId,
            toAccountName: toAccount.name,
            description: input.description || 'Перевод между счетами',
          }),
          date: new Date(),
        })
        .returning()

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${input.amount}` })
        .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, userId)))

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${input.amount}` })
        .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, userId)))

      return transaction
    })
  },
}
