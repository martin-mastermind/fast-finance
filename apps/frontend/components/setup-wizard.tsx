'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MdCheckCircle } from 'react-icons/md'

interface Props {
  userId: number
}

type Step = 'welcome' | 'create' | 'success'

export function SetupWizard({ userId }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [accountName, setAccountName] = useState('')
  const [balance, setBalance] = useState('')
  const queryClient = useQueryClient()
  const api = createApiClient(userId)

  const createMutation = useMutation({
    mutationFn: () =>
      api.accounts.create({
        name: accountName || 'Основной',
        balance: balance ? parseFloat(balance) : 0,
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
              <p className="text-hint" style={{ fontSize: '0.875rem' }}>Быстрый учёт личных финансов</p>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Создайте счёт и начните отслеживать свои расходы прямо здесь или через бота.
            </p>

            <motion.button
              onClick={() => setStep('create')}
              className="btn-primary"
              style={{ width: '100%' }}
              whileTap={{ scale: 0.97 }}
            >
              Начать
            </motion.button>
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
              Создайте счёт
            </h2>

            <div>
              <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                Название счёта
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Основной, Кредитная карта и т.д."
                className="input-field"
              />
            </div>

            <div>
              <label className="text-hint" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                Начальный баланс
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>

            <motion.button
              onClick={handleCreate}
              disabled={!accountName.trim() || createMutation.isPending}
              className="btn-primary"
              style={{ width: '100%' }}
              whileTap={{ scale: !(!accountName.trim() || createMutation.isPending) ? 0.97 : 1 }}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать счёт'}
            </motion.button>

            <motion.button
              onClick={() => setStep('welcome')}
              className="btn-ghost"
              style={{ width: '100%' }}
              whileTap={{ scale: 0.97 }}
            >
              Назад
            </motion.button>
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
              <MdCheckCircle size={64} color="hsl(155, 100%, 62%)" />
            </motion.div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>Готово</h2>
              <p className="text-hint" style={{ fontSize: '0.875rem' }}>Счёт создан. Добро пожаловать!</p>
            </div>

            <motion.div
              className="surface"
              style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left', width: '100%' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Вы можете добавлять операции прямо здесь или написать боту сообщение вроде "500 кофе"
            </motion.div>

            <motion.button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ width: '100%' }}
              whileTap={{ scale: 0.97 }}
            >
              Начать пользоваться
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
