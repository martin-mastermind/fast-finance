const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  RUB: 0.0115,
  BYN: 0.31,
}

let cachedRates: Record<string, number> | null = null
let lastFetch: number = 0
const CACHE_TTL = 60 * 60 * 1000

export async function fetchRates(): Promise<Record<string, number>> {
  const now = Date.now()
  
  if (cachedRates && (now - lastFetch) < CACHE_TTL) {
    return cachedRates
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${API_URL}/currency/rates`)
    if (response.ok) {
      cachedRates = await response.json() as Record<string, number>
      lastFetch = now
      return cachedRates
    }
  } catch (e) {
    console.warn('Failed to fetch currency rates, using fallback')
  }

  return FALLBACK_RATES
}

export function convertToUSD(amount: number, currency: string, rates?: Record<string, number>): number {
  const rate = (rates || FALLBACK_RATES)[currency] || 1
  return amount * rate
}

export function convertFromUSD(amountUSD: number, targetCurrency: string, rates?: Record<string, number>): number {
  const rate = (rates || FALLBACK_RATES)[targetCurrency] || 1
  return amountUSD / rate
}

export function formatAsUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
