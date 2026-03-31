'use client'

import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

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

  return (
    <motion.div
      className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <p className="mb-1 text-sm opacity-80">Общий баланс</p>
      {isLoading ? (
        <div className="h-10 w-32 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <p className="text-4xl font-bold">{formatCurrency(totalBalance, currency)}</p>
      )}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {accounts?.map((account) => (
          <div
            key={account.id}
            className="flex-shrink-0 rounded-xl bg-white/10 px-3 py-2"
          >
            <p className="text-xs opacity-70">{account.name}</p>
            <p className="text-sm font-semibold">{formatCurrency(account.balance, currency)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
