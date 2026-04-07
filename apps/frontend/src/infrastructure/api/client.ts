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

export const apiClient = {
  auth: {
    telegram: (initData: string) =>
      request<{ user: { id: number; telegramId: string; username: string | null; currency: string } }>(
        '/auth/telegram',
        { method: 'POST', body: JSON.stringify({ initData }) },
      ),
  },

  users: {
    updateCurrency: (currency: string, userId: number) =>
      request<{ currency: string }>('/users/currency', { method: 'PATCH', body: JSON.stringify({ currency }) }, userId),
  },

  accounts: {
    list: (userId: number) =>
      request<Array<{ id: number; name: string; balance: number; currency: string }>>('/accounts', {}, userId),
    create: (data: { name: string; balance?: number; currency?: string }, userId: number) =>
      request('/accounts', { method: 'POST', body: JSON.stringify(data) }, userId),
    update: (id: number, data: { name?: string; balance?: number; currency?: string }, userId: number) =>
      request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, userId),
    delete: (id: number, userId: number) =>
      request(`/accounts/${id}`, { method: 'DELETE' }, userId),
  },

  transactions: {
    list: (userId: number, params?: { limit?: number; offset?: number }) => {
      const qs = params
        ? new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : ''
      return request<{ items: Array<{ id: string; accountId: number; categoryId: number; amount: number; currency: string; description: string | null; date: string }>; total: number; page: number; pageSize: number }>(
        `/transactions${qs ? `?${qs}` : ''}`, {}, userId,
      )
    },
    getStats: (userId: number, period?: string) => {
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
    }, userId: number) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }, userId),
    transfer: (data: {
      fromAccountId: number
      toAccountId: number
      amount: number
      currency: string
      description?: string
    }, userId: number) => request('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }, userId),
    delete: (id: string, userId: number) =>
      request(`/transactions/${id}`, { method: 'DELETE' }, userId),
  },

  categories: {
    list: (userId: number) =>
      request<Array<{ id: number; name: string; icon: string; type: string; userId: number | null }>>('/categories', {}, userId),
    create: (data: { name: string; icon: string; type: string }, userId: number) =>
      request('/categories', { method: 'POST', body: JSON.stringify(data) }, userId),
    update: (id: number, data: { name: string; icon: string; type: string }, userId: number) =>
      request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, userId),
    delete: (id: number, userId: number) =>
      request(`/categories/${id}`, { method: 'DELETE' }, userId),
  },

  ai: {
    chat: (message: string, userId: number) =>
      request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }, userId),
    getHistory: (userId: number) =>
      request<{ messages: Array<{ role: 'user' | 'assistant'; content: string }> }>('/ai/history', {}, userId),
    clearHistory: (userId: number) =>
      request<{ success: boolean }>('/ai/history', { method: 'DELETE' }, userId),
    getInsights: (userId: number) =>
      request<{ insights: Array<{ id: number; type: string; title: string; content: string; isRead: number; createdAt: string }> }>('/ai/insights', {}, userId),
    markInsightRead: (id: number, userId: number) =>
      request<{ success: boolean }>(`/ai/insights/${id}/read`, { method: 'PATCH' }, userId),
  },
}