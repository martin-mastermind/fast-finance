import { Elysia, t } from 'elysia'
import { accountRepository } from '../../infrastructure/repositories/account.repository'
import { AccountUseCases } from '../../application/use-cases/account.use-cases'
import { AccessDeniedError, NotFoundError } from '../../domain/errors/domain-errors'

const accountUseCases = new AccountUseCases(accountRepository)

export const accountsRouter = new Elysia({ prefix: '/accounts' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return accountUseCases.getAccounts(userId)
  })
  .get('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await accountUseCases.getAccountById(Number(params.id), userId)
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
  .post('/', async ({ body, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await accountUseCases.createAccount(userId, body)
    } catch (e) {
      if (e instanceof AccessDeniedError) { set.status = 403; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      name: t.String(),
      balance: t.Optional(t.Number()),
      currency: t.Optional(t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')])),
      type: t.Optional(t.Union([t.Literal('checking'), t.Literal('savings')])),
    }),
  })
  .patch('/:id', async ({ params, body, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      return await accountUseCases.updateAccount(Number(params.id), userId, body)
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      balance: t.Optional(t.Number()),
      currency: t.Optional(t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')])),
      sortOrder: t.Optional(t.Number()),
      type: t.Optional(t.Union([t.Literal('checking'), t.Literal('savings')])),
    }),
  })
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      await accountUseCases.deleteAccount(Number(params.id), userId)
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })