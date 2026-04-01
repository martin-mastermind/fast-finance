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
    <div className="flex h-screen flex-col bg-background safe-top overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-6 pb-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm font-medium text-hint mb-1">
                Привет, {user?.username || 'Пользователь'} 👋
              </p>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Мои финансы
              </h1>
            </motion.div>

            <BalanceCard userId={user!.id} currency={user?.currency || 'RUB'} />

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-4 text-xl font-semibold text-foreground">Последние операции</h2>
              <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={10} />
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'add' && (
          <motion.div
            key="add"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-6 pb-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <motion.h1
              className="mb-6 text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Новая операция
            </motion.h1>
            <AddTransaction userId={user!.id} />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            className="flex-1 overflow-y-auto safe-bottom px-4 pt-6 pb-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <motion.h1
              className="mb-6 text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              История
            </motion.h1>
            <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={100} />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
