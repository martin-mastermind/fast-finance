const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function request<T>(
  path: string,
  options: RequestInit = {},
  userId?: number,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (userId) {
    headers['x-user-id'] = String(userId)
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export function createApiClient(userId: number) {
  return {
    auth: {
      telegram: (initData: string) =>
        request<{ user: { id: number; telegramId: string; username: string | null; currency: string } }>(
          '/auth/telegram',
          { method: 'POST', body: JSON.stringify({ initData }) },
        ),
    },
    users: {
      updateCurrency: (currency: string) =>
        request<{ currency: string }>('/users/currency', { method: 'PATCH', body: JSON.stringify({ currency }) }, userId),
    },
    accounts: {
      list: () => request<Array<{ id: number; name: string; balance: number; currency: string }>>('/accounts', {}, userId),
      create: (data: { name: string; balance?: number; currency?: string }) =>
        request('/accounts', { method: 'POST', body: JSON.stringify(data) }, userId),
      update: (id: number, data: { name?: string; balance?: number; currency?: string }) =>
        request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, userId),
      delete: (id: number) =>
        request(`/accounts/${id}`, { method: 'DELETE' }, userId),
    },
    transactions: {
      list: (params?: { limit?: number; offset?: number }) => {
        const qs = new URLSearchParams(params as Record<string, string>).toString()
        return request<{ items: Array<{ id: string; accountId: number; categoryId: number; amount: number; currency: string; description: string | null; date: string }>; total: number; page: number; pageSize: number }>(
          `/transactions${qs ? `?${qs}` : ''}`, {}, userId,
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
        }>(`/transactions/stats${qs}`, {}, userId)
      },
      create: (data: {
        accountId: number
        categoryId: number
        amount: number
        currency: string
        description?: string
        date?: string
      }) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }, userId),
      delete: (id: string) =>
        request(`/transactions/${id}`, { method: 'DELETE' }, userId),
    },
    categories: {
      list: () => request<Array<{ id: number; name: string; icon: string; type: string; userId: number | null }>>('/categories', {}, userId),
      create: (data: { name: string; icon: string; type: string }) =>
        request('/categories', { method: 'POST', body: JSON.stringify(data) }, userId),
      update: (id: number, data: { name: string; icon: string; type: string }) =>
        request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, userId),
      delete: (id: number) =>
        request(`/categories/${id}`, { method: 'DELETE' }, userId),
    },
    ai: {
      chat: (message: string) =>
        request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }, userId),
      getHistory: () =>
        request<{ messages: Array<{ role: 'user' | 'assistant'; content: string }> }>('/ai/history', {}, userId),
      clearHistory: () =>
        request<{ success: boolean }>('/ai/history', { method: 'DELETE' }, userId),
      getInsights: () =>
        request<{ insights: Array<{ id: number; type: string; title: string; content: string; isRead: number; createdAt: string }> }>('/ai/insights', {}, userId),
      markInsightRead: (id: number) =>
        request<{ success: boolean }>(`/ai/insights/${id}/read`, { method: 'PATCH' }, userId),
    },
  }
}
