'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { MdCheck, MdAdd, MdRemove } from 'react-icons/md'
import { useFinanceStore } from '@/store/finance'
import { getCategoryIcon } from '@/lib/icon-map'

interface Props {
  userId: number
  onClose?: () => void
}

const CURRENCY_LABELS: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  USD: '$',
}

export function AddTransaction({ userId, onClose }: Props) {
  const api = createApiClient(userId)
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType } = useFinanceStore()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
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

  useEffect(() => {
    if (accounts?.length && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id)
    }
  }, [accounts, selectedAccountId])

  useEffect(() => {
    setSelectedCategoryId(null)
  }, [transactionType])

  const createMutation = useMutation({
    mutationFn: (data: { accountId: number; categoryId: number; amount: number; currency: string; description?: string }) =>
      api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setAmount('')
      setDescription('')
      setSelectedCategoryId(null)
      onClose?.()

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    },
  })

  function handleSubmit() {
    if (!amount || !selectedAccountId || !selectedCategoryId) return
    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) return

    createMutation.mutate({
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amount: transactionType === 'income' ? numAmount : -numAmount,
      currency,
      description: description || undefined,
    })
  }

  const filteredCategories = categories?.filter(c => c.type === transactionType) || []
  const selectedAccount = accounts?.find(a => a.id === selectedAccountId)
  const currency = selectedAccount?.currency || 'RUB'

  const isSubmitDisabled = !amount || !selectedAccountId || !selectedCategoryId || createMutation.isPending

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Type selector */}
      <motion.div
        className="glass-card"
        style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          onClick={() => setTransactionType('income')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid',
            borderColor: transactionType === 'income' ? 'var(--green)' : 'var(--border)',
            backgroundColor: transactionType === 'income' ? 'var(--green)' + '15' : 'transparent',
            color: transactionType === 'income' ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem',
            fontFamily: "'Outfit', sans-serif",
            WebkitAppearance: 'none',
          }}
          whileTap={{ scale: 0.97 }}
        >
          <MdAdd size={18} />
          Доход
        </motion.button>
        <motion.button
          onClick={() => setTransactionType('expense')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid',
            borderColor: transactionType === 'expense' ? 'var(--red)' : 'var(--border)',
            backgroundColor: transactionType === 'expense' ? 'var(--red)' + '15' : 'transparent',
            color: transactionType === 'expense' ? 'var(--red)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem',
            fontFamily: "'Outfit', sans-serif",
            WebkitAppearance: 'none',
          }}
          whileTap={{ scale: 0.97 }}
        >
          <MdRemove size={18} />
          Расход
        </motion.button>
      </motion.div>

      {/* Amount input */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
      >
        <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Сумма
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-field"
            style={{ 
              flex: 1, 
              fontSize: '1.5rem', 
              fontWeight: 300,
              textAlign: 'right',
              paddingRight: '0.5rem',
            }}
          />
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {CURRENCY_LABELS[currency] || currency}
          </span>
        </div>
      </motion.div>

      {/* Description input */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
      >
        <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Описание (необязательно)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Комментарий"
          className="input-field"
        />
      </motion.div>

      {/* Account selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
      >
        <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Счёт
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {accounts?.map((a, idx) => {
            const isSelected = selectedAccountId === a.id
            return (
              <motion.button
                key={a.id}
                onClick={() => setSelectedAccountId(a.id)}
                style={{
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  WebkitAppearance: 'none',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + idx * 0.03 }}
                whileTap={{ scale: 0.95 }}
              >
                {a.name} ({CURRENCY_LABELS[a.currency] || a.currency})
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Category selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
      >
        <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
          Категория
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {filteredCategories.map((c, idx) => {
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
                  borderColor: isSelected ? (transactionType === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
                  backgroundColor: isSelected ? (transactionType === 'income' ? 'var(--green)' : 'var(--red)') + '15' : 'var(--bg-elevated)',
                  color: isSelected ? (transactionType === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  WebkitAppearance: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.22 + idx * 0.03 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ fontSize: '1rem' }}>{getCategoryIcon(c.icon)}</span>
                {c.name}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="btn-primary"
        style={{ 
          width: '100%', 
          padding: '0.875rem',
          backgroundColor: transactionType === 'income' ? 'var(--green)' : 'var(--red)',
        }}
        whileTap={{ scale: isSubmitDisabled ? 1 : 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
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

      {/* No accounts hint */}
      {accounts?.length === 0 && (
        <motion.div
          className="glass-card"
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