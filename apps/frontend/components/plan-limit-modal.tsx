'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinanceStore } from '@/store/finance'
import { useAuthStore } from '@/store/auth'
import { createApiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export function PlanLimitModal() {
  const { isPlanLimitModalOpen, setPlanLimitModalOpen } = useFinanceStore()
  const { token } = useAuthStore()
  const t = useTranslations('planLimit')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const api = createApiClient(token || '')
      const { invoiceLink } = await api.billing.getStarsInvoice()

      type TwaWithInvoice = { openInvoice?: (url: string, cb: (status: string) => void) => void }
      const twa = window.Telegram?.WebApp as TwaWithInvoice | undefined
      if (twa?.openInvoice) {
        twa.openInvoice(invoiceLink, (status: string) => {
          setLoading(false)
          if (status === 'paid') {
            setPlanLimitModalOpen(false)
            toast.success(t('successToast'))
            // Reload after short delay so plan limits re-fetch
            setTimeout(() => window.location.reload(), 1500)
          } else if (status === 'cancelled') {
            // User closed the invoice — do nothing
          } else if (status === 'failed') {
            toast.error(t('paymentFailed'))
          }
        })
      } else {
        // Fallback: open invoice link in browser (dev environment)
        window.open(invoiceLink, '_blank')
        setLoading(false)
        setPlanLimitModalOpen(false)
      }
    } catch {
      toast.error(t('paymentFailed'))
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isPlanLimitModalOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlanLimitModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 50,
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 51,
              background: 'var(--bg-elevated)',
              borderRadius: '1.25rem 1.25rem 0 0',
              padding: '1.5rem 1.5rem 2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => setPlanLimitModalOpen(false)}
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

            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={24} color="white" />
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.375rem' }}>
                {t('title')}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t('subtitle')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {t('starsPrice')}
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, #9333ea 100%)',
                  color: 'white',
                  border: 'none',
                  height: '2.75rem',
                  fontWeight: 600,
                  gap: '0.375rem',
                }}
              >
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <>{t('upgrade')} ⭐</>
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => setPlanLimitModalOpen(false)}
                className="w-full"
              >
                {t('close')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
