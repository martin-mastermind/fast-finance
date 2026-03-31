import { Elysia } from 'elysia'
import { db, categories } from '@fast-finance/db'

export const categoriesRouter = new Elysia({ prefix: '/categories' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return db.select().from(categories)
  })
