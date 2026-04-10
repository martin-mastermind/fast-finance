import type { IAccountRepository } from '../interfaces/account-repository.interface'
import type { Account, AccountCreateInput, AccountUpdateInput } from '../entities/account.entity'
import { AccessDeniedError } from '../../domain/errors/domain-errors'

export class AccountUseCases {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async getAccounts(userId: number, limit = 100, offset = 0): Promise<Account[]> {
    return this.accountRepository.findByUserId(userId, limit, offset)
  }

  async getAccountById(id: number, userId: number): Promise<Account> {
    const account = await this.accountRepository.findById(id, userId)
    if (!account) throw new AccessDeniedError('Account not found or access denied')
    return account
  }

  async createAccount(userId: number, input: AccountCreateInput): Promise<Account> {
    return this.accountRepository.create(userId, input)
  }

  async updateAccount(id: number, userId: number, input: AccountUpdateInput): Promise<Account> {
    return this.accountRepository.update(id, userId, input)
  }

  async deleteAccount(id: number, userId: number): Promise<void> {
    return this.accountRepository.delete(id, userId)
  }
}