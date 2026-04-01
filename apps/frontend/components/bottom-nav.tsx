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
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'hsla(240, 8%, 5%, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid hsl(var(--border))',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingBottom: 'calc(0.5rem + var(--tg-safe-area-inset-bottom, 0px))',
      }}>
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '0.75rem',
                paddingBottom: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                WebkitAppearance: 'none',
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '1.5rem',
                    height: '2px',
                    borderRadius: '1px',
                    backgroundColor: 'hsl(var(--primary))',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <Icon
                size={22}
                color={isActive ? 'hsl(76, 100%, 66%)' : 'hsl(260, 4%, 40%)'}
                style={{ transition: 'color 150ms ease' }}
              />
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 500,
                marginTop: '0.25rem',
                letterSpacing: '0.04em',
                color: isActive ? 'hsl(76, 100%, 66%)' : 'hsl(260, 4%, 40%)',
                opacity: isActive ? 1 : 0.7,
                transition: 'color 150ms ease, opacity 150ms ease',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
