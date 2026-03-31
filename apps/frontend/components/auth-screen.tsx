'use client'

import { motion } from 'framer-motion'

interface Props {
  error?: string
}

export function AuthScreen({ error }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4 text-6xl">{error ? '⚠️' : '💸'}</div>
        <h1 className="mb-2 text-2xl font-bold">Fast Finance</h1>
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-hint">Откройте приложение через Telegram</p>
        )}
      </motion.div>
    </div>
  )
}
