export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  userId: number
  accountId: number
  categoryId: number
  amount: number
  description: string | null
  date: Date
}

export interface CreateTransactionDto {
  accountId: number
  categoryId: number
  amount: number
  description?: string
  date?: Date
}

export interface ParsedTransaction {
  amount: number
  categoryName: string
  description: string
}
