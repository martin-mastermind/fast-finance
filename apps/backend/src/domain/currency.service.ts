import { db, currencyRates } from '@fast-finance/db'
import { eq } from 'drizzle-orm'

const DEFAULT_RATES = {
  USD: 1,
  RUB: 0.0115,
  BYN: 0.31,
}

export const CurrencyService = {
  async getRates(): Promise<Record<string, number>> {
    const rates = await db.select().from(currencyRates)
    
    if (rates.length === 0) {
      await this.updateRates()
      return DEFAULT_RATES
    }

    const rateMap: Record<string, number> = {}
    for (const r of rates) {
      rateMap[r.currency] = r.rateToUSD
    }
    return rateMap
  },

  async updateRates(): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates')
      }

      const data = await response.json() as { rates: Record<string, number> }
      const rates = data.rates

      const toUpdate = [
        { currency: 'USD', rateToUSD: 1 },
        { currency: 'RUB', rateToUSD: rates.RUB || DEFAULT_RATES.RUB },
        { currency: 'BYN', rateToUSD: rates.BYN || DEFAULT_RATES.BYN },
      ]

      for (const rate of toUpdate) {
        const existing = await db
          .select()
          .from(currencyRates)
          .where(eq(currencyRates.currency, rate.currency))
          .limit(1)

        if (existing.length > 0) {
          await db
            .update(currencyRates)
            .set({ rateToUSD: rate.rateToUSD, updatedAt: new Date() })
            .where(eq(currencyRates.currency, rate.currency))
        } else {
          await db.insert(currencyRates).values(rate)
        }
      }

      return {
        USD: 1,
        RUB: toUpdate.find(r => r.currency === 'RUB')!.rateToUSD,
        BYN: toUpdate.find(r => r.currency === 'BYN')!.rateToUSD,
      }
    } catch (error) {
      console.error('Failed to update currency rates:', error)
      return DEFAULT_RATES
    }
  },
}