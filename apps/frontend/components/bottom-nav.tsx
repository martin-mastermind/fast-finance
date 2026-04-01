'use client'

import { useFinanceStore } from '@/store/finance'
import { MdHome, MdAddBox, MdHistory } from 'react-icons/md'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'dashboard' as const, icon: MdHome, label: 'Главная' },
  { id: 'add' as const, icon: MdAddBox, label: 'Добавить' },
  { id: 'history' as const, icon: MdHistory, label: 'История' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-primary/10 glass">
      <div className="flex px-1 pb-1" style={{ paddingBottom: 'calc(1rem + var(--tg-safe-area-inset-bottom, 0px))' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-1 flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 group hover:bg-primary/5 active:bg-primary/10"
          >
            {activeTab === id && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/5"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              />
            )}

            {activeTab === id && (
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-gradient-to-r from-primary/0 via-primary to-accent/0"
                layoutId="activeIndicator"
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              />
            )}

            <motion.div
              animate={{ scale: activeTab === id ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative z-10 mb-1"
            >
              <Icon
                size={28}
                className={`transition-all duration-300 ${
                  activeTab === id
                    ? 'text-primary drop-shadow-lg'
                    : 'text-muted-foreground group-hover:text-primary/70'
                }`}
              />
            </motion.div>

            <motion.span
              className={`text-xs font-medium transition-colors duration-300 relative z-10 tracking-tight ${
                activeTab === id ? 'text-primary' : 'text-muted-foreground'
              }`}
              animate={{
                scale: activeTab === id ? 1 : 0.9,
                opacity: activeTab === id ? 1 : 0.75,
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              {label}
            </motion.span>
          </button>
        ))}
      </div>
    </nav>
  )
}
