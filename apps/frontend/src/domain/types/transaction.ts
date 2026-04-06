import type { Currency } from './account'

export interface Transaction {
  id: string
  userId: number
  accountId: number
  categoryId: number | null
  amount: number
  currency: Currency
  description: string | null
  date: string
}

export interface TransactionCreateInput {
  accountId: number
  categoryId: number
  amount: number
  currency: Currency
  description?: string
  date?: string
}

export interface TransferInput {
  fromAccountId: number
  toAccountId: number
  amount: number
  currency: Currency
  description?: string
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

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  pageSize: number
}