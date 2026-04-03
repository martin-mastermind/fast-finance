import { Elysia, t } from 'elysia'
import { CurrencyService } from '../domain/currency.service'

export const currencyRouter = new Elysia({ prefix: '/currency' })
  .get('/rates', async () => {
    return CurrencyService.getRates()
  })
  .post('/rates/refresh', async ({ set }) => {
    try {
      const rates = await CurrencyService.updateRates()
      return { success: true, rates }
    } catch (e) {
      set.status = 500
      return { success: false, error: 'Failed to update rates' }
    }
  })