'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MdClose } from 'react-icons/md'

interface Props {
  userId: number
  currency: string
  limit?: number
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
        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>Добавьте первую операцию</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {data.items.map((tx: any, idx: number) => (
          <motion.div
            key={tx.id}
            className="group"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 0',
              borderBottom: '1px solid hsl(var(--border))',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ delay: idx * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
            layout
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tx.description || 'Без описания'}
              </p>
              <p className="text-hint" style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>
                {formatDate(tx.date)}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.75rem' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: tx.amount > 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))',
                }}
              >
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
              </span>

              <motion.button
                onClick={() => deleteMutation.mutate(tx.id)}
                style={{
                  borderRadius: '0.375rem',
                  padding: '0.375rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--hint))',
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
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
