import { db, transactions, accounts, categories } from '@fast-finance/db'
import { eq, and, desc, count, sql, gte, lt, inArray } from 'drizzle-orm'
import { CurrencyService } from '../../domain/currency.service'
import type { ITransactionRepository } from '../../domain/interfaces/transaction-repository.interface'
import type { Transaction, TransactionCreateInput, TransactionUpdateInput, TransferInput, TransactionStats } from '../../domain/entities/transaction.entity'
import { toTransaction } from '../../domain/entities/transaction.entity'
import { NotFoundError } from '../../domain/errors/domain-errors'

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

export class DrizzleTransactionRepository implements ITransactionRepository {
  async findByUserId(userId: number, limit: number, offset: number): Promise<{ items: Transaction[]; total: number }> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId))

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(limit)
      .offset(offset)

    return { items: items.map(toTransaction), total }
  }

  async findById(id: string, userId: number): Promise<Transaction | null> {
    const [tx] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1)

    return tx ? toTransaction(tx) : null
  }

  async create(userId: number, input: TransactionCreateInput): Promise<Transaction> {
    const [tx] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        amount: input.amount,
        currency: input.currency,
        description: input.description || null,
        date: input.date ? new Date(input.date) : new Date(),
      })
      .returning()

    return toTransaction(tx)
  }

  async update(id: string, userId: number, input: TransactionUpdateInput): Promise<Transaction> {
    const updateData: Record<string, unknown> = {}
    if (input.accountId !== undefined) updateData.accountId = input.accountId
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId
    if (input.amount !== undefined) updateData.amount = input.amount
    if (input.description !== undefined) updateData.description = input.description
    if (input.date !== undefined) updateData.date = new Date(input.date)

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()

    if (!updated) throw new NotFoundError('Transaction not found')
    return toTransaction(updated)
  }

  async delete(id: string, userId: number): Promise<Transaction> {
    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning()

    if (!deleted) throw new NotFoundError('Transaction not found')
    return toTransaction(deleted)
  }

  async getStats(userId: number, period: string): Promise<TransactionStats> {
    const { start, end } = getDateRange(period)

    const rates = await CurrencyService.getRates()
    const getRate = (currency: string): number => rates[currency] ?? 1

    const allTransactions = await db
      .select({
        categoryId: transactions.categoryId,
        amount: transactions.amount,
        currency: transactions.currency,
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        sql`${transactions.categoryId} IS NOT NULL`,
        gte(transactions.date, start),
        lt(transactions.date, end)
      ))

    const expenseByCategoryMap = new Map<number, number>()
    const incomeByCategoryMap = new Map<number, number>()

    allTransactions.forEach(tx => {
      const rate = getRate(tx.currency)
      const usdAmount = tx.amount * rate

      if (usdAmount < 0) {
        expenseByCategoryMap.set(
          tx.categoryId,
          (expenseByCategoryMap.get(tx.categoryId) ?? 0) + usdAmount
        )
      } else if (usdAmount > 0) {
        incomeByCategoryMap.set(
          tx.categoryId,
          (incomeByCategoryMap.get(tx.categoryId) ?? 0) + usdAmount
        )
      }
    })

    const expenseData = Array.from(expenseByCategoryMap.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
    }))

    const incomeData = Array.from(incomeByCategoryMap.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
    }))

    const categoryMap = new Map<number, { name: string; icon: string }>()
    const allCategoryIds = [...expenseData.map(d => d.categoryId), ...incomeData.map(d => d.categoryId)]
    if (allCategoryIds.length > 0) {
      const cats = await db
        .select({ id: categories.id, name: categories.name, icon: categories.icon })
        .from(categories)
        .where(inArray(categories.id, allCategoryIds))
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
  }
  async transfer(userId: number, input: TransferInput, fromAccountName: string, toAccountName: string): Promise<Transaction> {
    return await db.transaction(async (dbTx) => {
      const [transaction] = await dbTx
        .insert(transactions)
        .values({
          userId,
          accountId: input.fromAccountId,
          categoryId: null,
          amount: -input.amount,
          currency: input.currency,
          description: JSON.stringify({
            type: 'transfer',
            fromAccountId: input.fromAccountId,
            fromAccountName,
            toAccountId: input.toAccountId,
            toAccountName,
            description: input.description || 'Перевод между счетами',
          }),
          date: new Date(),
        })
        .returning()

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${input.amount}` })
        .where(eq(accounts.id, input.fromAccountId))

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${input.amount}` })
        .where(eq(accounts.id, input.toAccountId))

      return toTransaction(transaction)
    }) as Transaction
  }
}

export const transactionRepository = new DrizzleTransactionRepository()