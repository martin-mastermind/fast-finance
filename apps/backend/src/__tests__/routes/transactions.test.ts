import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockGetTransactions = mock(async () => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
}))
const mockCreateTransaction = mock(async () => ({}))
const mockDeleteTransaction = mock(async () => ({}))

mock.module('../../domain/transaction.service', () => ({
  TransactionService: {
    getTransactions: mockGetTransactions,
    createTransaction: mockCreateTransaction,
    deleteTransaction: mockDeleteTransaction,
  },
}))

mock.module('../../domain/account.service', () => ({
  AccessDeniedError: class AccessDeniedError extends Error {
    constructor(message = 'Access denied') { super(message); this.name = 'AccessDeniedError' }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message = 'Not found') { super(message); this.name = 'NotFoundError' }
  },
}))

const { transactionsRouter } = await import('../../routes/transactions')
const app = new Elysia().use(transactionsRouter)

const mockTransaction = {
  id: 'uuid-123',
  userId: 1,
  accountId: 1,
  categoryId: 1,
  amount: -500,
  currency: 'RUB',
  description: 'кофе',
  date: new Date(),
}

function makeRequest(
  method: string,
  path: string,
  opts: { userId?: number; body?: unknown } = {},
) {
  const { userId = 1, body } = opts
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-user-id': String(userId),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  )
}

describe('GET /transactions', () => {
  beforeEach(() => {
    mockGetTransactions.mockResolvedValue({
      items: [mockTransaction],
      total: 1,
      page: 1,
      pageSize: 10,
    })
  })

  it('returns paginated transactions', async () => {
    const res = await makeRequest('GET', '/transactions?limit=10&offset=0')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('items')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('pageSize')
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(new Request('http://localhost/transactions'))
    expect(res.status).toBe(401)
  })
})

describe('POST /transactions', () => {
  beforeEach(() => {
    mockCreateTransaction.mockResolvedValue(mockTransaction)
  })

  it('returns 403 when account does not belong to user', async () => {
    const { AccessDeniedError } = await import('../../domain/account.service')
    mockCreateTransaction.mockRejectedValue(new AccessDeniedError('Access denied'))

    const res = await makeRequest('POST', '/transactions', {
      body: { accountId: 99, categoryId: 1, amount: -500, currency: 'RUB', description: 'кофе' },
    })
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('denied')
  })

  it('creates transaction when account belongs to user', async () => {
    const res = await makeRequest('POST', '/transactions', {
      body: { accountId: 1, categoryId: 1, amount: -500, currency: 'RUB', description: 'кофе' },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.amount).toBe(-500)
    expect(data.description).toBe('кофе')
  })
})

describe('DELETE /transactions/:id', () => {
  beforeEach(() => {
    mockDeleteTransaction.mockResolvedValue(mockTransaction)
  })

  it('returns 404 for non-existent transaction', async () => {
    const { NotFoundError } = await import('../../domain/account.service')
    mockDeleteTransaction.mockRejectedValue(new NotFoundError('Transaction not found'))

    const res = await makeRequest('DELETE', '/transactions/non-existent-uuid')
    expect(res.status).toBe(404)
  })

  it('deletes transaction successfully', async () => {
    const res = await makeRequest('DELETE', '/transactions/uuid-123')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
