import { Elysia, t } from 'elysia'
import { db, users, accounts, transactions, categories, savingsGoals, aiInsights, aiChatMessages } from '@fast-finance/db'
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
  // GDPR: Export all user data
  .get('/me/export', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      set.status = 404
      return { error: 'User not found' }
    }

    const [
      userAccounts,
      userTransactions,
      userCategories,
      userGoals,
      userInsights,
      userChatMessages,
    ] = await Promise.all([
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(transactions).where(eq(transactions.userId, userId)),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)),
      db.select().from(aiInsights).where(eq(aiInsights.userId, userId)),
      db.select().from(aiChatMessages).where(eq(aiChatMessages.userId, userId)),
    ])

    set.headers['Content-Disposition'] = 'attachment; filename="export.json"'
    set.headers['Content-Type'] = 'application/json'

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      accounts: userAccounts,
      transactions: userTransactions,
      categories: userCategories,
      savingsGoals: userGoals,
      aiInsights: userInsights,
      aiChatMessages: userChatMessages,
    }
  })
  // GDPR: Delete all user data (right to erasure)
  .delete('/me', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      set.status = 404
      return { error: 'User not found' }
    }

    // Hard delete — ON DELETE CASCADE handles all child records automatically
    await db.delete(users).where(eq(users.id, userId))

    set.status = 204
    return
  })
