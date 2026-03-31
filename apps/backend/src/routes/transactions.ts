import { Elysia, t } from 'elysia'
import { TransactionService } from '../domain/transaction.service'
import { AccessDeniedError, NotFoundError } from '../domain/account.service'

export const transactionsRouter = new Elysia({ prefix: '/transactions' })
  .get('/', async ({ headers, query, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    const limit = parseInt(String(query.limit ?? '50'))
    const offset = parseInt(String(query.offset ?? '0'))
    return TransactionService.getTransactions(userId, limit, offset)
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await TransactionService.createTransaction(userId, body)
      } catch (e) {
        if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
        throw e
      }
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
    try {
      await TransactionService.deleteTransaction(userId, params.id)
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
