export type Currency = 'RUB' | 'BYN' | 'USD'

export interface Account {
  id: number
  userId: number
  name: string
  balance: number
  currency: Currency
  createdAt: string | null
  updatedAt: string | null
}

export interface AccountCreateInput {
  name: string
  balance?: number
  currency?: Currency
}

export interface AccountUpdateInput {
  name?: string
  balance?: number
  currency?: Currency
}