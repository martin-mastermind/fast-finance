import { Elysia, t } from 'elysia'
import { db, accounts } from '@fast-finance/db'
import { eq, and } from 'drizzle-orm'

export const accountsRouter = new Elysia({ prefix: '/accounts' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return db.select().from(accounts).where(eq(accounts.userId, userId))
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      const [account] = await db
        .insert(accounts)
        .values({ userId, name: body.name, balance: body.balance ?? 0 })
        .returning()
      return account
    },
    { body: t.Object({ name: t.String(), balance: t.Optional(t.Number()) }) },
  )
  .patch(
    '/:id',
    async ({ params, body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      const [updated] = await db
        .update(accounts)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.balance !== undefined && { balance: body.balance }),
        })
        .where(and(eq(accounts.id, parseInt(params.id)), eq(accounts.userId, userId)))
        .returning()
      if (!updated) { set.status = 404; return { error: 'Account not found' } }
      return updated
    },
    { body: t.Object({ name: t.Optional(t.String()), balance: t.Optional(t.Number()) }) },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    await db.delete(accounts).where(
      and(eq(accounts.id, parseInt(params.id)), eq(accounts.userId, userId)),
    )
    return { success: true }
  })
