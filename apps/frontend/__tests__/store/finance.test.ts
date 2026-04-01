import { describe, it, expect, beforeEach } from 'bun:test'
import { useFinanceStore } from '../../store/finance'

describe('useFinanceStore — activeTab', () => {
  beforeEach(() => {
    const store = useFinanceStore.getState()
    store.setActiveTab('dashboard')
  })

  it('initializes with dashboard tab', () => {
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })

  it('switches to add tab', () => {
    useFinanceStore.getState().setActiveTab('add')
    expect(useFinanceStore.getState().activeTab).toBe('add')
  })

  it('switches to history tab', () => {
    useFinanceStore.getState().setActiveTab('history')
    expect(useFinanceStore.getState().activeTab).toBe('history')
  })

  it('allows switching back to dashboard', () => {
    useFinanceStore.getState().setActiveTab('add')
    expect(useFinanceStore.getState().activeTab).toBe('add')
    useFinanceStore.getState().setActiveTab('dashboard')
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })

  it('handles rapid tab switches', () => {
    useFinanceStore.getState().setActiveTab('add')
    useFinanceStore.getState().setActiveTab('history')
    useFinanceStore.getState().setActiveTab('dashboard')
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })
})

describe('useFinanceStore — selectedAccountId', () => {
  beforeEach(() => {
    const store = useFinanceStore.getState()
    store.setSelectedAccountId(null)
  })

  it('initializes with null selectedAccountId', () => {
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })

  it('stores numeric account id', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)
  })

  it('stores different account ids', () => {
    useFinanceStore.getState().setSelectedAccountId(1)
    expect(useFinanceStore.getState().selectedAccountId).toBe(1)
    useFinanceStore.getState().setSelectedAccountId(10)
    expect(useFinanceStore.getState().selectedAccountId).toBe(10)
  })

  it('allows setting to null', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)
    useFinanceStore.getState().setSelectedAccountId(null)
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })

  it('handles zero as valid id', () => {
    useFinanceStore.getState().setSelectedAccountId(0)
    expect(useFinanceStore.getState().selectedAccountId).toBe(0)
  })
})

describe('useFinanceStore — state isolation', () => {
  it('activeTab and selectedAccountId are independent', () => {
    useFinanceStore.getState().setActiveTab('add')
    useFinanceStore.getState().setSelectedAccountId(5)
    expect(useFinanceStore.getState().activeTab).toBe('add')
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)

    useFinanceStore.getState().setActiveTab('history')
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)
  })

  it('changing selectedAccountId does not change activeTab', () => {
    useFinanceStore.getState().setActiveTab('dashboard')
    useFinanceStore.getState().setSelectedAccountId(3)
    useFinanceStore.getState().setSelectedAccountId(7)
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })
})

describe('useFinanceStore — persistence', () => {
  it('state persists between multiple accesses', () => {
    useFinanceStore.getState().setActiveTab('add')
    useFinanceStore.getState().setSelectedAccountId(42)

    const state1 = useFinanceStore.getState()
    const state2 = useFinanceStore.getState()

    expect(state1.activeTab).toBe(state2.activeTab)
    expect(state1.selectedAccountId).toBe(state2.selectedAccountId)
  })
})
