import { db, accounts } from '@fast-finance/db'
import { eq, and, sql } from 'drizzle-orm'
import type { ITransactionRepository } from '../interfaces/transaction-repository.interface'
import type { Transaction, TransactionCreateInput, TransferInput, TransactionStats } from '../entities/transaction.entity'
import { AccessDeniedError, NotFoundError } from '../../domain/errors/domain-errors'

export class TransactionUseCases {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async getTransactions(userId: number, limit: number, offset: number) {
    return this.transactionRepository.findByUserId(userId, limit, offset)
  }

  async getTransactionStats(userId: number, period: string): Promise<TransactionStats> {
    return this.transactionRepository.getStats(userId, period)
  }

  async createTransaction(userId: number, input: TransactionCreateInput): Promise<Transaction> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    if (!account) throw new AccessDeniedError('Account not found or access denied')

    const transaction = await this.transactionRepository.create(userId, input)

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${input.amount}` })
      .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, userId)))

    return transaction
  }

  async deleteTransaction(userId: number, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id, userId)
    if (!transaction) throw new NotFoundError('Transaction not found')

    const deleted = await this.transactionRepository.delete(id, userId)

    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${deleted.amount}` })
      .where(eq(accounts.id, deleted.accountId))

    return deleted
  }

  async transfer(userId: number, input: TransferInput): Promise<Transaction> {
    const [fromAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, userId)))

    if (!fromAccount) throw new AccessDeniedError('Source account not found or access denied')

    const [toAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, userId)))

    if (!toAccount) throw new AccessDeniedError('Destination account not found or access denied')

    return await db.transaction(async (dbTx) => {
      const [transaction] = await dbTx
        .insert(transactions)
        .values({
          userId,
          accountId: input.fromAccountId,
          categoryId: null,
          amount: input.amount,
          currency: input.currency,
          description: JSON.stringify({
            type: 'transfer',
            fromAccountId: input.fromAccountId,
            fromAccountName: fromAccount.name,
            toAccountId: input.toAccountId,
            toAccountName: toAccount.name,
            description: input.description || 'Перевод между счетами',
          }),
          date: new Date(),
        })
        .returning()

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${input.amount}` })
        .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, userId)))

      await dbTx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${input.amount}` })
        .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, userId)))

      return transaction
    }) as unknown as Transaction
  }
}