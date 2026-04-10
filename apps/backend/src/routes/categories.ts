import { Elysia, t } from 'elysia'
import { db, categories } from '@fast-finance/db'
import { eq, and, or, isNull } from 'drizzle-orm'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'

const CategoryTypeEnum = t.Union([t.Literal('income'), t.Literal('expense')])

export const categoriesRouter = new Elysia({ prefix: '/categories' })
  .use(withAuth())
  .get('/', async ({ headers }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    return db.select().from(categories).where(
      or(eq(categories.userId, userId), isNull(categories.userId))
    )
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
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
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
    const [deleted] = await db.delete(categories).where(
      and(eq(categories.id, categoryId), eq(categories.userId, userId))
    ).returning()
    if (!deleted) { set.status = 404; return { error: 'Category not found' } }
    return { success: true }
  })
