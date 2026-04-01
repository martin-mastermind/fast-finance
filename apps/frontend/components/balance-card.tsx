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

  // Animate balance counter
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
    }, 20)

    return () => clearInterval(interval)
  }, [totalBalance, isLoading])

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden p-6 shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 text-primary-foreground">
        <p className="mb-1 text-sm opacity-90">Общий баланс</p>
        {isLoading ? (
          <motion.div
            className="h-10 w-40 rounded-lg bg-white/20"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        ) : (
          <motion.p
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {formatCurrency(displayBalance, currency)}
          </motion.p>
        )}

        {/* Account list */}
        <motion.div
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {accounts?.map((account, idx) => (
            <motion.div
              key={account.id}
              className="flex-shrink-0 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm border border-white/10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <p className="text-xs opacity-80">{account.name}</p>
              <p className="text-sm font-semibold mt-1">{formatCurrency(account.balance, currency)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
