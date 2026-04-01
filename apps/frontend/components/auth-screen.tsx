'use client'

import { motion } from 'framer-motion'

interface Props {
  error?: string
}

export function AuthScreen({ error }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-display italic text-foreground mb-3">
          Fast Finance
        </h1>
        {error ? (
          <p className="text-sm text-expense">{error}</p>
        ) : (
          <p className="text-sm text-hint">Откройте приложение через Telegram</p>
        )}
      </motion.div>
    </div>
  )
}
