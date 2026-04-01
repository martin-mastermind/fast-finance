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

      // Haptic feedback
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
    <div className="flex h-screen flex-col items-center justify-center bg-background safe-top px-4">
      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            className="w-full max-w-sm space-y-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div className="text-6xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              💰
            </motion.div>
            <div>
              <h1 className="mb-2 text-3xl font-bold">Fast Finance</h1>
              <p className="text-hint">Быстрый учёт личных финансов</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Создайте счёт и начните отслеживать свои расходы прямо здесь или через бота.
            </p>
            <motion.button
              onClick={() => setStep('create')}
              className="btn-primary w-full py-4 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Начать
            </motion.button>
          </motion.div>
        )}

        {/* Create Account Step */}
        {step === 'create' && (
          <motion.div
            key="create"
            className="w-full max-w-sm space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-2xl font-bold">Создайте счёт</h2>

            <div>
              <label className="mb-2 block text-sm font-medium">Название счёта</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Основной, Кредитная карта и т.д."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Начальный баланс (опционально)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <motion.button
              onClick={handleCreate}
              disabled={!accountName.trim() || createMutation.isPending}
              className="btn-primary w-full py-3 text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: !(!accountName.trim() || createMutation.isPending) ? 1.02 : 1 }}
              whileTap={{ scale: !(!accountName.trim() || createMutation.isPending) ? 0.98 : 1 }}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать счёт'}
            </motion.button>

            <motion.button
              onClick={() => setStep('welcome')}
              className="btn-secondary w-full py-3 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Назад
            </motion.button>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <motion.div
            key="success"
            className="w-full max-w-sm space-y-6 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="flex justify-center"
            >
              <MdCheckCircle size={80} className="text-green-500" />
            </motion.div>

            <div>
              <h2 className="mb-1 text-2xl font-bold">Отлично!</h2>
              <p className="text-sm text-muted-foreground">Счёт создан. Добро пожаловать в Fast Finance!</p>
            </div>

            <motion.div
              className="rounded-xl bg-card p-4 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              💡 Вы можете добавлять операции прямо здесь или написать боту сообщение вроде "500 кофе"
            </motion.div>

            <motion.button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-4 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 0.6 }}
            >
              Начать пользоваться
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
