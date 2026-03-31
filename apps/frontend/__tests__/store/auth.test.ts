import { describe, it, expect, mock, beforeEach } from 'bun:test'

const mockTelegramAuth = mock(async (_initData: string) => ({
  user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
}))

mock.module('@/lib/api', () => ({
  createApiClient: mock(() => ({
    auth: { telegram: mockTelegramAuth },
  })),
}))

;(global as any).window = {}
process.env.NODE_ENV = 'development'

const { useAuthStore } = await import('../../store/auth')

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false, error: null })
    mockTelegramAuth.mockResolvedValue({
      user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
    })
  })

  it('initial state: user null, not loading, no error', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('initAuth sets user on success', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).not.toBeNull()
    expect(state.user!.id).toBe(1)
    expect(state.user!.username).toBe('alice')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('initAuth sets error on API failure', async () => {
    mockTelegramAuth.mockRejectedValue(new Error('Network error'))
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.error).toContain('Network error')
    expect(state.isLoading).toBe(false)
  })

  it('logout clears user', async () => {
    await useAuthStore.getState().initAuth()
    expect(useAuthStore.getState().user).not.toBeNull()
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
