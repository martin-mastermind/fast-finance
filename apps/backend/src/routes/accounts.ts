import { Elysia, t } from 'elysia'
import { AccountService, NotFoundError } from '../domain/account.service'

const CurrencyEnum = t.Union([t.Literal('RUB'), t.Literal('BYN'), t.Literal('USD')])

export const accountsRouter = new Elysia({ prefix: '/accounts' })
  .get('/', async ({ headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    return AccountService.getAccounts(userId)
  })
  .post(
    '/',
    async ({ body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      return AccountService.createAccount(userId, body.name, body.balance, body.currency)
    },
    { body: t.Object({ name: t.String(), balance: t.Optional(t.Number()), currency: t.Optional(CurrencyEnum) }) },
  )
  .patch(
    '/:id',
    async ({ params, body, headers, set }) => {
      const userId = parseInt(headers['x-user-id'] || '0')
      if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await AccountService.updateAccount(userId, parseInt(params.id), body)
      } catch (e) {
        if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
        throw e
      }
    },
    { body: t.Object({ name: t.Optional(t.String()), balance: t.Optional(t.Number()), currency: t.Optional(CurrencyEnum) }) },
  )
  .delete('/:id', async ({ params, headers, set }) => {
    const userId = parseInt(headers['x-user-id'] || '0')
    if (!userId) { set.status = 401; return { error: 'Unauthorized' } }
    try {
      await AccountService.deleteAccount(userId, parseInt(params.id))
      return { success: true }
    } catch (e) {
      if (e instanceof NotFoundError) { set.status = 404; return { error: e.message } }
      throw e
    }
  })
