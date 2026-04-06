import type { Transaction, TransactionCreateInput, TransactionStats } from '../entities/transaction.entity'

export interface ITransactionRepository {
  findByUserId(userId: number, limit: number, offset: number): Promise<{ items: Transaction[]; total: number }>
  findById(id: string, userId: number): Promise<Transaction | null>
  create(userId: number, input: TransactionCreateInput): Promise<Transaction>
  delete(id: string, userId: number): Promise<Transaction>
  getStats(userId: number, period: string): Promise<TransactionStats>
}