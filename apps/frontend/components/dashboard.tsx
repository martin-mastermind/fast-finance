'use client'

import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'
import { BalanceCard } from './balance-card'
import { TransactionList } from './transaction-list'
import { AddTransaction } from './add-transaction'
import { BottomNav } from './bottom-nav'
import { motion, AnimatePresence } from 'framer-motion'

export function Dashboard() {
  const { user } = useAuthStore()
  const { activeTab } = useFinanceStore()

  return (
    <div className="flex h-screen flex-col bg-background safe-top">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-4">
              <p className="text-sm text-hint">Привет, {user?.username || 'Пользователь'} 👋</p>
              <h1 className="text-2xl font-bold">Мои финансы</h1>
            </div>
            <BalanceCard userId={user!.id} currency={user?.currency || 'RUB'} />
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Последние операции</h2>
              <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={10} />
            </div>
          </motion.div>
        )}

        {activeTab === 'add' && (
          <motion.div
            key="add"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="mb-4 text-2xl font-bold">Новая операция</h1>
            <AddTransaction userId={user!.id} />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h1 className="mb-4 text-2xl font-bold">История</h1>
            <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
