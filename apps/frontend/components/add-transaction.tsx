'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { motion } from 'framer-motion'
import { Loader2, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { useFinanceStore } from '@/store/finance'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MotionButton } from '@/components/ui/motion-button'
import { getCategoryIcon } from '@/lib/icon-map'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

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
  const { token } = useAuthStore()
  const api = createApiClient(token || '')
  const t = useTranslations('addTransaction')
  const tDash = useTranslations('dashboard')
  const tTx = useTranslations('transactions')
  const queryClient = useQueryClient()
  const { transactionType, setTransactionType, setPlanLimitModalOpen } = useFinanceStore()

  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [currency, setCurrency] = useState('RUB')
  const [toAccountId, setToAccountId] = useState<number | null>(null)

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
      setCurrency(accounts[0].currency)
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
      toast.success('Transaction added')
      onClose?.()

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    },
    onError: (err: Error) => {
      if (err.message.includes('Plan limit reached')) {
        setPlanLimitModalOpen(true)
      } else {
        toast.error(err.message || 'Failed to add transaction')
      }
    },
  })

  const transferMutation = useMutation({
    mutationFn: (data: { fromAccountId: number; toAccountId: number; amount: number; currency: string; description?: string }) =>
      api.transactions.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setAmount('')
      setDescription('')
      setToAccountId(null)
      toast.success('Transfer completed')
      onClose?.()

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to complete transfer'),
  })

  function handleSubmit() {
    if (!amount || !selectedAccountId) { setAmountError(true); return }
    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) { setAmountError(true); return }

    if (transactionType === 'transfer') {
      if (!toAccountId || toAccountId === selectedAccountId) return
      transferMutation.mutate({
        fromAccountId: selectedAccountId,
        toAccountId,
        amount: numAmount,
        currency,
        description: description || tTx('transferBetween'),
      })
      return
    }

    if (!selectedCategoryId) return
    createMutation.mutate({
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amount: transactionType === 'income' ? numAmount : -numAmount,
      currency,
      description: description || undefined,
    })
  }

  const filteredCategories = categories?.filter(c => c.type === transactionType) || []

  const isSubmitDisabled = transactionType === 'transfer'
    ? !amount || !selectedAccountId || !toAccountId || toAccountId === selectedAccountId || transferMutation.isPending
    : !amount || !selectedAccountId || !selectedCategoryId || createMutation.isPending

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
          <Plus size={18} />
          {tDash('income')}
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
          <Minus size={18} />
          {tDash('expense')}
        </motion.button>
        <motion.button
          onClick={() => setTransactionType('transfer')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid',
            borderColor: transactionType === 'transfer' ? '#F59E0B' : 'var(--border)',
            backgroundColor: transactionType === 'transfer' ? '#F59E0B' + '15' : 'transparent',
            color: transactionType === 'transfer' ? '#F59E0B' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.875rem',
            fontFamily: "'Outfit', sans-serif",
            WebkitAppearance: 'none',
          }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeftRight size={18} />
          {tDash('transfer')}
        </motion.button>
      </motion.div>

      {/* Amount input */}
      <motion.div
        className="glass-card"
        style={{ padding: '1.25rem', border: amountError ? '1px solid var(--red)' : undefined }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
      >
        <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {tTx('amount')}{amountError && <span style={{ color: 'var(--red)', marginLeft: '0.5rem', textTransform: 'none', letterSpacing: 0 }}>{tTx('enterAmount')}</span>}
        </Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const filtered = e.target.value.replace(/[^0-9.,]/g, '')
              setAmount(filtered)
              if (filtered) setAmountError(false)
            }}
            placeholder="0.00"
            className="flex-1 text-2xl font-light text-right pr-2"
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
        <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {t('descriptionLabel')}
        </Label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('commentPlaceholder')}
        />
      </motion.div>

      {/* Account selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
      >
        <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {transactionType === 'transfer' ? t('from') : t('account')}
        </Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {accounts?.map((a, idx) => {
            const isSelected = selectedAccountId === a.id
            const isDisabled = transactionType === 'transfer' && toAccountId === a.id
            return (
              <motion.button
                key={a.id}
                onClick={() => { setSelectedAccountId(a.id); setCurrency(a.currency) }}
                disabled={isDisabled}
                style={{
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: isDisabled ? 'var(--text-muted)' : isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'all 150ms ease',
                  WebkitAppearance: 'none',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + idx * 0.03 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              >
                {a.name} ({CURRENCY_LABELS[a.currency] || a.currency})
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* To Account selector (for transfers) */}
      {transactionType === 'transfer' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.18 }}
        >
          <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
            {t('to')}
          </Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {accounts?.filter(a => a.id !== selectedAccountId).map((a, idx) => {
              const isSelected = toAccountId === a.id
              return (
                <motion.button
                  key={a.id}
                  onClick={() => setToAccountId(a.id)}
                  style={{
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    fontFamily: "'Outfit', sans-serif",
                    border: '1px solid',
                    borderColor: isSelected ? '#F59E0B' : 'var(--border)',
                    backgroundColor: isSelected ? '#F59E0B15' : 'var(--bg-elevated)',
                    color: isSelected ? '#F59E0B' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    WebkitAppearance: 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {a.name} ({CURRENCY_LABELS[a.currency] || a.currency})
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Category selector */}
      {transactionType !== 'transfer' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
        >
          <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
            {tTx('category')}
          </Label>
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
      )}

      {/* Submit */}
      <MotionButton
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        variant="default"
        size="lg"
        className="w-full"
        style={{
          backgroundColor: transactionType === 'income' ? 'var(--green)' : transactionType === 'transfer' ? '#F59E0B' : 'var(--red)',
        }}
        whileTap={{ scale: isSubmitDisabled ? 1 : 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {createMutation.isPending || transferMutation.isPending ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={20} />
          </motion.div>
        ) : (
          <span>{transactionType === 'transfer' ? t('submitTransfer') : t('submit')}</span>
        )}
      </MotionButton>

      {/* No accounts hint */}
      {accounts?.length === 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem', textAlign: 'center' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-hint" style={{ fontSize: '0.875rem' }}>{t('noAccounts')}</p>
        </motion.div>
      )}
    </motion.div>
  )
}