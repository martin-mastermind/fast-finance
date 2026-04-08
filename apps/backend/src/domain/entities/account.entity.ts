import type { Account as DbAccount } from '@fast-finance/db'

export type Currency = 'RUB' | 'BYN' | 'USD'
export type AccountType = 'checking' | 'savings'

export interface Account {
  id: number
  userId: number
  name: string
  balance: number
  currency: Currency
  sortOrder: number
  type: AccountType
}

export interface AccountCreateInput {
  name: string
  balance?: number
  currency?: Currency
  type?: AccountType
}

export interface AccountUpdateInput {
  name?: string
  balance?: number
  currency?: Currency
  sortOrder?: number
  type?: AccountType
}

export function toAccount(dbAccount: DbAccount): Account {
  return {
    id: dbAccount.id,
    userId: dbAccount.userId,
    name: dbAccount.name,
    balance: Number(dbAccount.balance),
    currency: dbAccount.currency as Currency,
    sortOrder: dbAccount.sortOrder,
    type: (dbAccount.type ?? 'checking') as AccountType,
  }
}