'use client'

import { useFinanceStore } from '@/store/finance'
import { MdHome, MdHistory, MdSettings } from 'react-icons/md'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'dashboard' as const, icon: MdHome, label: 'Главная' },
  { id: 'history' as const, icon: MdHistory, label: 'История' },
  { id: 'settings' as const, icon: MdSettings, label: 'Настройки' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore()

  return (
    <nav className="glass-card-strong" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 0,
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: 'none',
    }}>
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--accent)',
        }}
        layoutId="navLine"
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />
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
                paddingTop: '0.875rem',
                paddingBottom: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                WebkitAppearance: 'none',
              }}
            >
              <Icon
                size={24}
                color={isActive ? 'var(--accent)' : 'var(--text-muted)'}
                style={{ transition: 'color 150ms ease' }}
              />
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 500,
                marginTop: '0.25rem',
                letterSpacing: '0.04em',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 150ms ease',
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
