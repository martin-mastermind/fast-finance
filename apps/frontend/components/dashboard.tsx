'use client'

import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'
import { BalanceCard } from './balance-card'
import { TransactionList } from './transaction-list'
import { TransactionCharts } from './transaction-charts'
import { AddTransaction } from './add-transaction'
import { BottomNav } from './bottom-nav'
import { SettingsPanel } from './settings-panel'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSettings, MdAdd, MdRemove, MdClose } from 'react-icons/md'

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

const ACTION_BUTTONS = [
  { label: 'Доход', icon: MdAdd, color: 'var(--green)' },
  { label: 'Расход', icon: MdRemove, color: 'var(--red)' },
]

export function Dashboard() {
  const { user, setCurrency } = useAuthStore()
  const { activeTab, setActiveTab, setTransactionType, isAddModalOpen, setAddModalOpen, isAddCategoryModalOpen, setAddCategoryModalOpen } = useFinanceStore()

  return (
    <div className="safe-top" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
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
            {/* Header row */}
            <motion.div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <h1 style={{ fontSize: '1.375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Привет, {user?.username || 'Пользователь'}!
              </h1>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setActiveTab('settings')}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                  }}>
                  <MdSettings size={18} color="var(--text-secondary)" />
                </button>
              </div>
            </motion.div>

            <BalanceCard userId={user!.id} currency={user?.currency || 'USD'} onCurrencyChange={setCurrency} />

            {/* Action buttons */}
            <motion.div
              style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {ACTION_BUTTONS.map(({ label, icon: Icon, color }, i) => (
                <motion.button
                  key={label}
                  className="hover-lift"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '1rem 0.5rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setTransactionType(label === 'Доход' ? 'income' : 'expense')
                    setAddModalOpen(true)
                  }}
                >
                  {/* Subtle glow on hover */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 50% 30%, ${color}22 0%, transparent 60%)`,
                    opacity: 0,
                    transition: 'opacity 200ms ease',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${color}33`,
                  }}>
                    <Icon size={20} color="#050507" />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em' }}>
                    {label}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Latest transactions section */}
            <motion.div
              style={{ marginTop: '1.75rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
                  Последние операции
                </h2>
                <button
                  onClick={() => setActiveTab('history')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--accent)',
                    WebkitAppearance: 'none',
                    padding: 0,
                  }}
                >
                  Все
                </button>
              </div>
              <TransactionList userId={user!.id} currency={user?.currency || 'USD'} limit={5} />
            </motion.div>
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
              style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              История
            </motion.h1>
            <TransactionCharts userId={user!.id} currency={user?.currency || 'USD'} />
            <div style={{ marginTop: '1.5rem' }}>
              <TransactionList userId={user!.id} currency={user?.currency || 'USD'} limit={100} />
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            className="safe-bottom no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.25rem 0.5rem' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <motion.h1
              style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Настройки
            </motion.h1>
            <SettingsPanel userId={user!.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              zIndex: 1000,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddModalOpen(false)}
          >
            <motion.div
              style={{
                width: '100%',
                maxHeight: '90vh',
                backgroundColor: 'var(--bg)',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                padding: '1.5rem',
                paddingBottom: 'calc(1.5rem + var(--tg-safe-area-inset-bottom, 0px))',
                overflowY: 'auto',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                  Новая операция
                </h2>
                <button
                  onClick={() => setAddModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    WebkitAppearance: 'none',
                  }}
                >
                  <MdClose size={24} color="var(--text-secondary)" />
                </button>
              </div>
              <AddTransaction userId={user!.id} onClose={() => setAddModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
