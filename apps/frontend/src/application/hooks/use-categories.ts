import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../infrastructure/api/client'
import type { Category, CategoryCreateInput } from '../../domain/types/category'

export function useCategories(userId: number | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.categories.list(userId)
      setCategories(data as Category[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = useCallback(async (input: CategoryCreateInput) => {
    if (!userId) throw new Error('Not authenticated')
    const category = await apiClient.categories.create(input, userId)
    setCategories(prev => [...prev, category as Category])
    return category as Category
  }, [userId])

  const deleteCategory = useCallback(async (id: number) => {
    if (!userId) throw new Error('Not authenticated')
    await apiClient.categories.delete(id, userId)
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [userId])

  return { categories, loading, error, fetchCategories, createCategory, deleteCategory }
}