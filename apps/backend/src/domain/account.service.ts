import { db, accounts } from '@fast-finance/db'
import { eq, and } from 'drizzle-orm'
import type { Account } from '@fast-finance/db'
import type { Currency } from '@fast-finance/shared'

export class AccessDeniedError extends Error {
  constructor(message = 'Access denied') { super(message); this.name = 'AccessDeniedError' }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') { super(message); this.name = 'NotFoundError' }
}

export const AccountService = {
  async getAccounts(userId: number): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.userId, userId))
  },

  async createAccount(userId: number, name: string, balance = 0, currency: Currency = 'RUB'): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({ userId, name, balance, currency })
      .returning()
    return account
  },

  async updateAccount(
    userId: number,
    id: number,
    data: { name?: string; balance?: number; currency?: Currency },
  ): Promise<Account> {
    const [updated] = await db
      .update(accounts)
      .set(data)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning()
    if (!updated) throw new NotFoundError('Account not found')
    return updated
  },

  async deleteAccount(userId: number, id: number): Promise<void> {
    const [deleted] = await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning()
    if (!deleted) throw new NotFoundError('Account not found')
  },
}
