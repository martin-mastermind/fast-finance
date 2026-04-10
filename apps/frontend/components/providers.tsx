'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { useLocaleStore } from '@/store/locale'
import en from '@/messages/en.json'
import ru from '@/messages/ru.json'
import zh from '@/messages/zh.json'
import es from '@/messages/es.json'

const messages = { en, ru, zh, es }

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  )

  const { locale, initLocale } = useLocaleStore()

  useEffect(() => {
    initLocale()
  }, [initLocale])

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}
