import { Elysia, t } from 'elysia'
import { transactionRepository } from '../../infrastructure/repositories/transaction.repository'
import { TransactionUseCases } from '../../application/use-cases/transaction.use-cases'
import { AccessDeniedError, NotFoundError } from '../../domain/errors/domain-errors'

const transactionUseCases = new TransactionUseCases(transactionRepository)

export const transactionsRouter = new Elysia({ prefix: '/transactions' })
  .get('/', async ({ headers, query, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    const limit = parseInt(String(query.limit ?? '50'))
    const offset = parseInt(String(query.offset ?? '0'))
    return transactionUseCases.getTransactions(userId, limit, offset)
  })
  .get('/stats', async ({ headers, query, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    const period = String(query.period ?? 'month')
    return transactionUseCases.getTransactionStats(userId, period)
  })
  .post('/', async ({ body, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await transactionUseCases.createTransaction(userId, body)
    } catch (e) {
      if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      accountId: t.Number(),
      categoryId: t.Number(),
      amount: t.Number(),
      currency: t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')]),
      description: t.Optional(t.String()),
      date: t.Optional(t.String()),
    }),
  })
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      await transactionUseCases.deleteTransaction(userId, params.id)
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
  .post('/transfer', async ({ body, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await transactionUseCases.transfer(userId, body)
    } catch (e) {
      if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      fromAccountId: t.Number(),
      toAccountId: t.Number(),
      amount: t.Number(),
      currency: t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')]),
      description: t.Optional(t.String()),
    }),
  })