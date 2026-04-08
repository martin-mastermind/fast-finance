import { Elysia, t } from 'elysia'
import { transactionRepository } from '../../infrastructure/repositories/transaction.repository'
import { accountRepository } from '../../infrastructure/repositories/account.repository'
import { TransactionUseCases } from '../../application/use-cases/transaction.use-cases'
import { AccessDeniedError, NotFoundError, InsufficientFundsError } from '../../domain/errors/domain-errors'

const transactionUseCases = new TransactionUseCases(transactionRepository, accountRepository)

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
      amount: t.Number({ minimum: -1_000_000_000, maximum: 1_000_000_000 }),
      currency: t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')]),
      description: t.Optional(t.String({ maxLength: 500 })),
      date: t.Optional(t.String()),
    }),
  })
  .patch('/:id', async ({ params, body, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await transactionUseCases.updateTransaction(userId, params.id, body)
    } catch (e) {
      if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      accountId: t.Optional(t.Number()),
      categoryId: t.Optional(t.Number()),
      amount: t.Optional(t.Number({ minimum: -1_000_000_000, maximum: 1_000_000_000 })),
      description: t.Optional(t.String({ maxLength: 500 })),
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
      if (e instanceof InsufficientFundsError) { set.status = 400; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      fromAccountId: t.Number(),
      toAccountId: t.Number(),
      amount: t.Number({ minimum: 0.01, maximum: 1_000_000_000 }),
      currency: t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')]),
      description: t.Optional(t.String()),
    }),
  })