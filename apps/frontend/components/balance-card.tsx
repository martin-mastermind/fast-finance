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
      className="relative rounded-3xl overflow-hidden p-6 shadow-2xl"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
    >
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600" />

      {/* Accent gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-cyan-500/10" />

      {/* Animated shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-purple-400 to-indigo-500 opacity-0 blur-xl"
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 text-white">
        <motion.p
          className="mb-2 text-sm font-medium opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Общий баланс
        </motion.p>
        {isLoading ? (
          <motion.div
            className="h-12 w-48 rounded-lg bg-white/15 backdrop-blur-sm"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <motion.p
            className="text-5xl font-bold tracking-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            {formatCurrency(displayBalance, currency)}
          </motion.p>
        )}

        {/* Account list with enhanced styling */}
        <motion.div
          className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-6 px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {accounts?.map((account, idx) => (
            <motion.div
              key={account.id}
              className="flex-shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.08, type: 'spring', stiffness: 120 }}
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
              whileTap={{ scale: 0.95 }}
            >
              <p className="text-xs font-medium opacity-80">{account.name}</p>
              <p className="text-sm font-bold mt-1.5 drop-shadow">{formatCurrency(account.balance, currency)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
