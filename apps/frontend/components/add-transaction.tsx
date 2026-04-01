'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { parseSmartInput } from '@fast-finance/shared'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface Props {
  userId: number
}

export function AddTransaction({ userId }: Props) {
  const api = createApiClient(userId)
  const queryClient = useQueryClient()
  const [smartInput, setSmartInput] = useState('')
  const [parsed, setParsed] = useState<ReturnType<typeof parseSmartInput>>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => api.accounts.list(),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => api.categories.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: { accountId: number; categoryId: number; amount: number; description?: string }) =>
      api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setSmartInput('')
      setParsed(null)

      // Haptic feedback
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    },
  })

  function handleSmartParse() {
    const result = parseSmartInput(smartInput)
    setParsed(result)
    if (result && categories) {
      const cat = categories.find(c => c.name === result.suggestedCategory)
      if (cat) setSelectedCategoryId(cat.id)
    }
    if (accounts?.length && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id)
    }
  }

  function handleSubmit() {
    if (!parsed || !selectedAccountId || !selectedCategoryId) return
    createMutation.mutate({
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amount: parsed.amount,
      description: parsed.description,
    })
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
    >
      {/* Smart Input */}
      <motion.div
        className="premium-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <label className="mb-3 block text-sm font-semibold text-primary">Быстрый ввод</label>
        <div className="flex gap-2">
          <motion.input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
            placeholder="500 кофе или зарплата 50000"
            className="flex-1 rounded-xl border border-border/50 bg-input smooth-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground"
            whileFocus={{ scale: 1.02 }}
          />
          <motion.button
            onClick={handleSmartParse}
            className="btn-primary flex items-center gap-2 px-5 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={20} />
            <span>Анализ</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Parsed Result */}
      {parsed && (
        <motion.div
          className="premium-card p-5 space-y-4"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          {/* Amount Display */}
          <motion.div
            className="flex items-center justify-between rounded-2xl bg-secondary/50 p-4 border border-border/50"
            whileHover={{ backgroundColor: 'rgba(46, 41, 78, 0.7)' }}
          >
            <span className="text-sm font-medium text-hint">Сумма</span>
            <motion.span
              className={`text-2xl font-bold tabular-nums ${
                parsed.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              {parsed.amount > 0 ? '+' : ''}{parsed.amount.toFixed(2)}
            </motion.span>
          </motion.div>

          {/* Account selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <label className="mb-2 block text-sm font-semibold text-primary">Счёт</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="w-full rounded-xl border border-border/50 bg-input smooth-input px-4 py-3 text-sm text-foreground"
            >
              <option value="">Выберите счёт</option>
              {accounts?.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Category selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <label className="mb-3 block text-sm font-semibold text-primary">Категория</label>
            <motion.div className="flex flex-wrap gap-2.5" layout>
              {categories
                ?.filter(c => c.type === parsed.type)
                .map(c => (
                  <motion.button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 border ${
                      selectedCategoryId === c.id
                        ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary shadow-lg shadow-primary/30'
                        : 'bg-secondary text-foreground hover:bg-secondary/80 border-border/50 hover:border-primary/30'
                    }`}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    layout
                  >
                    {c.name}
                  </motion.button>
                ))}
            </motion.div>
          </motion.div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!selectedAccountId || !selectedCategoryId || createMutation.isPending}
            className="btn-primary w-full py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            whileHover={{ scale: !(!selectedAccountId || !selectedCategoryId || createMutation.isPending) ? 1.02 : 1 }}
            whileTap={{ scale: !(!selectedAccountId || !selectedCategoryId || createMutation.isPending) ? 0.98 : 1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {createMutation.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ✓
                </motion.div>
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Сохранить операцию</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* No accounts hint */}
      {accounts?.length === 0 && (
        <motion.div
          className="premium-card p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl mb-2">⚙️</p>
          <p className="text-sm font-medium text-hint">Сначала создайте счёт в настройках</p>
        </motion.div>
      )}
    </motion.div>
  )
}
