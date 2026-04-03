'use client'

import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { convertToUSD, convertFromUSD } from '@/lib/currency'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MdVisibility } from 'react-icons/md'

interface Props {
  userId: number
  currency?: string
  onCurrencyChange?: (currency: string) => void
}

const CURRENCY_ORDER = ['USD', 'RUB', 'BYN']

const CURRENCY_LABELS: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  USD: '$',
}

export function BalanceCard({ userId, currency: userCurrency, onCurrencyChange }: Props) {
  const api = createApiClient(userId)
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api.accounts.list(),
  })

  const [displayBalance, setDisplayBalance] = useState(0)
  const mainCurrency = userCurrency || 'USD'

  useEffect(() => {
    if (isLoading || !accounts) return
    const totalUSD = accounts.reduce((sum, a) => sum + convertToUSD(a.balance, a.currency), 0)
    const totalInCurrency = convertFromUSD(totalUSD, mainCurrency)
    console.log('Balance effect:', { totalUSD, totalInCurrency, currency: mainCurrency, accountCount: accounts.length })
    
    const start = displayBalance || 0
    const end = totalInCurrency
    const diff = end - start
    const steps = 30
    const stepValue = diff / steps
    let current = 0

    const interval = setInterval(() => {
      current++
      setDisplayBalance(start + stepValue * current)
      if (current >= steps) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [accounts, isLoading, mainCurrency])

  const handleCurrencyCycle = () => {
    const currentIndex = CURRENCY_ORDER.indexOf(mainCurrency)
    const nextIndex = (currentIndex + 1) % CURRENCY_ORDER.length
    const nextCurrency = CURRENCY_ORDER[nextIndex]
    console.log('Currency cycle:', mainCurrency, '->', nextCurrency)
    onCurrencyChange?.(nextCurrency)
  }

  return (
    <motion.div
      className="glass-card-strong"
      style={{
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
    >
      {/* Accent glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '60%',
        height: '100%',
        background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top row: currency pill + label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative', zIndex: 10 }}>
        <motion.button
          onClick={handleCurrencyCycle}
          whileTap={{ scale: 0.92 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: 'var(--accent-dim)',
            borderRadius: '2rem',
            padding: '0.35rem 0.875rem',
            border: '1px solid var(--accent-glow)',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            touchAction: 'manipulation',
          }}
        >
          <MdVisibility size={13} color="var(--accent)" />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            {mainCurrency}
          </span>
        </motion.button>

        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          Общий баланс
        </p>
      </div>

      {/* Large balance */}
      {isLoading ? (
        <div className="skeleton" style={{ height: '3rem', width: '12rem' }} />
      ) : (
        <motion.p
          style={{
            fontWeight: 300,
            fontSize: '2.75rem',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {formatCurrency(displayBalance, mainCurrency)}
        </motion.p>
      )}

      {/* Account pills */}
      {accounts && accounts.length > 0 && (
        <motion.div
          className="no-scrollbar"
          style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {accounts.map((account, idx) => (
            <motion.div
              key={account.id}
              style={{
                flexShrink: 0,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
                padding: '0.5rem 0.75rem',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <p className="text-hint" style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {account.name} ({account.currency})
              </p>
              <p style={{ fontWeight: 500, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text)', marginTop: '0.15rem' }}>
                {formatCurrency(account.balance, account.currency)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
