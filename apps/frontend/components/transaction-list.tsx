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
          <motion.div
            key={i}
            className="h-16 rounded-2xl bg-gradient-to-r from-secondary to-secondary/50"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    )
  }

  if (!data?.items?.length) {
    return (
      <motion.div
        className="py-12 text-center text-hint"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-5xl mb-3 drop-shadow">📭</p>
        <p className="text-lg font-medium">Транзакций пока нет</p>
        <p className="text-sm opacity-70 mt-2">Начните добавлять операции для отслеживания</p>
      </motion.div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, x: -10 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 12 },
    },
  } as const

  return (
    <motion.div
      className="space-y-2.5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {data.items.map((tx: any) => (
          <motion.div
            key={tx.id}
            className="flex items-center justify-between rounded-2xl premium-card p-4 group"
            variants={itemVariants}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            layout
            whileHover={{ y: -2 }}
          >
            <div className="flex-1">
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{tx.description || 'Без описания'}</p>
              <p className="text-xs text-hint mt-1">{formatDate(tx.date)}</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.span
                className={`font-bold text-base tabular-nums ${
                  tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, currency)}
              </motion.span>
              <motion.button
                onClick={() => deleteMutation.mutate(tx.id)}
                className="rounded-lg p-2 text-hint transition-all duration-300 hover:text-destructive hover:bg-destructive/10 active:scale-90"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
