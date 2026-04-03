import { Elysia, t } from 'elysia'
import { db, categories } from '@fast-finance/db'
import { eq, or, isNull } from 'drizzle-orm'

const CategoryTypeEnum = t.Union([t.Literal('income'), t.Literal('expense')])

export const categoriesRouter = new Elysia({ prefix: '/categories' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return db.select().from(categories).where(
      or(eq(categories.userId, userId), isNull(categories.userId))
    )
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      const [created] = await db.insert(categories).values({
        userId,
        name: body.name,
        icon: body.icon,
        type: body.type,
      }).returning()
      return created
    },
    { body: t.Object({ name: t.String(), icon: t.String(), type: CategoryTypeEnum }) },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    const categoryId = parseInt(params.id)
    await db.delete(categories).where(
      eq(categories.id, categoryId)
    ).execute()
    return { success: true }
  })
