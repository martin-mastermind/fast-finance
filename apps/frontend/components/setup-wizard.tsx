'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MotionButton } from '@/components/ui/motion-button'
import { useTranslations } from 'next-intl'

interface Props {
  userId: number
}

type Step = 'welcome' | 'create' | 'success'

const CURRENCIES = [
  { code: 'RUB', flag: '🇷🇺' },
  { code: 'BYN', flag: '🇧🇾' },
  { code: 'USD', flag: '🇺🇸' },
]

export function SetupWizard({ userId }: Props) {
  const { token } = useAuthStore()
  const [step, setStep] = useState<Step>('welcome')
  const t = useTranslations('wizard')
  const [accountName, setAccountName] = useState('')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('RUB')
  const queryClient = useQueryClient()
  const api = createApiClient(token || '')

  const createMutation = useMutation({
    mutationFn: () =>
      api.accounts.create({
        name: accountName || t('accountNamePlaceholder'),
        balance: balance ? parseFloat(balance) : 0,
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] })
      setStep('success')

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    },
  })

  const handleCreate = () => {
    if (!accountName.trim()) return
    createMutation.mutate()
  }

  return (
    <div className="safe-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', padding: '0 1.25rem' }}>
      <AnimatePresence mode="wait">
        {/* Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            style={{ width: '100%', maxWidth: '24rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 300, color: 'var(--text)', marginBottom: '0.75rem' }}>
                Fast Finance
              </h1>
              <p className="text-hint" style={{ fontSize: '0.875rem' }}>{t('subtitle')}</p>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t('description')}
            </p>

            <MotionButton
              onClick={() => setStep('create')}
              variant="default"
              size="lg"
              className="w-full"
              whileTap={{ scale: 0.97 }}
            >
              {t('start')}
            </MotionButton>
          </motion.div>
        )}

        {/* Create Account */}
        {step === 'create' && (
          <motion.div
            key="create"
            style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {t('createAccount')}
            </h2>

            <div>
              <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                {t('currencyLabel')}
              </Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {CURRENCIES.map((c) => {
                  const isSelected = currency === c.code
                  return (
                    <motion.button
                      key={c.code}
                      onClick={() => setCurrency(c.code)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{c.flag}</span>
                      <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500 }}>
                        {c.code}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                {t('accountNameLabel')}
              </Label>
              <Input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t('accountNamePlaceholder')}
              />
            </div>

            <div>
              <Label className="block text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-2">
                {t('initialBalance')}
              </Label>
              <Input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
              />
            </div>

            <MotionButton
              onClick={handleCreate}
              disabled={!accountName.trim() || createMutation.isPending}
              variant="default"
              size="lg"
              className="w-full"
              whileTap={{ scale: !(!accountName.trim() || createMutation.isPending) ? 0.97 : 1 }}
            >
              {createMutation.isPending ? t('creating') : t('create')}
            </MotionButton>

            <MotionButton
              onClick={() => setStep('welcome')}
              variant="outline"
              size="lg"
              className="w-full"
              whileTap={{ scale: 0.97 }}
            >
              {t('back')}
            </MotionButton>
          </motion.div>
        )}

        {/* Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            style={{ width: '100%', maxWidth: '24rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 size={64} className="text-[var(--green)]" />
            </motion.div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>{t('done')}</h2>
              <p className="text-hint" style={{ fontSize: '0.875rem' }}>{t('doneSubtitle')}</p>
            </div>

            <motion.div
              className="glass-card"
              style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left', width: '100%' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t('doneHint')}
            </motion.div>

            <MotionButton
              onClick={() => window.location.reload()}
              variant="default"
              size="lg"
              className="w-full"
              whileTap={{ scale: 0.97 }}
            >
              {t('startUsing')}
            </MotionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}