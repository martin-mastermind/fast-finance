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
  refreshToken: string | null
  currentSessionId: string | null
  isLoading: boolean
  error: string | null
  initAuth: () => Promise<void>
  refreshTokens: () => Promise<boolean>
  setCurrency: (currency: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  currentSessionId: null,
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

      const api = createApiClient('')
      const result = await api.auth.telegram(initData)
      set({ user: result.user, token: result.token, refreshToken: result.refreshToken, currentSessionId: result.sessionId ?? null, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  // Exchange a refresh token for a new access+refresh token pair
  refreshTokens: async (): Promise<boolean> => {
    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) return false
    try {
      const api = createApiClient('')
      const result = await api.auth.refresh(refreshToken)
      set({ token: result.token, refreshToken: result.refreshToken })
      return true
    } catch {
      set({ user: null, token: null, refreshToken: null })
      return false
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

  logout: async () => {
    const { refreshToken } = useAuthStore.getState()
    if (refreshToken) {
      try {
        const api = createApiClient('')
        await api.auth.logout(refreshToken)
      } catch {
        // Ignore logout errors — clear local state regardless
      }
    }
    set({ user: null, token: null, refreshToken: null })
  },
}))
