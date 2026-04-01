'use client'

import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'
import { BalanceCard } from './balance-card'
import { TransactionList } from './transaction-list'
import { AddTransaction } from './add-transaction'
import { BottomNav } from './bottom-nav'
import { motion, AnimatePresence } from 'framer-motion'

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { activeTab } = useFinanceStore()

  return (
    <div className="flex h-screen flex-col bg-background safe-top overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="flex-1 overflow-y-auto safe-bottom px-5 pt-8 pb-2"
            {...pageTransition}
          >
            {/* Greeting */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <p className="text-hint text-sm mb-1">
                {user?.username || 'Пользователь'}
              </p>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Мои финансы
              </h1>
            </motion.div>

            <BalanceCard userId={user!.id} currency={user?.currency || 'RUB'} />

            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-hint">
                Последние операции
              </h2>
              <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={10} />
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'add' && (
          <motion.div
            key="add"
            className="flex-1 overflow-y-auto safe-bottom px-5 pt-8 pb-2"
            {...pageTransition}
          >
            <motion.h1
              className="mb-6 text-2xl font-semibold text-foreground tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Новая операция
            </motion.h1>
            <AddTransaction userId={user!.id} />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            className="flex-1 overflow-y-auto safe-bottom px-5 pt-8 pb-2"
            {...pageTransition}
          >
            <motion.h1
              className="mb-6 text-2xl font-semibold text-foreground tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
