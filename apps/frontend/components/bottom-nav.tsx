'use client'

import { useFinanceStore } from '@/store/finance'
import { Home, PlusCircle, History } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'dashboard' as const, icon: Home, label: 'Главная' },
  { id: 'add' as const, icon: PlusCircle, label: 'Добавить' },
  { id: 'history' as const, icon: History, label: 'История' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="flex px-2 pb-1" style={{ paddingBottom: 'calc(1rem + var(--tg-safe-area-inset-bottom, 0px))' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-1 flex-col items-center py-3 text-xs rounded-lg transition-colors"
          >
            {activeTab === id && (
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/15"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ scale: activeTab === id ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Icon
                size={22}
                className={`transition-colors ${activeTab === id ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </motion.div>
            <motion.span
              className={`mt-1 text-xs font-medium transition-colors ${
                activeTab === id ? 'text-primary' : 'text-muted-foreground'
              }`}
              animate={{ scale: activeTab === id ? 1 : 0.95 }}
            >
              {label}
            </motion.span>
          </button>
        ))}
      </div>
    </nav>
  )
}
