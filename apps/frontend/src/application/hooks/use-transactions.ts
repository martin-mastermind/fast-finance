import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '../../infrastructure/api/client'
import type { Transaction, TransactionCreateInput, TransferInput, TransactionStats, PaginatedTransactions } from '../../domain/types/transaction'

export function useTransactions(userId: number | null) {
  const [transactions, setTransactions] = useState<PaginatedTransactions | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTransactions = useCallback(async (limit = 50, offset = 0) => {
    if (!userId) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.transactions.list(userId, { limit, offset })
      setTransactions(data as PaginatedTransactions)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchStats = useCallback(async (period = 'month') => {
    if (!userId) return
    try {
      const data = await apiClient.transactions.getStats(userId, period)
      setStats(data as TransactionStats)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('Failed to fetch stats:', e)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchTransactions()
      fetchStats()
    }
    return () => {
      abortRef.current?.abort()
    }
  }, [userId, fetchTransactions, fetchStats])

  const createTransaction = useCallback(async (input: TransactionCreateInput) => {
    if (!userId) throw new Error('Not authenticated')
    const tx = await apiClient.transactions.create(input, userId)
    await fetchTransactions()
    return tx as Transaction
  }, [userId, fetchTransactions])

  const transfer = useCallback(async (input: TransferInput) => {
    if (!userId) throw new Error('Not authenticated')
    const tx = await apiClient.transactions.transfer(input, userId)
    await fetchTransactions()
    return tx as Transaction
  }, [userId, fetchTransactions])

  const deleteTransaction = useCallback(async (id: string) => {
    if (!userId) throw new Error('Not authenticated')
    await apiClient.transactions.delete(id, userId)
    await fetchTransactions()
  }, [userId, fetchTransactions])

  return { transactions, stats, loading, error, fetchTransactions, fetchStats, createTransaction, transfer, deleteTransaction }
}
