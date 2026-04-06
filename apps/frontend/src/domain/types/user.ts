import type { Currency } from './account'

export interface User {
  id: number
  telegramId: string
  username: string | null
  currency: Currency
}

export interface AuthResponse {
  user: User
}