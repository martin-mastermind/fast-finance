import { describe, it, expect, beforeEach } from 'bun:test'
import { useFinanceStore } from '../../store/finance'

describe('useFinanceStore', () => {
  beforeEach(() => {
    const store = useFinanceStore.getState()
    store.setActiveTab('dashboard')
    store.setSelectedAccountId(null)
  })

  it('initial activeTab is dashboard', () => {
    expect(useFinanceStore.getState().activeTab).toBe('dashboard')
  })

  it('setActiveTab switches to add', () => {
    useFinanceStore.getState().setActiveTab('add')
    expect(useFinanceStore.getState().activeTab).toBe('add')
  })

  it('setActiveTab switches to history', () => {
    useFinanceStore.getState().setActiveTab('history')
    expect(useFinanceStore.getState().activeTab).toBe('history')
  })

  it('selectedAccountId is null initially', () => {
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })

  it('setSelectedAccountId stores account id', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    expect(useFinanceStore.getState().selectedAccountId).toBe(5)
  })

  it('setSelectedAccountId accepts null', () => {
    useFinanceStore.getState().setSelectedAccountId(5)
    useFinanceStore.getState().setSelectedAccountId(null)
    expect(useFinanceStore.getState().selectedAccountId).toBeNull()
  })
})
