'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--tg-theme-bg-color, #18181b)',
        color: 'var(--tg-theme-text-color, #fafafa)',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Что-то пошло не так
      </h2>
      <p style={{ color: 'var(--tg-theme-hint-color, #71717a)', marginBottom: '1.5rem', maxWidth: '300px' }}>
        Произошла непредвиденная ошибка. Попробуйте снова.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.625rem 1.5rem',
          borderRadius: '0.5rem',
          background: 'var(--tg-theme-button-color, #3b82f6)',
          color: 'var(--tg-theme-button-text-color, #fff)',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Попробовать снова
      </button>
    </div>
  )
}
