'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinanceStore } from '@/store/finance'
import { useAuthStore } from '@/store/auth'
import { createApiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export function PlansScreen() {
  const { isPlansScreenOpen, setIsPlansScreenOpen } = useFinanceStore()
  const { token } = useAuthStore()
  const t = useTranslations('plans')
  const tPlanLimit = useTranslations('planLimit')
  const api = createApiClient(token || '')
  const [loading, setLoading] = useState(false)

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.billing.getSubscription(),
    enabled: isPlansScreenOpen,
  })

  const isPro = subscription?.plan?.name === 'pro' && subscription?.status === 'active'

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { invoiceLink } = await api.billing.getStarsInvoice()
      type TwaWithInvoice = { openInvoice?: (url: string, cb: (status: string) => void) => void }
      const twa = window.Telegram?.WebApp as TwaWithInvoice | undefined
      if (twa?.openInvoice) {
        twa.openInvoice(invoiceLink, (status: string) => {
          setLoading(false)
          if (status === 'paid') {
            setIsPlansScreenOpen(false)
            toast.success(tPlanLimit('successToast'))
            setTimeout(() => window.location.reload(), 1500)
          } else if (status === 'failed') {
            toast.error(tPlanLimit('paymentFailed'))
          }
        })
      } else {
        window.open(invoiceLink, '_blank')
        setLoading(false)
      }
    } catch {
      toast.error(tPlanLimit('paymentFailed'))
      setLoading(false)
    }
  }

  const features = [
    {
      label: t('accounts'),
      free: '3',
      pro: t('unlimited'),
    },
    {
      label: t('transactionsPerMonth'),
      free: '100',
      pro: t('unlimited'),
    },
    {
      label: t('aiAssistant'),
      free: null,
      pro: true,
    },
  ]

  return (
    <AnimatePresence>
      {isPlansScreenOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPlansScreenOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 50,
            }}
          />
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              background: 'var(--bg-elevated)',
              borderRadius: '1.25rem 1.25rem 0 0',
              padding: '1.5rem 1.5rem calc(2rem + var(--tg-safe-area-inset-bottom, 0px))',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setIsPlansScreenOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
              }}>
                <Zap size={22} color="white" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {t('title')}
              </h2>
              {isPro && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.75rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
                  color: 'white',
                }}>
                  {t('alreadyPro')} ⭐
                </span>
              )}
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Free */}
              <div style={{
                border: `2px solid ${!isPro ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '1rem',
                padding: '1rem',
                background: 'var(--bg)',
                position: 'relative',
              }}>
                {!isPro && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.6rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.625rem',
                    borderRadius: '999px',
                    background: 'var(--accent)',
                    color: 'white',
                    whiteSpace: 'nowrap',
                  }}>
                    {t('current')}
                  </span>
                )}
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: '0 0 0.25rem' }}>
                  {t('free')}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  $0
                </p>
              </div>

              {/* Pro */}
              <div style={{
                border: `2px solid ${isPro ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '1rem',
                padding: '1rem',
                background: isPro ? 'rgba(var(--accent-rgb, 99,102,241), 0.08)' : 'var(--bg)',
                position: 'relative',
              }}>
                {isPro && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.6rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.625rem',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
                    color: 'white',
                    whiteSpace: 'nowrap',
                  }}>
                    {t('current')}
                  </span>
                )}
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: '0 0 0.25rem' }}>
                  {t('pro')}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    250 ⭐
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {t('perMonth')}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature comparison */}
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              overflow: 'hidden',
            }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('feature')}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', width: 56, textAlign: 'center' }}>{t('free')}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', width: 56, textAlign: 'center' }}>{t('pro')}</span>
              </div>

              {features.map((f, i) => (
                <div
                  key={f.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    alignItems: 'center',
                    borderBottom: i < features.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{f.label}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', width: 56, textAlign: 'center' }}>
                    {f.free === null
                      ? <span style={{ color: 'var(--expense)', fontWeight: 700 }}>✕</span>
                      : f.free}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text)', fontWeight: 600, width: 56, textAlign: 'center' }}>
                    {f.pro === true
                      ? <Check size={16} color="var(--accent)" strokeWidth={3} style={{ display: 'inline' }} />
                      : f.pro}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {!isPro && (
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
                  color: 'white',
                  border: 'none',
                  height: '3rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  gap: '0.375rem',
                }}
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <>{t('upgrade')} ⭐</>}
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
