import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Mock DB before importing the router
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
  where: mock(() => mockDb),
  values: mock(() => mockDb),
  set: mock(() => mockDb),
  returning: mock(() => Promise.resolve([])),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  transactions: { id: 'id', userId: 'user_id', date: 'date' },
  accounts: { id: 'id', userId: 'user_id', name: 'name', balance: 'balance' },
}))

// Import after mocking
const { accountsRouter } = await import('../../routes/accounts')
import { Elysia } from 'elysia'

const app = new Elysia().use(accountsRouter)

function makeRequest(method: string, path: string, opts: { userId?: number; body?: unknown } = {}) {
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

describe('GET /accounts', () => {
  beforeEach(() => {
    mockDb.select.mockReset()
    mockDb.from.mockReset()
    mockDb.where.mockReset()

    mockDb.select.mockReturnValue(mockDb)
    mockDb.from.mockReturnValue(mockDb)
    mockDb.where.mockResolvedValue([
      { id: 1, userId: 1, name: 'Карта', balance: 5000 },
      { id: 2, userId: 1, name: 'Наличные', balance: 1000 },
    ])
  })

  it('returns accounts for authenticated user', async () => {
    const res = await makeRequest('GET', '/accounts')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].name).toBe('Карта')
  })

  it('returns 401 without x-user-id header', async () => {
    const res = await app.handle(
      new Request('http://localhost/accounts', { method: 'GET' }),
    )
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})

describe('POST /accounts', () => {
  beforeEach(() => {
    mockDb.insert.mockReset()
    mockDb.values.mockReset()
    mockDb.returning.mockReset()

    mockDb.insert.mockReturnValue(mockDb)
    mockDb.values.mockReturnValue(mockDb)
    mockDb.returning.mockResolvedValue([{ id: 3, userId: 1, name: 'Вклад', balance: 0 }])
  })

  it('creates account and returns it', async () => {
    const res = await makeRequest('POST', '/accounts', { body: { name: 'Вклад' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Вклад')
    expect(data.id).toBe(3)
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(
      new Request('http://localhost/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      }),
    )
    expect(res.status).toBe(401)
  })
})

describe('DELETE /accounts/:id', () => {
  beforeEach(() => {
    mockDb.delete.mockReturnValue(mockDb)
    mockDb.where.mockResolvedValue([])
  })

  it('deletes account and returns success', async () => {
    const res = await makeRequest('DELETE', '/accounts/1')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
