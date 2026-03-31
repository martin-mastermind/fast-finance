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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-md">
      <div className="flex" style={{ paddingBottom: 'var(--tg-safe-area-inset-bottom, 0px)' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-1 flex-col items-center py-3 text-xs"
          >
            {activeTab === id && (
              <motion.div
                className="absolute inset-0 bg-primary/10"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon
              size={22}
              className={activeTab === id ? 'text-primary' : 'text-hint'}
            />
            <span className={activeTab === id ? 'text-primary font-medium' : 'text-hint'}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
