import { Elysia } from 'elysia'
import { CurrencyService } from '../domain/currency.service'
import { withAuth, parseUserIdFromToken } from '../middleware/auth'

export const currencyRouter = new Elysia({ prefix: '/currency' })
  .use(withAuth())
  .get('/rates', async () => {
    return CurrencyService.getRates()
  })
  // Protected: only authenticated users can force a rate refresh
  .post('/rates/refresh', async ({ headers, set }) => {
    const userId = parseUserIdFromToken(headers.authorization)
    if (!userId) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
    try {
      const rates = await CurrencyService.updateRates()
      return { success: true, rates }
    } catch {
      set.status = 500
      return { success: false, error: 'Failed to update rates' }
    }
  })
