import { db, accounts } from '@fast-finance/db'
import { eq, and, sql, asc, isNull } from 'drizzle-orm'
import type { IAccountRepository } from '../../domain/interfaces/account-repository.interface'
import type { Account, AccountCreateInput, AccountUpdateInput } from '../../domain/entities/account.entity'
import { toAccount } from '../../domain/entities/account.entity'
import { NotFoundError } from '../../domain/errors/domain-errors'

export class DrizzleAccountRepository implements IAccountRepository {
  async findById(id: number, userId: number): Promise<Account | null> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1)

    return account ? toAccount(account) : null
  }

  async findByUserId(userId: number, limit = 100, offset = 0): Promise<Account[]> {
    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .orderBy(asc(accounts.sortOrder), asc(accounts.id))
      .limit(limit)
      .offset(offset)

    return result.map(toAccount)
  }

  async create(userId: number, input: AccountCreateInput): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({
        userId,
        name: input.name,
        balance: input.balance ?? 0,
        currency: input.currency ?? 'RUB',
        type: input.type ?? 'checking',
      })
      .returning()

    return toAccount(account)
  }

  async update(id: number, userId: number, input: AccountUpdateInput): Promise<Account> {
    const [updated] = await db
      .update(accounts)
      .set(input)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .returning()

    if (!updated) throw new NotFoundError('Account not found')
    return toAccount(updated)
  }

  async delete(id: number, userId: number): Promise<void> {
    // Soft delete
    const [deleted] = await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .returning()

    if (!deleted) throw new NotFoundError('Account not found')
  }

  async updateBalance(id: number, userId: number, delta: number): Promise<void> {
    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${delta}` })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
  }
}

export const accountRepository = new DrizzleAccountRepository()
