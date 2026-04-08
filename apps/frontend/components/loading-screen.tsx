'use client'

import { motion } from 'framer-motion'

export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              width: 48 + i * 32,
              height: 48 + i * 32,
            }}
            initial={{ opacity: 0.6 - i * 0.15, scale: 0.5 }}
            animate={{
              opacity: [0.6 - i * 0.15, 0.2, 0.6 - i * 0.15],
              scale: [0.8, 1],
              rotate: 360,
            }}
            transition={{
              duration: 2 + i * 0.4,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
        <motion.div
          className="h-3 w-3 rounded-full bg-primary"
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  )
}
