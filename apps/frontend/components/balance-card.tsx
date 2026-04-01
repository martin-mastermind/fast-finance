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
      {/* Accent top line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />

      <p className="text-xs font-medium uppercase tracking-widest text-hint mb-3">
        Общий баланс
      </p>

      {isLoading ? (
        <div className="skeleton h-12 w-48" />
      ) : (
        <motion.p
          className="font-display italic text-5xl tracking-tight text-foreground leading-none"
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
          className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {accounts.map((account, idx) => (
            <motion.div
              key={account.id}
              className="flex-shrink-0 rounded-lg border border-border bg-secondary px-3 py-2 transition-colors duration-200 hover:border-muted-foreground"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-hint">{account.name}</p>
              <p className="text-sm font-display italic text-foreground mt-0.5">{formatCurrency(account.balance, currency)}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
