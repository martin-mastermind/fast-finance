'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose, MdAccessTime } from 'react-icons/md'

interface Props {
  userId: number
  currency: string
  limit?: number
}

const AVATAR_COLORS = ['#2D4A8F', '#8B3A8F', '#3A8B5C', '#8B6B3A', '#3A6B8B', '#8B3A3A']

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getAvatarColor(description: string): string {
  return AVATAR_COLORS[hashString(description) % AVATAR_COLORS.length]
}

function getAvatarInitials(description: string): string {
  const trimmed = description.trim()
  if (!trimmed) return '??'
  const words = trimmed.split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

function groupByDate(items: any[]): { label: string; key: string; items: any[] }[] {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const groups: Record<string, any[]> = {}
  const groupOrder: string[] = []

  for (const tx of items) {
    const d = new Date(tx.date)
    const dayStr = d.toDateString()
    if (!groups[dayStr]) {
      groups[dayStr] = []
      groupOrder.push(dayStr)
    }
    groups[dayStr].push(tx)
  }

  return groupOrder.map((dayStr) => {
    let label: string
    if (dayStr === todayStr) {
      label = 'Сегодня'
    } else if (dayStr === yesterdayStr) {
      label = 'Вчера'
    } else {
      const d = new Date(dayStr)
      label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    }
    return { label, key: dayStr, items: groups[dayStr] }
  })
}

export function TransactionList({ userId, currency, limit = 50 }: Props) {
  const api = createApiClient(userId)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', userId, limit],
    queryFn: () => api.transactions.list({ limit }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '3.5rem' }} />
        ))}
      </div>
    )
  }

  if (!data?.items?.length) {
    return (
      <motion.div
        style={{ padding: '4rem 0', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-hint" style={{ fontSize: '0.875rem' }}>Транзакций пока нет</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Добавьте первую операцию</p>
      </motion.div>
    )
  }

  const groups = groupByDate(data.items)
  let globalIdx = 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <div key={group.key} style={{ marginBottom: '0.5rem' }}>
            {/* Date group label */}
            <p style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
              marginTop: '1.5rem',
            }}>
              {group.label}
            </p>

            {group.items.map((tx: any) => {
              const idx = globalIdx++
              const desc = tx.description || 'Без описания'
              const avatarColor = getAvatarColor(desc)
              const initials = getAvatarInitials(desc)
              const isIncome = tx.amount > 0

              return (
                <motion.div
                  key={tx.id}
                  className="group hover-lift"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.75rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid transparent',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 28 }}
                  layout
                >
                  {/* Avatar */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    backgroundColor: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${avatarColor}30`,
                  }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff' }}>
                      {initials}
                    </span>
                  </div>

                  {/* Middle: description + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {desc}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                      <MdAccessTime size={10} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {isIncome ? 'Получено' : 'Оплачено'}
                      </span>
                    </div>
                  </div>

                  {/* Right: amount + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      fontVariantNumeric: 'tabular-nums',
                      color: isIncome ? 'var(--green)' : 'var(--red)',
                      padding: '0.375rem 0.625rem',
                      borderRadius: 'var(--radius-xs)',
                      background: isIncome ? 'var(--green-dim)' : 'var(--red-dim)',
                    }}>
                      {isIncome ? '+' : ''}{formatCurrency(tx.amount, currency)}
                    </span>

                    <motion.button
                      onClick={() => deleteMutation.mutate(tx.id)}
                      style={{
                        borderRadius: '0.375rem',
                        padding: '0.375rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        opacity: 0.5,
                        transition: 'opacity 150ms ease, color 150ms ease',
                        WebkitAppearance: 'none',
                      }}
                      whileHover={{ opacity: 1 }}
                      whileTap={{ scale: 0.85 }}
                    >
                      <MdClose size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
