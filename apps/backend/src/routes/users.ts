import { Elysia, t } from 'elysia'
import { db, users } from '@fast-finance/db'
import { eq } from 'drizzle-orm'

export const usersRouter = new Elysia({ prefix: '/users' })
  .patch(
    '/currency',
    async ({ body, set, headers }) => {
      const userId = headers['x-user-id']
      if (!userId) {
        set.status = 401
        return { error: 'User ID required' }
      }

      const { currency } = body as { currency: string }
      const validCurrencies = ['RUB', 'BYN', 'USD']
      
      if (!validCurrencies.includes(currency)) {
        set.status = 400
        return { error: 'Invalid currency' }
      }

      const [updated] = await db
        .update(users)
        .set({ currency })
        .where(eq(users.id, parseInt(userId)))
        .returning()

      if (!updated) {
        set.status = 404
        return { error: 'User not found' }
      }

      return { currency: updated.currency }
    },
    {
      body: t.Object({ currency: t.String() }),
    },
  )
