'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { getCategoryIcon } from '@/lib/icon-map'
import { motion } from 'framer-motion'
import { MdTrendingUp, MdTrendingDown, MdPieChart } from 'react-icons/md'

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
    queryKey: ['transaction-stats', userId, activePeriod],
    queryFn: () => api.transactions.getStats(activePeriod),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '200px' }} />
      </div>
    )
  }

  if (!data) return null

  const maxExpense = Math.max(...data.expenseByCategory.map(c => c.amount), 1)

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
            +{formatCurrency(data.totalIncome, currency)}
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
            -{formatCurrency(data.totalExpense, currency)}
          </div>
        </motion.div>
      </div>

      {/* Expense breakdown */}
      {data.expenseByCategory.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '1.25rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
            <MdPieChart size={16} color="var(--accent)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
              Структура расходов
            </span>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.expenseByCategory.slice(0, 6).map((cat, idx) => (
              <div key={cat.categoryId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span>{getCategoryIcon(cat.categoryIcon)}</span>
                    {cat.categoryName}
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {formatCurrency(cat.amount, currency)} ({cat.percentage}%)
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'var(--bg-elevated)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    style={{
                      height: '100%',
                      background: 'var(--red)',
                      borderRadius: 3,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.amount / maxExpense) * 100}%` }}
                    transition={{ delay: 0.2 + idx * 0.05, duration: 0.4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Income breakdown */}
      {data.incomeByCategory.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '1.25rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
            <MdPieChart size={16} color="var(--green)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
              Структура доходов
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {data.incomeByCategory.map((cat, idx) => (
              <motion.div
                key={cat.categoryId}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--green-dim)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
              >
                <span>{cat.categoryIcon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--green)' }}>
                  {formatCurrency(cat.amount, currency)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

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

