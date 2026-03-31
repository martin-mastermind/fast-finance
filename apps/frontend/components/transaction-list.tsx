'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

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
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    )
  }

  if (!data?.items?.length) {
    return (
      <div className="py-10 text-center text-hint">
        <p className="text-4xl mb-2">📭</p>
        <p>Транзакций пока нет</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {data.items.map((tx: any) => (
          <motion.div
            key={tx.id}
            className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
          >
            <div className="flex-1">
              <p className="font-medium">{tx.description || 'Без описания'}</p>
              <p className="text-xs text-hint">{formatDate(tx.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
              </span>
              <button
                onClick={() => deleteMutation.mutate(tx.id)}
                className="rounded-lg p-1 text-hint transition-colors hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
