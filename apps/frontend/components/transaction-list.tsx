'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, ArrowLeftRight, Pencil, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryIcon } from '@/lib/icon-map'
import { useState } from 'react'

interface Props {
  userId: number
  currency?: string
  limit?: number
}

interface EditValues {
  description: string
  date: string
  amount: string
  categoryId: number | null
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

interface TransferInfo {
  from: string
  to: string
  description: string
}

function parseTransferInfo(raw: string | null): TransferInfo | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.type !== 'transfer') return null
    return {
      from: parsed.fromAccountName || '',
      to: parsed.toAccountName || '',
      description: parsed.description || 'Перевод между счетами',
    }
  } catch (e: unknown) {
    if (!(e instanceof SyntaxError)) throw e
    return null
  }
}

export function TransactionList({ userId, currency, limit = 50 }: Props) {
  const api = createApiClient(userId)
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditValues>({ description: '', date: '', amount: '', categoryId: null })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', userId, limit],
    queryFn: () => api.transactions.list({ limit }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => api.categories.list(),
  })

  const categoryMap = new Map(categories?.map(c => [c.id, c]) || [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { description?: string; date?: string; amount?: number; categoryId?: number } }) =>
      api.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setEditingId(null)
    },
  })

  function openEdit(tx: { id: string; description: string | null; date: string; amount: number; categoryId: number }) {
    const localDate = new Date(tx.date).toISOString().slice(0, 16)
    setEditValues({
      description: tx.description || '',
      date: localDate,
      amount: String(Math.abs(tx.amount)),
      categoryId: tx.categoryId,
    })
    setEditingId(tx.id)
  }

  function saveEdit(txId: string, originalAmount: number) {
    const parsedAmount = parseFloat(editValues.amount)
    if (isNaN(parsedAmount)) return
    const newAmount = originalAmount < 0 ? -Math.abs(parsedAmount) : Math.abs(parsedAmount)
    updateMutation.mutate({
      id: txId,
      data: {
        description: editValues.description || undefined,
        date: editValues.date ? new Date(editValues.date).toISOString() : undefined,
        amount: newAmount,
        categoryId: editValues.categoryId ?? undefined,
      },
    })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-[var(--radius-xs)]" />
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
              const category = categoryMap.get(tx.categoryId)
              const isIncome = tx.amount > 0
              
              const transfer = parseTransferInfo(tx.description)
              const isTransfer = transfer !== null
              const displayDesc = transfer?.description ?? desc

              const getTransactionColor = () => {
                if (isTransfer) return '#F59E0B'
                return isIncome ? 'var(--green)' : 'var(--red)'
              }

              const getTransactionBg = () => {
                if (isTransfer) return '#F59E0B15'
                return isIncome ? 'var(--green-dim)' : 'var(--red-dim)'
              }
              
              return (
                <div key={tx.id}>
                <motion.div
                  className="group hover-lift"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.75rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.25rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid transparent',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 28 }}
                  layout
                >
                  {/* Category Icon */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '14px',
                    backgroundColor: getTransactionBg(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.25rem',
                  }}>
                    {isTransfer ? <ArrowLeftRight size={22} color={getTransactionColor()} /> : getCategoryIcon(category?.icon || '')}
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
                      {displayDesc}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                      <Clock size={10} color="var(--text-muted)" />
                      {isTransfer ? (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {transfer?.from} → {transfer?.to}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      fontVariantNumeric: 'tabular-nums',
                      color: getTransactionColor(),
                      padding: '0.375rem 0.625rem',
                      borderRadius: 'var(--radius-xs)',
                      background: getTransactionBg(),
                    }}>
                      {isIncome ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </span>

                    {!isTransfer && (
                      <motion.button
                        onClick={() => openEdit(tx)}
                        style={{
                          borderRadius: '0.375rem',
                          padding: '0.375rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          opacity: 0.5,
                          transition: 'opacity 150ms ease',
                          WebkitAppearance: 'none',
                        }}
                        whileHover={{ opacity: 1 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <Pencil size={14} />
                      </motion.button>
                    )}

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
                      <X size={14} />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Inline edit form */}
                <AnimatePresence>
                  {editingId === tx.id && (
                    <motion.div
                      key={`edit-${tx.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Сумма</p>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.amount}
                              onChange={e => setEditValues(v => ({ ...v, amount: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '0.375rem 0.5rem',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Дата</p>
                            <input
                              type="datetime-local"
                              value={editValues.date}
                              onChange={e => setEditValues(v => ({ ...v, date: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '0.375rem 0.5rem',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Описание</p>
                          <input
                            type="text"
                            value={editValues.description}
                            onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
                            placeholder="Без описания"
                            style={{
                              width: '100%',
                              padding: '0.375rem 0.5rem',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              color: 'var(--text)',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        <div>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Категория</p>
                          <select
                            value={editValues.categoryId ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, categoryId: e.target.value ? Number(e.target.value) : null }))}
                            style={{
                              width: '100%',
                              padding: '0.375rem 0.5rem',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              color: 'var(--text)',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box',
                            }}
                          >
                            <option value="">— без категории —</option>
                            {categories?.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <motion.button
                            onClick={() => setEditingId(null)}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: '0.375rem 0.875rem',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              background: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              WebkitAppearance: 'none',
                            }}
                          >
                            Отмена
                          </motion.button>
                          <motion.button
                            onClick={() => saveEdit(tx.id, tx.amount)}
                            disabled={updateMutation.isPending}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              padding: '0.375rem 0.875rem',
                              borderRadius: 'var(--radius-xs)',
                              border: 'none',
                              background: 'var(--accent)',
                              color: '#fff',
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              WebkitAppearance: 'none',
                              opacity: updateMutation.isPending ? 0.7 : 1,
                            }}
                          >
                            <Check size={14} />
                            Сохранить
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              )
            })}
          </div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
