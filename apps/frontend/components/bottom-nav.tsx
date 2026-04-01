'use client'

import { useFinanceStore } from '@/store/finance'
import { MdHome, MdAdd, MdReceipt } from 'react-icons/md'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'dashboard' as const, icon: MdHome, label: 'Главная' },
  { id: 'add' as const, icon: MdAdd, label: 'Добавить' },
  { id: 'history' as const, icon: MdReceipt, label: 'История' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <div
        className="flex items-center"
        style={{ paddingBottom: 'calc(0.5rem + var(--tg-safe-area-inset-bottom, 0px))' }}
      >
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-1 flex-col items-center pt-3 pb-2 transition-colors duration-150"
          >
            <motion.div
              animate={{
                color: activeTab === id ? 'hsl(76 100% 66%)' : 'hsl(260 4% 40%)',
              }}
              transition={{ duration: 0.15 }}
            >
              <Icon size={24} />
            </motion.div>

            <motion.span
              className="text-[10px] font-medium mt-1 tracking-wide"
              animate={{
                color: activeTab === id ? 'hsl(76 100% 66%)' : 'hsl(260 4% 40%)',
                opacity: activeTab === id ? 1 : 0.6,
              }}
              transition={{ duration: 0.15 }}
            >
              {label}
            </motion.span>

            {/* Active dot indicator */}
            {activeTab === id && (
              <motion.div
                className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                layoutId="navIndicator"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
