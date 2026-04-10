'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/utils'
import { convertFromUSD } from '@/lib/currency'

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  RUB: 0.0115,
  BYN: 0.31,
}
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  userId: number
  currency: string
}

const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

export function TransactionCharts({ userId, currency }: Props) {
  const { token } = useAuthStore()
  const api = createApiClient(token || '')
  const [activePeriod, setActivePeriod] = useState('month')

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-stats', userId, activePeriod, currency],
    queryFn: () => api.transactions.getStats(activePeriod),
  })

  const convertAmount = (amount: number) => {
    // Backend returns amounts in USD, convert to display currency
    return convertFromUSD(amount, currency)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[88px] w-full" />
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Period selector */}
      <Tabs value={activePeriod} onValueChange={setActivePeriod}>
        <TabsList className="w-full bg-[var(--bg-elevated)] rounded-[12px] p-1 h-auto gap-1">
          {PERIODS.map(p => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="flex-1 text-[0.8125rem] font-medium py-2 rounded-[8px] text-[var(--text-secondary)] data-active:bg-primary data-active:text-primary-foreground"
            >
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <motion.div
          className="glass-card"
          style={{ flex: 1, padding: '1rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} className="text-[var(--green)]" />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Доходы
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--green)' }}>
            +{formatCurrency(convertAmount(data.totalIncome), currency)}
          </div>
        </motion.div>

        <motion.div
          className="glass-card"
          style={{ flex: 1, padding: '1rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <TrendingDown size={16} className="text-[var(--red)]" />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Расходы
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--red)' }}>
            -{formatCurrency(convertAmount(data.totalExpense), currency)}
          </div>
        </motion.div>
      </div>



      {/* Empty state */}
      {data.expenseByCategory.length === 0 && data.incomeByCategory.length === 0 && (
        <motion.div
          style={{ padding: '2rem', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Нет данных за выбранный период
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

