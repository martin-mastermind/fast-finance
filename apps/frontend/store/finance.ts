import { create } from 'zustand'

interface FinanceStore {
  activeTab: 'dashboard' | 'history'
  setActiveTab: (tab: 'dashboard' | 'history') => void
  selectedAccountId: number | null
  setSelectedAccountId: (id: number | null) => void
  transactionType: 'income' | 'expense'
  setTransactionType: (type: 'income' | 'expense') => void
  isAddModalOpen: boolean
  setAddModalOpen: (open: boolean) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedAccountId: null,
  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  transactionType: 'expense',
  setTransactionType: (type) => set({ transactionType: type }),
  isAddModalOpen: false,
  setAddModalOpen: (open) => set({ isAddModalOpen: open }),
}))
