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
  returning: ReturnType<typeof mock>
}

const mockDb: MockDb = {
  select: mock(() => mockDb),
  insert: mock(() => mockDb),
  update: mock(() => mockDb),
  delete: mock(() => mockDb),
  from: mock(() => mockDb),
  where: mock(() => Promise.resolve([])),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  returning: mock(() => Promise.resolve([])),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  accounts: { id: 'id', userId: 'user_id', name: 'name', balance: 'balance' },
}))

mock.module('drizzle-orm', () => ({
  eq: mock(() => 'eq'),
  and: mock(() => 'and'),
}))

const { AccountService, NotFoundError } = await import('../../domain/account.service')

const mockAccount = { id: 1, userId: 1, name: 'Карта', balance: 5000 }

describe('AccountService.getAccounts', () => {
  beforeEach(() => {
    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.where.mockResolvedValue([mockAccount])
  })

  it('returns accounts for user', async () => {
    const result = await AccountService.getAccounts(1)
    expect(result).toEqual([mockAccount])
  })
})

describe('AccountService.createAccount', () => {
  beforeEach(() => {
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.values.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([mockAccount])
  })

  it('creates account and returns it', async () => {
    const result = await AccountService.createAccount(1, 'Карта')
    expect(result).toEqual(mockAccount)
  })
})

describe('AccountService.updateAccount', () => {
  beforeEach(() => {
    mockDb.update.mockReturnValue(mockDb)
    mockDb.set.mockReturnValue(mockDb)
  })

  it('returns updated account', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([{ ...mockAccount, name: 'Новое имя' }])
    const result = await AccountService.updateAccount(1, 1, { name: 'Новое имя' })
    expect(result.name).toBe('Новое имя')
  })

  it('throws NotFoundError when account not found', async () => {
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([])
    await expect(AccountService.updateAccount(1, 99, { name: 'x' })).rejects.toThrow(NotFoundError)
  })
})

describe('AccountService.deleteAccount', () => {
  beforeEach(() => {
    mockDb.delete.mockReturnValue(mockDb)
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([{ id: 1, userId: 1, name: 'Карта', balance: 5000 }])
  })

  it('resolves without error when account exists', async () => {
    await expect(AccountService.deleteAccount(1, 1)).resolves.toBeUndefined()
  })

  it('throws NotFoundError when account not found', async () => {
    mockDb.delete.mockReturnValue(mockDb)
    mockDb.where.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([])
    await expect(AccountService.deleteAccount(1, 99)).rejects.toThrow(NotFoundError)
  })
})
