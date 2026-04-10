import { Elysia, t } from 'elysia'
import { db, users } from '@fast-finance/db'
import { eq } from 'drizzle-orm'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'

export const usersRouter = new Elysia({ prefix: '/users' })
  .use(withAuth())
  .patch(
    '/currency',
    async ({ body, set, headers }) => {
      const userId = parseUserIdFromToken(headers.authorization)
      const { currency } = body as { currency: string }
      const validCurrencies = ['RUB', 'BYN', 'USD']

      if (!validCurrencies.includes(currency)) {
        set.status = 400
        return { error: 'Invalid currency' }
      }

      const [updated] = await db
        .update(users)
        .set({ currency })
        .where(eq(users.id, userId))
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
