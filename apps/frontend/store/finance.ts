import { create } from 'zustand'

interface FinanceStore {
  activeTab: 'dashboard' | 'history' | 'ai' | 'settings'
  setActiveTab: (tab: 'dashboard' | 'history' | 'ai' | 'settings') => void
  selectedAccountId: number | null
  setSelectedAccountId: (id: number | null) => void
  transactionType: 'income' | 'expense' | 'transfer'
  setTransactionType: (type: 'income' | 'expense' | 'transfer') => void
  isAddModalOpen: boolean
  setAddModalOpen: (open: boolean) => void
  isAddCategoryModalOpen: boolean
  setAddCategoryModalOpen: (open: boolean) => void
  isPlanLimitModalOpen: boolean
  setPlanLimitModalOpen: (open: boolean) => void
  isPlansScreenOpen: boolean
  setIsPlansScreenOpen: (open: boolean) => void
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
  isAddCategoryModalOpen: false,
  setAddCategoryModalOpen: (open) => set({ isAddCategoryModalOpen: open }),
  isPlanLimitModalOpen: false,
  setPlanLimitModalOpen: (open) => set({ isPlanLimitModalOpen: open }),
  isPlansScreenOpen: false,
  setIsPlansScreenOpen: (open) => set({ isPlansScreenOpen: open }),
}))
