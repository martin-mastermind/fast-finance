import { Elysia, t } from 'elysia'
import { db, transactions, accounts } from '@fast-finance/db'
import { eq, and, desc, sql, count } from 'drizzle-orm'

export const transactionsRouter = new Elysia({ prefix: '/transactions' })
  .get('/', async ({ headers, query, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

    const limit = parseInt(String(query.limit ?? '50'))
    const offset = parseInt(String(query.offset ?? '0'))

    const [{ total }] = await db
      .select({ total: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId))

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset)

    return { items, total, page: Math.floor(offset / limit) + 1, pageSize: limit }
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))
      if (!account) { set.status = 403; return { error: 'Account not found or access denied' } }

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: body.accountId,
          categoryId: body.categoryId,
          amount: body.amount,
          description: body.description || null,
          date: body.date ? new Date(body.date) : new Date(),
        })
        .returning()

      await db
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${body.amount}` })
        .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)))

      return transaction
    },
    {
      body: t.Object({
        accountId: t.Number(),
        categoryId: t.Number(),
        amount: t.Number(),
        description: t.Optional(t.String()),
        date: t.Optional(t.String()),
      }),
    },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }

    const [deleted] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, params.id), eq(transactions.userId, userId)))
      .returning()

    if (!deleted) { set.status = 404; return { error: 'Transaction not found' } }

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${deleted.amount}` })
      .where(eq(accounts.id, deleted.accountId))

    return { success: true }
  })
