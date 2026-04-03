'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { convertFromUSD } from '@/lib/currency'

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  RUB: 0.0115,
  BYN: 0.31,
}
import { motion } from 'framer-motion'
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'

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
  const api = createApiClient(userId)
  const [activePeriod, setActivePeriod] = useState('month')

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-stats', userId, activePeriod, currency],
    queryFn: () => api.transactions.getStats(activePeriod),
  })

  const convertAmount = (amount: number) => {
    const usdAmount = amount * FALLBACK_RATES.RUB
    return convertFromUSD(usdAmount, currency)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '200px' }} />
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
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: 'var(--bg-elevated)',
        padding: '0.25rem',
        borderRadius: '0.75rem',
      }}>
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
              border: 'none',
              background: activePeriod === p.id ? 'var(--accent)' : 'transparent',
              color: activePeriod === p.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              WebkitAppearance: 'none',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <motion.div
          className="glass-card"
          style={{ flex: 1, padding: '1rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <MdTrendingUp size={16} color="var(--green)" />
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
            <MdTrendingDown size={16} color="var(--red)" />
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

