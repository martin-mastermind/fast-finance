'use client'

import { useFinanceStore } from '@/store/finance'
import { MdHome, MdAdd, MdHistory } from 'react-icons/md'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'dashboard' as const, icon: MdHome, label: 'Главная' },
  { id: 'add' as const, icon: MdAdd, label: 'Добавить' },
  { id: 'history' as const, icon: MdHistory, label: 'История' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore()

  return (
    <nav className="glass-card" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 0,
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      background: 'var(--bg-card)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
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
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  style={{
                    position: 'absolute',
                    top: '0.25rem',
                    left: 'calc(50% - 1rem)',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    opacity: 0.15,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <Icon
                size={22}
                color={isActive ? 'var(--accent)' : 'var(--text-muted)'}
                style={{ transition: 'color 150ms ease', position: 'relative', zIndex: 1 }}
              />
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 500,
                marginTop: '0.25rem',
                letterSpacing: '0.04em',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 150ms ease',
                position: 'relative',
                zIndex: 1,
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
