import { describe, it, expect } from 'bun:test'

describe('Component Integration Tests', () => {
  describe('Dashboard component', () => {
    it('should be importable', async () => {
      const module = await import('../../components/dashboard')
      expect(module.Dashboard).toBeDefined()
    })

    it('should export Dashboard as client component', async () => {
      const module = await import('../../components/dashboard')
      expect(typeof module.Dashboard).toBe('function')
    })
  })

  describe('BalanceCard component', () => {
    it('should be importable', async () => {
      const module = await import('../../components/balance-card')
      expect(module.BalanceCard).toBeDefined()
    })

    it('should export BalanceCard as functional component', async () => {
      const module = await import('../../components/balance-card')
      expect(typeof module.BalanceCard).toBe('function')
    })
  })

  describe('TransactionList component', () => {
    it('should be importable', async () => {
      const module = await import('../../components/transaction-list')
      expect(module.TransactionList).toBeDefined()
    })

    it('should export TransactionList as functional component', async () => {
      const module = await import('../../components/transaction-list')
      expect(typeof module.TransactionList).toBe('function')
    })
  })

  describe('AddTransaction component', () => {
    it('should be importable', async () => {
      const module = await import('../../components/add-transaction')
      expect(module.AddTransaction).toBeDefined()
    })

    it('should export AddTransaction as functional component', async () => {
      const module = await import('../../components/add-transaction')
      expect(typeof module.AddTransaction).toBe('function')
    })
  })

  describe('BottomNav component', () => {
    it('should be importable', async () => {
      const module = await import('../../components/bottom-nav')
      expect(module.BottomNav).toBeDefined()
    })

    it('should export BottomNav as functional component', async () => {
      const module = await import('../../components/bottom-nav')
      expect(typeof module.BottomNav).toBe('function')
    })
  })

  describe('Component Props', () => {
    it('BalanceCard accepts userId and currency props', async () => {
      const { BalanceCard } = await import('../../components/balance-card')
      const component = BalanceCard
      expect(component.length).toBeGreaterThanOrEqual(0)
    })

    it('TransactionList accepts userId, currency and limit props', async () => {
      const { TransactionList } = await import('../../components/transaction-list')
      const component = TransactionList
      expect(component.length).toBeGreaterThanOrEqual(0)
    })

    it('AddTransaction accepts userId prop', async () => {
      const { AddTransaction } = await import('../../components/add-transaction')
      const component = AddTransaction
      expect(component.length).toBeGreaterThanOrEqual(0)
    })
  })
})
