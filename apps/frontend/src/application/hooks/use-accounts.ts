import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../infrastructure/api/client'
import type { Account, AccountCreateInput, AccountUpdateInput } from '../../domain/types/account'

export function useAccounts(userId: number | null) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.accounts.list(userId)
      setAccounts(data as Account[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = useCallback(async (input: AccountCreateInput) => {
    if (!userId) throw new Error('Not authenticated')
    const account = await apiClient.accounts.create(input, userId)
    setAccounts(prev => [...prev, account as Account])
    return account as Account
  }, [userId])

  const updateAccount = useCallback(async (id: number, input: AccountUpdateInput) => {
    if (!userId) throw new Error('Not authenticated')
    const account = await apiClient.accounts.update(id, input, userId)
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...input } : a))
    return account as Account
  }, [userId])

  const deleteAccount = useCallback(async (id: number) => {
    if (!userId) throw new Error('Not authenticated')
    await apiClient.accounts.delete(id, userId)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }, [userId])

  return { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount }
}