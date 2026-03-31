'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { parseSmartInput } from '@/lib/smart-input'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

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
    <div className="space-y-4">
      {/* Smart Input */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-hint">Быстрый ввод</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
            placeholder="500 кофе или зарплата 50000"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSmartParse}
            className="flex items-center gap-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Zap size={16} />
          </button>
        </div>
      </div>

      {/* Parsed Result */}
      {parsed && (
        <motion.div
          className="rounded-2xl bg-card p-4 shadow-sm space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between">
            <span className="text-sm text-hint">Сумма</span>
            <span className={`font-bold ${parsed.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parsed.amount > 0 ? '+' : ''}{parsed.amount.toFixed(2)}
            </span>
          </div>

          {/* Account selector */}
          <div>
            <label className="mb-1 block text-sm text-hint">Счёт</label>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Выберите счёт</option>
              {accounts?.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Category selector */}
          <div>
            <label className="mb-1 block text-sm text-hint">Категория</label>
            <div className="flex flex-wrap gap-2">
              {categories
                ?.filter(c => c.type === parsed.type)
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                      selectedCategoryId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedAccountId || !selectedCategoryId || createMutation.isPending}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </motion.div>
      )}

      {/* No accounts hint */}
      {accounts?.length === 0 && (
        <div className="rounded-2xl bg-card p-4 text-center text-sm text-hint">
          Сначала создайте счёт в настройках
        </div>
      )}
    </div>
  )
}
