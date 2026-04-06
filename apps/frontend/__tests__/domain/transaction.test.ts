import { describe, it, expect } from 'vitest'
import type { Transaction, TransactionCreateInput, TransferInput, TransactionStats, PaginatedTransactions } from '../../src/domain/types/transaction'

describe('Transaction Types', () => {
  const validTransaction: Transaction = {
    id: 'tx-123',
    userId: 1,
    accountId: 1,
    categoryId: 5,
    amount: -500,
    currency: 'RUB',
    description: 'Покупка продуктов',
    date: '2024-01-15T10:30:00Z',
  }

  it('valid transaction structure', () => {
    expect(validTransaction.id).toBe('tx-123')
    expect(validTransaction.amount).toBe(-500)
    expect(validTransaction.categoryId).toBe(5)
  })

  it('transaction with null category', () => {
    const transfer: Transaction = {
      ...validTransaction,
      categoryId: null,
    }

    expect(transfer.categoryId).toBeNull()
  })

  it('valid create input', () => {
    const input: TransactionCreateInput = {
      accountId: 1,
      categoryId: 5,
      amount: -1000,
      currency: 'RUB',
      description: 'Оплата коммунальных',
    }

    expect(input.accountId).toBe(1)
    expect(input.amount).toBe(-1000)
  })

  it('valid transfer input', () => {
    const input: TransferInput = {
      fromAccountId: 1,
      toAccountId: 2,
      amount: 5000,
      currency: 'RUB',
      description: 'Перевод на карту',
    }

    expect(input.fromAccountId).toBe(1)
    expect(input.toAccountId).toBe(2)
  })

  it('valid transaction stats', () => {
    const stats: TransactionStats = {
      period: 'month',
      totalIncome: 50000,
      totalExpense: 35000,
      balance: 15000,
      expenseByCategory: [
        { categoryId: 1, categoryName: 'Еда', categoryIcon: '🍕', amount: 15000, percentage: 42 },
        { categoryId: 2, categoryName: 'Транспорт', categoryIcon: '🚕', amount: 5000, percentage: 14 },
      ],
      incomeByCategory: [
        { categoryId: 3, categoryName: 'Зарплата', categoryIcon: '💰', amount: 45000, percentage: 90 },
      ],
    }

    expect(stats.balance).toBe(15000)
    expect(stats.expenseByCategory).toHaveLength(2)
    expect(stats.expenseByCategory[0].percentage).toBe(42)
  })

  it('valid paginated transactions', () => {
    const paginated: PaginatedTransactions = {
      items: [validTransaction],
      total: 100,
      page: 1,
      pageSize: 50,
    }

    expect(paginated.total).toBe(100)
    expect(paginated.items).toHaveLength(1)
    expect(paginated.pageSize).toBe(50)
  })
})
