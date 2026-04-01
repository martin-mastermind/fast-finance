import { describe, it, expect, beforeEach, mock } from 'bun:test'

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

describe('useAuthStore — initial state', () => {
  beforeEach(() => {
    const store = useAuthStore.getState()
    store.logout()
  })

  it('initializes with null user', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
  })

  it('initializes with isLoading false', () => {
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
  })

  it('initializes with null error', () => {
    const state = useAuthStore.getState()
    expect(state.error).toBeNull()
  })
})

describe('useAuthStore — initAuth success', () => {
  beforeEach(() => {
    const store = useAuthStore.getState()
    store.logout()
    mockTelegramAuth.mockResolvedValue({
      user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
    })
  })

  it('sets user on successful auth', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).not.toBeNull()
    expect(state.user!.id).toBe(1)
  })

  it('sets correct username', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user!.username).toBe('alice')
  })

  it('sets correct telegramId', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user!.telegramId).toBe('123456789')
  })

  it('clears error on success', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.error).toBeNull()
  })

  it('sets isLoading to false after success', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
  })
})

describe('useAuthStore — initAuth failure', () => {
  beforeEach(() => {
    const store = useAuthStore.getState()
    store.logout()
    mockTelegramAuth.mockRejectedValue(new Error('Network error'))
  })

  it('keeps user null on auth failure', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
  })

  it('sets error message on failure', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.error).not.toBeNull()
    expect(state.error).toContain('Network error')
  })

  it('sets isLoading to false on error', async () => {
    await useAuthStore.getState().initAuth()
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
  })
})

describe('useAuthStore — logout', () => {
  beforeEach(async () => {
    const store = useAuthStore.getState()
    mockTelegramAuth.mockResolvedValue({
      user: { id: 1, telegramId: '123456789', username: 'alice', currency: 'RUB' },
    })
    await store.initAuth()
  })

  it('clears user on logout', async () => {
    const store = useAuthStore.getState()
    expect(store.user).not.toBeNull()
    store.logout()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('clears error on logout', async () => {
    const store = useAuthStore.getState()
    store.logout()
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('resets loading state on logout', async () => {
    const store = useAuthStore.getState()
    store.logout()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
