import type { Transaction, TransactionCreateInput, TransactionUpdateInput, TransferInput, TransactionStats } from '../entities/transaction.entity'

export interface ITransactionRepository {
  findByUserId(userId: number, limit: number, offset: number): Promise<{ items: Transaction[]; total: number }>
  findById(id: string, userId: number): Promise<Transaction | null>
  create(userId: number, input: TransactionCreateInput): Promise<Transaction>
  update(id: string, userId: number, input: TransactionUpdateInput): Promise<Transaction>
  delete(id: string, userId: number): Promise<Transaction>
  getStats(userId: number, period: string): Promise<TransactionStats>
  transfer(userId: number, input: TransferInput, fromAccountName: string, toAccountName: string): Promise<Transaction>
}