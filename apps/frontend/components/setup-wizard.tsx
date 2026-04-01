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
    <div className="flex h-screen flex-col items-center justify-center bg-background safe-top px-5">
      <AnimatePresence mode="wait">
        {/* Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            className="w-full max-w-sm space-y-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <h1 className="text-4xl font-display italic text-foreground mb-3">
                Fast Finance
              </h1>
              <p className="text-sm text-hint">Быстрый учёт личных финансов</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Создайте счёт и начните отслеживать свои расходы прямо здесь или через бота.
            </p>

            <motion.button
              onClick={() => setStep('create')}
              className="btn-primary w-full"
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
            className="w-full max-w-sm space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Создайте счёт</h2>

            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-hint mb-2">
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
              <label className="block text-xs font-medium uppercase tracking-widest text-hint mb-2">
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
              className="btn-primary w-full"
              whileTap={{ scale: !(!accountName.trim() || createMutation.isPending) ? 0.97 : 1 }}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать счёт'}
            </motion.button>

            <motion.button
              onClick={() => setStep('welcome')}
              className="btn-ghost w-full"
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
            className="w-full max-w-sm space-y-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex justify-center"
            >
              <MdCheckCircle size={64} className="text-income" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-1">Готово</h2>
              <p className="text-sm text-hint">Счёт создан. Добро пожаловать!</p>
            </div>

            <motion.div
              className="surface p-4 text-sm text-muted-foreground text-left"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Вы можете добавлять операции прямо здесь или написать боту сообщение вроде "500 кофе"
            </motion.div>

            <motion.button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
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
