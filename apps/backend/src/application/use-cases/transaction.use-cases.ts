import type { ITransactionRepository } from '../interfaces/transaction-repository.interface'
import type { IAccountRepository } from '../interfaces/account-repository.interface'
import type { Transaction, TransactionCreateInput, TransferInput, TransactionStats } from '../entities/transaction.entity'
import { AccessDeniedError, NotFoundError, InsufficientFundsError } from '../../domain/errors/domain-errors'

export class TransactionUseCases {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async getTransactions(userId: number, limit: number, offset: number) {
    return this.transactionRepository.findByUserId(userId, limit, offset)
  }

  async getTransactionStats(userId: number, period: string): Promise<TransactionStats> {
    return this.transactionRepository.getStats(userId, period)
  }

  async createTransaction(userId: number, input: TransactionCreateInput): Promise<Transaction> {
    const account = await this.accountRepository.findById(input.accountId, userId)
    if (!account) throw new AccessDeniedError('Account not found or access denied')

    const transaction = await this.transactionRepository.create(userId, input)
    await this.accountRepository.updateBalance(input.accountId, userId, input.amount)
    return transaction
  }

  async deleteTransaction(userId: number, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id, userId)
    if (!transaction) throw new NotFoundError('Transaction not found')

    const deleted = await this.transactionRepository.delete(id, userId)
    await this.accountRepository.updateBalance(deleted.accountId, userId, -deleted.amount)
    return deleted
  }

  async transfer(userId: number, input: TransferInput): Promise<Transaction> {
    const fromAccount = await this.accountRepository.findById(input.fromAccountId, userId)
    if (!fromAccount) throw new AccessDeniedError('Source account not found or access denied')

    const toAccount = await this.accountRepository.findById(input.toAccountId, userId)
    if (!toAccount) throw new AccessDeniedError('Destination account not found or access denied')

    if (fromAccount.balance < input.amount) {
      throw new InsufficientFundsError('Insufficient funds in source account')
    }

    return this.transactionRepository.transfer(userId, input, fromAccount.name, toAccount.name)
  }
}
