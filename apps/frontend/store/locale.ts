import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'en' | 'ru' | 'zh' | 'es'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ru', 'zh', 'es']

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  zh: '中文',
  es: 'Español',
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const tgLang = (window.Telegram?.WebApp?.initDataUnsafe?.user as { language_code?: string } | undefined)?.language_code
  if (tgLang) {
    const lang = tgLang.toLowerCase().split('-')[0]
    if (lang === 'ru' || lang === 'be' || lang === 'uk') return 'ru'
    if (lang === 'zh') return 'zh'
    if (lang === 'es') return 'es'
  }
  const browserLang = navigator.language?.toLowerCase().split('-')[0]
  if (browserLang === 'ru') return 'ru'
  if (browserLang === 'zh') return 'zh'
  if (browserLang === 'es') return 'es'
  return 'en'
}

interface LocaleStore {
  locale: Locale
  initialized: boolean
  setLocale: (locale: Locale) => void
  initLocale: () => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: 'en',
      initialized: false,
      setLocale: (locale) => set({ locale }),
      initLocale: () => {
        if (get().initialized) return
        set({ locale: detectLocale(), initialized: true })
      },
    }),
    {
      name: 'ff-locale',
      // Only persist locale, not initialized — so detection re-runs on first load
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
)
