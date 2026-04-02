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

  const isSubmitDisabled = !selectedAccountId || !selectedCategoryId || createMutation.isPending

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Smart Input */}
      <motion.div
        className="surface"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Быстрый ввод
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
            placeholder="500 кофе или зарплата 50000"
            className="input-field"
            style={{ flex: 1 }}
          />
          <motion.button
            onClick={handleSmartParse}
            className="btn-primary"
            style={{ padding: '0.875rem 1rem', flexShrink: 0 }}
            whileTap={{ scale: 0.95 }}
          >
            <MdAutoFixHigh size={20} />
          </motion.button>
        </div>
      </motion.div>

      {/* Parsed Result */}
      {parsed && (
        <motion.div
          className="surface"
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="text-hint" style={{ fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Сумма
            </span>
            <motion.span
              style={{
                fontWeight: 300,
                fontSize: '1.75rem',
                fontVariantNumeric: 'tabular-nums',
                color: parsed.amount > 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {parsed.amount > 0 ? '+' : ''}{parsed.amount.toFixed(2)}
            </motion.span>
          </div>

          <div className="divider" />

          {/* Account selector */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              Категория
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {categories
                ?.filter(c => c.type === parsed.type)
                .map((c, idx) => {
                  const isSelected = selectedCategoryId === c.id
                  return (
                    <motion.button
                      key={c.id}
                      onClick={() => setSelectedCategoryId(c.id)}
                      style={{
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        fontFamily: "'Outfit', sans-serif",
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent)' : 'hsl(var(--border))',
                        backgroundColor: isSelected ? 'var(--accent-dim)' : 'hsl(var(--secondary))',
                        color: isSelected ? 'var(--accent)' : 'hsl(var(--secondary-foreground))',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        WebkitAppearance: 'none',
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.12 + idx * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {c.name}
                    </motion.button>
                  )
                })}
            </div>
          </motion.div>

          <div className="divider" />

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
            whileTap={{ scale: isSubmitDisabled ? 1 : 0.97 }}
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
          className="surface"
          style={{ padding: '1.5rem', textAlign: 'center' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-hint" style={{ fontSize: '0.875rem' }}>Сначала создайте счёт в настройках</p>
        </motion.div>
      )}
    </motion.div>
  )
}
