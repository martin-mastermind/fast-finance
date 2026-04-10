import { Elysia, t } from 'elysia'
import { accountRepository } from '../../infrastructure/repositories/account.repository'
import { AccountUseCases } from '../../application/use-cases/account.use-cases'
import { AccessDeniedError, NotFoundError } from '../../domain/errors/domain-errors'
import { withAuth, parseUserIdFromToken } from '../../middleware/auth'
import { withPlanLimit } from '../../middleware/plan-limits'

const accountUseCases = new AccountUseCases(accountRepository)

export const accountsRouter = new Elysia({ prefix: '/accounts' })
  .use(withAuth())
  .use(withPlanLimit('accounts'))
  .get('/', async ({ headers, query }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    const limit = Math.min(parseInt(String(query.limit ?? '100')), 500)
    const offset = parseInt(String(query.offset ?? '0'))
    return accountUseCases.getAccounts(userId, limit, offset)
  }, {
    query: t.Object({
      limit: t.Optional(t.Numeric()),
      offset: t.Optional(t.Numeric()),
    }),
  })
  .get('/:id', async ({ params, headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    try {
      return await accountUseCases.getAccountById(Number(params.id), userId)
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
  .post('/', async ({ body, headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
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
    const userId = parseUserIdFromToken(headers.authorization)
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
    const userId = parseUserIdFromToken(headers.authorization)
    try {
      await accountUseCases.deleteAccount(Number(params.id), userId)
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
