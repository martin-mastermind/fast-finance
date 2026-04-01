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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-primary/10 glass">
      <div className="flex px-2 pb-1" style={{ paddingBottom: 'calc(1rem + var(--tg-safe-area-inset-bottom, 0px))' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-1 flex-col items-center py-3.5 text-xs rounded-xl transition-colors hover:text-primary"
          >
            {activeTab === id && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            <motion.div
              animate={{ scale: activeTab === id ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10"
            >
              {activeTab === id && (
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-xl blur-lg -z-10"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <Icon
                size={22}
                className={`transition-colors duration-300 ${
                  activeTab === id ? 'text-primary drop-shadow-lg' : 'text-muted-foreground'
                }`}
              />
            </motion.div>

            <motion.span
              className={`mt-1.5 text-xs font-semibold transition-colors duration-300 relative z-10 ${
                activeTab === id ? 'text-primary' : 'text-muted-foreground'
              }`}
              animate={{ scale: activeTab === id ? 1 : 0.9, opacity: activeTab === id ? 1 : 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {label}
            </motion.span>
          </button>
        ))}
      </div>
    </nav>
  )
}
