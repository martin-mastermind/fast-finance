'use client'

import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'
import { BalanceCard } from './balance-card'
import { TransactionList } from './transaction-list'
import { AddTransaction } from './add-transaction'
import { BottomNav } from './bottom-nav'
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { activeTab } = useFinanceStore()

  return (
    <div className="safe-top" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'hsl(var(--background))' }}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="safe-bottom no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.25rem 0.5rem' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Greeting */}
            <motion.div
              style={{ marginBottom: '1.5rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <p className="text-hint" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                {user?.username || 'Пользователь'}
              </p>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
                Мои финансы
              </h1>
            </motion.div>

            <BalanceCard userId={user!.id} currency={user?.currency || 'RUB'} />

            <motion.div
              style={{ marginTop: '2rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-hint" style={{ marginBottom: '1rem', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Последние операции
              </h2>
              <TransactionList userId={user!.id} currency={user?.currency || 'RUB'} limit={10} />
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'add' && (
          <motion.div
            key="add"
            className="safe-bottom no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.25rem 0.5rem' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.h1
              style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}
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
            className="safe-bottom no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.25rem 0.5rem' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.h1
              style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}
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
