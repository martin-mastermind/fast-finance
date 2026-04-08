import type { Transaction as DbTransaction } from '@fast-finance/db'
import type { Currency } from './account.entity'

export interface Transaction {
  id: string
  userId: number
  accountId: number
  categoryId: number | null
  amount: number
  currency: Currency
  description: string | null
  date: Date
  createdAt: Date | null
  updatedAt: Date | null
}

export interface TransactionCreateInput {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: string
  currency: Currency
}

export interface TransactionUpdateInput {
  accountId?: number
  categoryId?: number
  amount?: number
  description?: string
  date?: string
}

export interface TransferInput {
  fromAccountId: number
  toAccountId: number
  amount: number
  description?: string
  currency: Currency
}

export interface TransactionStats {
  period: string
  totalIncome: number
  totalExpense: number
  balance: number
  expenseByCategory: CategoryStat[]
  incomeByCategory: CategoryStat[]
}

export interface CategoryStat {
  categoryId: number
  categoryName: string
  categoryIcon: string
  amount: number
  percentage: number
}

export function toTransaction(dbTx: DbTransaction): Transaction {
  return {
    id: dbTx.id,
    userId: dbTx.userId,
    accountId: dbTx.accountId,
    categoryId: dbTx.categoryId,
    amount: Number(dbTx.amount),
    currency: dbTx.currency as Currency,
    description: dbTx.description,
    date: new Date(dbTx.date),
    createdAt: dbTx.createdAt,
    updatedAt: dbTx.updatedAt,
  }
}