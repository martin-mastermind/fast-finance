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
  isLoading: boolean
  error: string | null
  initAuth: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
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

      const api = createApiClient(0)
      const result = await api.auth.telegram(initData)
      set({ user: result.user, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  logout: () => set({ user: null }),
}))
