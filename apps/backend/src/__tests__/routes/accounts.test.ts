import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockGetAccounts = mock(async () => [] as any[])
const mockCreateAccount = mock(async () => ({ id: 3, userId: 1, name: 'Вклад', balance: 0 }))
const mockUpdateAccount = mock(async () => ({ id: 1, userId: 1, name: 'Обновлено', balance: 0 }))
const mockDeleteAccount = mock(async () => undefined)

mock.module('../../domain/account.service', () => ({
  AccountService: {
    getAccounts: mockGetAccounts,
    createAccount: mockCreateAccount,
    updateAccount: mockUpdateAccount,
    deleteAccount: mockDeleteAccount,
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message = 'Not found') { super(message); this.name = 'NotFoundError' }
  },
}))

const { accountsRouter } = await import('../../routes/accounts')
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
    mockGetAccounts.mockResolvedValue([
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
    const res = await app.handle(new Request('http://localhost/accounts', { method: 'GET' }))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})

describe('POST /accounts', () => {
  beforeEach(() => {
    mockCreateAccount.mockResolvedValue({ id: 3, userId: 1, name: 'Вклад', balance: 0 })
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

describe('PATCH /accounts/:id', () => {
  beforeEach(() => {
    mockUpdateAccount.mockResolvedValue({ id: 1, userId: 1, name: 'Обновлено', balance: 9999 })
  })

  it('updates account and returns it', async () => {
    const res = await makeRequest('PATCH', '/accounts/1', { body: { name: 'Обновлено' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Обновлено')
  })

  it('returns 404 when account not found', async () => {
    const { NotFoundError } = await import('../../domain/account.service')
    mockUpdateAccount.mockRejectedValue(new NotFoundError('Account not found'))
    const res = await makeRequest('PATCH', '/accounts/999', { body: { name: 'x' } })
    expect(res.status).toBe(404)
  })

  it('returns 401 without user id', async () => {
    const res = await app.handle(
      new Request('http://localhost/accounts/1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'x' }),
      }),
    )
    expect(res.status).toBe(401)
  })
})

describe('DELETE /accounts/:id', () => {
  beforeEach(() => {
    mockDeleteAccount.mockResolvedValue(undefined)
  })

  it('deletes account and returns success', async () => {
    const res = await makeRequest('DELETE', '/accounts/1')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 404 when account not found', async () => {
    const { NotFoundError } = await import('../../domain/account.service')
    mockDeleteAccount.mockRejectedValue(new NotFoundError('Account not found'))
    const res = await makeRequest('DELETE', '/accounts/999')
    expect(res.status).toBe(404)
  })
})
