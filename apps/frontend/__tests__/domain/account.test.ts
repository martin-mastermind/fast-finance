import { describe, it, expect } from 'vitest'
import type { Account, AccountCreateInput, AccountUpdateInput } from '../../src/domain/types/account'

describe('Account Types', () => {
  const validAccount: Account = {
    id: 1,
    userId: 1,
    name: 'Тестовая карта',
    balance: 10000,
    currency: 'RUB',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  it('valid account structure', () => {
    expect(validAccount.id).toBe(1)
    expect(validAccount.name).toBe('Тестовая карта')
    expect(validAccount.currency).toBe('RUB')
  })

  it('valid currency types', () => {
    const rubAccount: Account = { ...validAccount, currency: 'RUB' }
    const bynAccount: Account = { ...validAccount, currency: 'BYN' }
    const usdAccount: Account = { ...validAccount, currency: 'USD' }

    expect(rubAccount.currency).toBe('RUB')
    expect(bynAccount.currency).toBe('BYN')
    expect(usdAccount.currency).toBe('USD')
  })

  it('valid create input', () => {
    const input: AccountCreateInput = {
      name: 'Новый счёт',
      balance: 5000,
      currency: 'RUB',
    }

    expect(input.name).toBe('Новый счёт')
    expect(input.balance).toBe(5000)
    expect(input.currency).toBe('RUB')
  })

  it('valid update input', () => {
    const input: AccountUpdateInput = {
      name: 'Обновлённое имя',
      balance: 15000,
    }

    expect(input.name).toBe('Обновлённое имя')
    expect(input.balance).toBe(15000)
  })

  it('nullable dates', () => {
    const account: Account = {
      ...validAccount,
      createdAt: null,
      updatedAt: null,
    }

    expect(account.createdAt).toBeNull()
    expect(account.updatedAt).toBeNull()
  })
})
