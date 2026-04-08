'use client'

import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'
import { BalanceCard } from './balance-card'
import { TransactionList } from './transaction-list'
import { TransactionCharts } from './transaction-charts'
import { AddTransaction } from './add-transaction'
import { BottomNav } from './bottom-nav'
import { SettingsPanel } from './settings-panel'
import { AiAssistant } from './ai-assistant'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

const ACTION_BUTTONS = [
  { label: 'Доход', icon: Plus, color: 'var(--green)' },
  { label: 'Перевести', icon: ArrowLeftRight, color: '#F59E0B' },
  { label: 'Расход', icon: Minus, color: 'var(--red)' },
]

export function Dashboard() {
  const { user, setCurrency } = useAuthStore()
  const { activeTab, setActiveTab, setTransactionType, isAddModalOpen, setAddModalOpen, isAddCategoryModalOpen, setAddCategoryModalOpen } = useFinanceStore()

  return (
    <div className="safe-top" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', overflow: 'hidden', background: 'var(--bg)' }}>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            className="safe-bottom-70 no-scrollbar"
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveTab('settings')}
                  className="bg-[var(--bg-elevated)] border border-border"
                >
                  <Settings size={18} className="text-[var(--text-secondary)]" />
                </Button>
              </div>
            </motion.div>

            <BalanceCard key={user?.currency} userId={user!.id} currency={user?.currency || 'USD'} onCurrencyChange={setCurrency} />

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
                    if (label === 'Доход') setTransactionType('income')
                    else if (label === 'Расход') setTransactionType('expense')
                    else setTransactionType('transfer')
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
                <Button
                  variant="link"
                  className="text-primary text-[0.8125rem] font-medium p-0 h-auto"
                  onClick={() => setActiveTab('history')}
                >
                  Все
                </Button>
              </div>
              <TransactionList userId={user!.id} currency={user?.currency || 'USD'} limit={5} />
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            className="safe-bottom-70 no-scrollbar"
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

        {activeTab === 'ai' && (
          <motion.div
            key="ai"
            className="safe-bottom-70 no-scrollbar"
            style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <AiAssistant />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            className="safe-bottom-70 no-scrollbar"
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
      <Sheet open={isAddModalOpen} onOpenChange={setAddModalOpen}>
        <SheetContent
          side="bottom"
          className="glass-card-strong rounded-t-[var(--radius)] overflow-y-auto"
          style={{ maxHeight: '90vh', paddingBottom: 'calc(1.5rem + var(--tg-safe-area-inset-bottom, 0px))' }}
        >
          <SheetHeader>
            <SheetTitle>Новая операция</SheetTitle>
          </SheetHeader>
          <AddTransaction userId={user!.id} onClose={() => setAddModalOpen(false)} />
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  )
}
