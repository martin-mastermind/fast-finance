import { describe, it, expect, mock, beforeEach } from 'bun:test'

type MockDb = {
  select: ReturnType<typeof mock>
  insert: ReturnType<typeof mock>
  update: ReturnType<typeof mock>
  delete: ReturnType<typeof mock>
  from: ReturnType<typeof mock>
  where: ReturnType<typeof mock>
  values: ReturnType<typeof mock>
  set: ReturnType<typeof mock>
  orderBy: ReturnType<typeof mock>
  limit: ReturnType<typeof mock>
  offset: ReturnType<typeof mock>
  returning: ReturnType<typeof mock>
}

const mockDb: MockDb = {
  select: mock(() => mockDb),
  insert: mock(() => mockDb),
  update: mock(() => mockDb),
  delete: mock(() => mockDb),
  from: mock(() => mockDb),
  where: mock(() => mockDb),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  orderBy: mock(() => mockDb),
  limit: mock(() => mockDb),
  offset: mock(() => Promise.resolve([])),
  returning: mock(() => Promise.resolve([])),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  transactions: { id: 'id', userId: 'user_id', date: 'date', accountId: 'account_id' },
  accounts: { id: 'id', userId: 'user_id', balance: 'balance' },
  categories: { id: 'id', userId: 'user_id', name: 'name', icon: 'icon' },
}))

mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq'),
  and: mock(() => 'and'),
  desc: mock(() => 'desc'),
  gte: mock(() => 'gte'),
  lt: mock(() => 'lt'),
  between: mock(() => 'between'),
  count: mock(() => ({ total: 0 })),
  sql: mock((..._args: unknown[]) => 'sql'),
}))

const { TransactionService } = await import('../../domain/transaction.service')
const { AccessDeniedError, NotFoundError } = await import('../../domain/account.service')

const mockAccount = { id: 1, userId: 1, name: 'Карта', balance: 5000 }
const mockTransaction = {
  id: 'uuid-1',
  userId: 1,
  accountId: 1,
  categoryId: 1,
  amount: -500,
  currency: 'RUB',
  description: 'кофе',
  date: new Date(),
}

describe('TransactionService.createTransaction', () => {
  beforeEach(() => {
    mockDb.select.mockReset()
    mockDb.from.mockReset()
    mockDb.insert.mockReset()
    mockDb.update.mockReset()
    mockDb.values.mockReset()
    mockDb.set.mockReset()
    mockDb.returning.mockReset()

    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.update.mockReturnValue(mockDb)
    mockDb.values.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('throws AccessDeniedError when account not owned by user', async () => {
    mockDb.where.mockResolvedValueOnce([])

    await expect(
      TransactionService.createTransaction(1, { accountId: 99, categoryId: 1, amount: -500, currency: 'RUB' }),
    ).rejects.toThrow(AccessDeniedError)
  })

  it('creates transaction and updates balance', async () => {
    mockDb.where
      .mockResolvedValueOnce([mockAccount])
      .mockResolvedValueOnce([])
    mockDb.returning.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.createTransaction(1, {
      accountId: 1,
      categoryId: 1,
      amount: -500,
      currency: 'RUB',
      description: 'кофе',
    })

    expect(result.amount).toBe(-500)
    expect(result.description).toBe('кофе')
    expect(mockDb.update).toHaveBeenCalled()
  })
})

describe('TransactionService.deleteTransaction', () => {
  beforeEach(() => {
    mockDb.delete.mockReset()
    mockDb.update.mockReset()
    mockDb.set.mockReset()
    mockDb.returning.mockReset()

    mockDb.delete.mockReturnValue(mockDb)
    mockDb.update.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('throws NotFoundError when transaction not found', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValueOnce([])

    await expect(
      TransactionService.deleteTransaction(1, 'non-existent'),
    ).rejects.toThrow(NotFoundError)
  })

  it('deletes transaction and reverses balance', async () => {
    mockDb.where
      .mockReturnValueOnce(mockDb)
      .mockResolvedValueOnce([])
    mockDb.returning.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.deleteTransaction(1, 'uuid-1')

    expect(result.id).toBe('uuid-1')
    expect(mockDb.update).toHaveBeenCalled()
  })
})

describe('TransactionService.getTransactions', () => {
  it('returns paginated result', async () => {
    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.where
      .mockResolvedValueOnce([{ total: 1 }])
      .mockReturnValueOnce(mockDb)
    mockDb.orderBy.mockReturnValue(mockDb)
    mockDb.limit.mockReturnValue(mockDb)
    mockDb.offset.mockResolvedValueOnce([mockTransaction])

    const result = await TransactionService.getTransactions(1, 10, 0)

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })
})
