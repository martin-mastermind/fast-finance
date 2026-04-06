import { describe, it, expect } from 'vitest'
import type { Category, CategoryCreateInput } from '../../src/domain/types/category'

describe('Category Types', () => {
  const validCategory: Category = {
    id: 1,
    name: 'Еда',
    icon: '🍕',
    type: 'expense',
    userId: null,
  }

  it('valid category structure', () => {
    expect(validCategory.id).toBe(1)
    expect(validCategory.name).toBe('Еда')
    expect(validCategory.icon).toBe('🍕')
  })

  it('valid category types', () => {
    const expenseCategory: Category = { ...validCategory, type: 'expense' }
    const incomeCategory: Category = { ...validCategory, type: 'income' }
    const transferCategory: Category = { ...validCategory, type: 'transfer' }

    expect(expenseCategory.type).toBe('expense')
    expect(incomeCategory.type).toBe('income')
    expect(transferCategory.type).toBe('transfer')
  })

  it('valid create input', () => {
    const input: CategoryCreateInput = {
      name: 'Развлечения',
      icon: '🎮',
      type: 'expense',
    }

    expect(input.name).toBe('Развлечения')
    expect(input.type).toBe('expense')
  })

  it('user category with userId', () => {
    const userCategory: Category = {
      ...validCategory,
      userId: 1,
    }

    expect(userCategory.userId).toBe(1)
  })
})
