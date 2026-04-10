const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const VERSION_PREFIX = '/v1'
const REQUEST_TIMEOUT_MS = 10_000

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  retries = 1,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_URL}${VERSION_PREFIX}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || `HTTP ${res.status}`)
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as T

    return res.json()
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof DOMException && err.name === 'AbortError')

    if (isNetworkError && retries > 0) {
      return request<T>(path, options, token, retries - 1)
    }
    throw err
  }
}

export function createApiClient(token: string) {
  return {
    auth: {
      telegram: (initData: string) =>
        request<{ token: string; refreshToken: string; sessionId: string; user: { id: number; telegramId: string; username: string | null; currency: string } }>(
          '/auth/telegram',
          { method: 'POST', body: JSON.stringify({ initData }) },
        ),
      refresh: (refreshToken: string) =>
        request<{ token: string; refreshToken: string }>(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken }) },
        ),
      logout: (refreshToken: string) =>
        request<void>(
          '/auth/logout',
          { method: 'POST', body: JSON.stringify({ refreshToken }) },
        ),
      getSessions: () =>
        request<Array<{ id: string; createdAt: string; expiresAt: string }>>('/auth/sessions', {}, token),
      revokeSession: (id: string) =>
        request<void>(`/auth/sessions/${id}`, { method: 'DELETE' }, token),
    },
    users: {
      updateCurrency: (currency: string) =>
        request<{ currency: string }>('/users/currency', { method: 'PATCH', body: JSON.stringify({ currency }) }, token),
      exportData: () =>
        request<Record<string, unknown>>('/users/me/export', {}, token),
      deleteAccount: () =>
        request<void>('/users/me', { method: 'DELETE' }, token),
    },
    accounts: {
      list: () => request<Array<{ id: number; name: string; balance: number; currency: string; sortOrder: number; type: string }>>('/accounts', {}, token),
      create: (data: { name: string; balance?: number; currency?: string; type?: string }) =>
        request('/accounts', { method: 'POST', body: JSON.stringify(data) }, token),
      update: (id: number, data: { name?: string; balance?: number; currency?: string; sortOrder?: number; type?: string }) =>
        request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
      delete: (id: number) =>
        request(`/accounts/${id}`, { method: 'DELETE' }, token),
    },
    transactions: {
      list: (params?: { limit?: number; offset?: number }) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString()
        return request<{ items: Array<{ id: string; accountId: number; categoryId: number; amount: number; currency: string; description: string | null; date: string }>; total: number; page: number; pageSize: number }>(
          `/transactions${qs ? `?${qs}` : ''}`, {}, token,
        )
      },
      getStats: (period?: string) => {
        const qs = period ? `?period=${period}` : ''
        return request<{
          period: string
          totalIncome: number
          totalExpense: number
          balance: number
          expenseByCategory: Array<{ categoryId: number; categoryName: string; categoryIcon: string; amount: number; percentage: number }>
          incomeByCategory: Array<{ categoryId: number; categoryName: string; categoryIcon: string; amount: number; percentage: number }>
        }>(`/transactions/stats${qs}`, {}, token)
      },
      create: (data: {
        accountId: number
        categoryId: number
        amount: number
        currency: string
        description?: string
        date?: string
      }) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }, token),
      transfer: (data: {
        fromAccountId: number
        toAccountId: number
        amount: number
        currency: string
        description?: string
      }) => request('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }, token),
      update: (id: string, data: { accountId?: number; categoryId?: number; amount?: number; description?: string; date?: string }) =>
        request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
      delete: (id: string) =>
        request(`/transactions/${id}`, { method: 'DELETE' }, token),
    },
    categories: {
      list: () => request<Array<{ id: number; name: string; icon: string; type: string; userId: number | null }>>('/categories', {}, token),
      create: (data: { name: string; icon: string; type: string }) =>
        request('/categories', { method: 'POST', body: JSON.stringify(data) }, token),
      update: (id: number, data: { name: string; icon: string; type: string }) =>
        request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
      delete: (id: number) =>
        request(`/categories/${id}`, { method: 'DELETE' }, token),
    },
    ai: {
      chat: (message: string) =>
        request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }, token),
      getHistory: () =>
        request<{ messages: Array<{ role: 'user' | 'assistant'; content: string }> }>('/ai/history', {}, token),
      clearHistory: () =>
        request<{ success: boolean }>('/ai/history', { method: 'DELETE' }, token),
      getInsights: () =>
        request<{ insights: Array<{ id: number; type: string; title: string; content: string; isRead: number; createdAt: string }> }>('/ai/insights', {}, token),
      markInsightRead: (id: number) =>
        request<{ success: boolean }>(`/ai/insights/${id}/read`, { method: 'PATCH' }, token),
    },
    billing: {
      getPlans: () =>
        request<Array<{ id: number; name: string; maxAccounts: number; maxTransactionsPerMonth: number; aiChatEnabled: number; price: number }>>('/billing/plans', {}, token),
      getSubscription: () =>
        request<{ plan: { id: number; name: string; maxAccounts: number; maxTransactionsPerMonth: number; aiChatEnabled: number; price: number } | null; status: string; currentPeriodEnd: string | null }>('/billing/subscription', {}, token),
      getStarsInvoice: () =>
        request<{ invoiceLink: string; stars: number }>('/billing/stars/invoice', { method: 'POST', body: '{}' }, token),
    },
    orgs: {
      getMyOrg: () =>
        request<{ orgId: number; role: string; orgName: string; inviteCode: string; ownerId: number; createdAt: string }>('/orgs/me', {}, token),
      create: (name: string) =>
        request<{ id: number; name: string; inviteCode: string }>('/orgs', { method: 'POST', body: JSON.stringify({ name }) }, token),
      join: (inviteCode: string) =>
        request<{ orgId: number; orgName: string }>('/orgs/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }, token),
      getMembers: (orgId: number) =>
        request<Array<{ id: number; userId: number; role: string; joinedAt: string }>>(`/orgs/${orgId}/members`, {}, token),
      removeMember: (orgId: number, memberId: number) =>
        request<void>(`/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' }, token),
      leave: () =>
        request<void>('/orgs/me', { method: 'DELETE' }, token),
      deleteOrg: (orgId: number) =>
        request<void>(`/orgs/${orgId}`, { method: 'DELETE' }, token),
    },
  }
}
