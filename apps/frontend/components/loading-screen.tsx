'use client'

import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      >
        {/* Animated circles */}
        <div className="relative h-16 w-16">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{
                scale: [1, 1.5],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            💰
          </motion.div>
        </div>

        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Загрузка...
        </motion.p>
      </motion.div>
    </div>
  )
}
