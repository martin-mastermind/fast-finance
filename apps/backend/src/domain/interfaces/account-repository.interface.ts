import type { Account, AccountCreateInput, AccountUpdateInput } from '../entities/account.entity'

export interface IAccountRepository {
  findById(id: number, userId: number): Promise<Account | null>
  findByUserId(userId: number, limit?: number, offset?: number): Promise<Account[]>
  create(userId: number, input: AccountCreateInput): Promise<Account>
  update(id: number, userId: number, input: AccountUpdateInput): Promise<Account>
  delete(id: number, userId: number): Promise<void>
  updateBalance(id: number, userId: number, delta: number): Promise<void>
}