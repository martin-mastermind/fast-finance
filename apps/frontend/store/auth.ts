import { create } from 'zustand'
import { createApiClient } from '@/lib/api'

interface AuthUser {
  id: number
  telegramId: string
  username: string | null
  currency: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  initAuth: () => Promise<void>
  setCurrency: (currency: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  initAuth: async () => {
    set({ isLoading: true, error: null })
    try {
      let initData: string

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
        initData = window.Telegram.WebApp.initData
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()
      } else if (process.env.NODE_ENV === 'development') {
        initData = 'dev_bypass'
      } else {
        set({ isLoading: false, error: 'Telegram WebApp не обнаружен' })
        return
      }

      // Use unauthenticated client for the auth call itself
      const api = createApiClient('')
      const result = await api.auth.telegram(initData)
      set({ user: result.user, token: result.token, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  setCurrency: async (currency: string) => {
    const { user, token } = useAuthStore.getState()
    if (!user || !token) return

    try {
      const api = createApiClient(token)
      await api.users.updateCurrency(currency)
      set({ user: { ...user, currency } })
    } catch (err) {
      console.error('Failed to update currency:', err)
    }
  },

  logout: () => set({ user: null, token: null }),
}))
