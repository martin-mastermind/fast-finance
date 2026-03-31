import { create } from 'zustand'

interface FinanceStore {
  activeTab: 'dashboard' | 'add' | 'history'
  setActiveTab: (tab: 'dashboard' | 'add' | 'history') => void
  selectedAccountId: number | null
  setSelectedAccountId: (id: number | null) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
}))
