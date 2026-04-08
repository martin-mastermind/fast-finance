import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'RUB'): string {
  const absAmount = Math.abs(amount)
  const formatted = absAmount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const sign = amount < 0 ? '-' : ''

  if (currency === 'BYN') {
    return `${sign}${formatted} Br`
  }
  if (currency === 'USD') {
    return `${sign}$${formatted}`
  }
  if (currency === 'RUB') {
    return `${sign}${formatted} ₽`
  }
  return `${sign}${formatted} ${currency}`
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}
