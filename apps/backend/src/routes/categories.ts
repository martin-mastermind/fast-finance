import { Elysia, t } from 'elysia'
import { db, categories } from '@fast-finance/db'
import { eq, and, or, isNull } from 'drizzle-orm'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'

const CategoryTypeEnum = t.Union([t.Literal('income'), t.Literal('expense')])

export const categoriesRouter = new Elysia({ prefix: '/categories' })
  .use(withAuth())
  .get('/', async ({ headers, query }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const limit = Math.min(parseInt(String(query.limit ?? '100')), 500)
    const offset = parseInt(String(query.offset ?? '0'))
    return db.select().from(categories).where(
      and(
        isNull(categories.deletedAt),
        or(eq(categories.userId, userId), isNull(categories.userId))
      )
    ).limit(limit).offset(offset)
  }, {
    query: t.Object({
      limit: t.Optional(t.Numeric()),
      offset: t.Optional(t.Numeric()),
    }),
  })
  .post(
    '/',
    async ({ body, headers }) => {
      const userId = parseUserIdFromToken(headers.authorization)
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
  .patch(
    '/:id',
    async ({ params, body, headers, set }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      const categoryId = parseInt(params.id)
      if (isNaN(categoryId)) { set.status = 400; return { error: 'Invalid category ID' } }
      const [updated] = await db.update(categories)
        .set({ name: body.name, icon: body.icon, type: body.type })
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), isNull(categories.deletedAt)))
        .returning()
      if (!updated) { set.status = 404; return { error: 'Category not found' } }
      return updated
    },
    { body: t.Object({ name: t.String(), icon: t.String(), type: CategoryTypeEnum }) },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const categoryId = parseInt(params.id)
    if (isNaN(categoryId)) { set.status = 400; return { error: 'Invalid category ID' } }
    // Soft delete
    const [deleted] = await db.update(categories)
      .set({ deletedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), isNull(categories.deletedAt)))
      .returning()
    if (!deleted) { set.status = 404; return { error: 'Category not found' } }
    return { success: true }
  })
