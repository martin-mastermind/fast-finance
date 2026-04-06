import type { Account as DbAccount } from '@fast-finance/db'

export type Currency = 'RUB' | 'BYN' | 'USD'

export interface Account {
  id: number
  userId: number
  name: string
  balance: number
  currency: Currency
  createdAt: Date | null
  updatedAt: Date | null
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

export function toAccount(dbAccount: DbAccount): Account {
  return {
    id: dbAccount.id,
    userId: dbAccount.userId,
    name: dbAccount.name,
    balance: Number(dbAccount.balance),
    currency: dbAccount.currency as Currency,
    createdAt: dbAccount.createdAt,
    updatedAt: dbAccount.updatedAt,
  }
}