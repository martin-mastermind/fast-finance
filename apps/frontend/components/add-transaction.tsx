'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { parseSmartInput } from '@fast-finance/shared'
import { motion } from 'framer-motion'
import { MdAutoFixHigh, MdCheck } from 'react-icons/md'

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
      className="space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Smart Input */}
      <motion.div
        className="surface p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <label className="block text-xs font-medium uppercase tracking-widest text-hint mb-3">
          Быстрый ввод
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
            placeholder="500 кофе или зарплата 50000"
            className="input-field flex-1"
          />
          <motion.button
            onClick={handleSmartParse}
            className="btn-primary px-4"
            whileTap={{ scale: 0.95 }}
          >
            <MdAutoFixHigh size={20} />
          </motion.button>
        </div>
      </motion.div>

      {/* Parsed Result */}
      {parsed && (
        <motion.div
          className="surface p-5 space-y-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Amount */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-hint">Сумма</span>
            <motion.span
              className={`text-3xl font-display italic tabular-nums ${
                parsed.amount > 0 ? 'text-income' : 'text-expense'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {parsed.amount > 0 ? '+' : ''}{parsed.amount.toFixed(2)}
            </motion.span>
          </div>

          <div className="divider" />

          {/* Account selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-xs font-medium uppercase tracking-widest text-hint mb-2">
              Счёт
            </label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="input-field"
            >
              <option value="">Выберите счёт</option>
              {accounts?.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Category selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-xs font-medium uppercase tracking-widest text-hint mb-3">
              Категория
            </label>
            <div className="flex flex-wrap gap-2">
              {categories
                ?.filter(c => c.type === parsed.type)
                .map((c, idx) => (
                  <motion.button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`rounded-lg px-3.5 py-2 text-sm font-medium border transition-all duration-150 ${
                      selectedCategoryId === c.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-secondary-foreground border-border hover:border-muted-foreground'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + idx * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {c.name}
                  </motion.button>
                ))}
            </div>
          </motion.div>

          <div className="divider" />

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={!selectedAccountId || !selectedCategoryId || createMutation.isPending}
            className="btn-primary w-full py-3.5"
            whileTap={{ scale: !(!selectedAccountId || !selectedCategoryId || createMutation.isPending) ? 0.97 : 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {createMutation.isPending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              >
                <MdCheck size={20} />
              </motion.div>
            ) : (
              <span>Сохранить</span>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* No accounts hint */}
      {accounts?.length === 0 && (
        <motion.div
          className="surface p-6 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-hint">Сначала создайте счёт в настройках</p>
        </motion.div>
      )}
    </motion.div>
  )
}
