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
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14" />
        ))}
      </div>
    )
  }

  if (!data?.items?.length) {
    return (
      <motion.div
        className="py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-hint text-sm">Транзакций пока нет</p>
        <p className="text-muted-foreground text-xs mt-1">Добавьте первую операцию</p>
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
            className="group flex items-center justify-between py-3.5 border-b border-border/50 last:border-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ delay: idx * 0.035, type: 'spring', stiffness: 300, damping: 28 }}
            layout
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {tx.description || 'Без описания'}
              </p>
              <p className="text-xs text-hint mt-0.5">{formatDate(tx.date)}</p>
            </div>

            <div className="flex items-center gap-2 pl-3">
              <span
                className={`text-sm font-display italic tabular-nums ${
                  tx.amount > 0 ? 'text-income' : 'text-expense'
                }`}
              >
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
              </span>

              <motion.button
                onClick={() => deleteMutation.mutate(tx.id)}
                className="rounded-md p-1.5 text-hint opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:text-expense hover:bg-expense/10"
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
