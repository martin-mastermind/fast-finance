import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { Elysia } from 'elysia'

const mockCategories = [
  { id: 1, name: 'Еда', icon: '🍕', type: 'expense', userId: null },
  { id: 2, name: 'Зарплата', icon: '💰', type: 'income', userId: 1 },
]

const mockEq = mock(() => (col: any, val: any) => ({ type: 'eq', col, val }))
const mockAnd = mock(() => (...args: any[]) => ({ type: 'and', args }))
const mockOr = mock(() => (...args: any[]) => ({ type: 'or', args }))
const mockIsNull = mock(() => (col: any) => ({ type: 'isNull', col }))

const mockFrom = mock(() => ({
  where: mock(() => Promise.resolve(mockCategories))
}))
const mockSelect = mock(() => ({ from: mockFrom }))

const mockDb = {
  select: mockSelect,
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  categories: {
    userId: 'userId',
    id: 'id',
    name: 'name',
    icon: 'icon',
    type: 'type',
  },
  eq: mockEq,
  and: mockAnd,
  or: mockOr,
  isNull: mockIsNull,
}))

const { categoriesRouter } = await import('../../routes/categories')
const app = new Elysia().use(categoriesRouter)

describe('GET /categories', () => {
  it('returns all categories for authenticated user', async () => {
    const res = await app.handle(
      new Request('http://localhost/categories', {
        headers: { 'x-user-id': '1' },
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })

  it('returns 401 without x-user-id header', async () => {
    const res = await app.handle(new Request('http://localhost/categories'))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})