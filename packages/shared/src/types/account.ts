export type Currency = 'RUB' | 'BYN' | 'USD'

export interface Account {
  id: number
  userId: number
  name: string
  balance: number
  currency: Currency
}

export interface CreateAccountDto {
  name: string
  balance?: number
  currency?: Currency
}

export interface UpdateAccountDto {
  name?: string
  balance?: number
  currency?: Currency
}
