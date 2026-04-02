'use client'

import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  userId: number
  currency: string
}

export function BalanceCard({ userId, currency }: Props) {
  const api = createApiClient(userId)
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api.accounts.list(),
  })

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0
  const [displayBalance, setDisplayBalance] = useState(0)

  useEffect(() => {
    if (isLoading) return
    const start = displayBalance
    const end = totalBalance
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
  }, [totalBalance, isLoading])

  return (
    <motion.div
      className="surface p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
    >
      <p className="text-hint" style={{ fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
        Общий баланс
      </p>

      {isLoading ? (
        <div className="skeleton" style={{ height: '3rem', width: '12rem' }} />
      ) : (
        <motion.p
          style={{ fontWeight: 300, fontSize: '2.5rem', letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {formatCurrency(displayBalance, currency)}
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
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--secondary))',
                padding: '0.5rem 0.75rem',
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <p className="text-hint" style={{ fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {account.name}
              </p>
              <p style={{ fontWeight: 500, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))', marginTop: '0.15rem' }}>
                {formatCurrency(account.balance, currency)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
