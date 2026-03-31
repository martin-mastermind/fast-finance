import { describe, it, expect, mock } from 'bun:test'
import { Elysia } from 'elysia'

const mockCategories = [
  { id: 1, name: 'Еда', icon: '🍕', type: 'expense' },
  { id: 2, name: 'Зарплата', icon: '💰', type: 'income' },
]

const mockDb = {
  select: mock(() => mockDb),
  from: mock(() => Promise.resolve(mockCategories)),
}

mock.module('@fast-finance/db', () => ({
  db: mockDb,
  categories: {},
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
    expect(data[0].name).toBe('Еда')
  })

  it('returns 401 without x-user-id header', async () => {
    const res = await app.handle(new Request('http://localhost/categories'))
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })
})
