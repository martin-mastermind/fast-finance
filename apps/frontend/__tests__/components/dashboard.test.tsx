import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}))

vi.mock('@/components/balance-card', () => ({
  BalanceCard: () => React.createElement('div', { 'data-testid': 'balance-card' }),
}))

vi.mock('@/components/transaction-list', () => ({
  TransactionList: () => React.createElement('div', { 'data-testid': 'transaction-list' }),
}))

vi.mock('@/components/add-transaction', () => ({
  AddTransaction: () => React.createElement('div', { 'data-testid': 'add-transaction' }),
}))

vi.mock('@/components/bottom-nav', () => ({
  BottomNav: () => React.createElement('div', { 'data-testid': 'bottom-nav' }),
}))

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/store/finance', () => ({
  useFinanceStore: vi.fn(),
}))

import { Dashboard } from '../../components/dashboard'
import { useAuthStore } from '@/store/auth'
import { useFinanceStore } from '@/store/finance'

const mockUser = { id: 1, telegramId: '42', username: 'alice', currency: 'RUB' }

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser } as any)
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'dashboard' } as any)
  })

  it('renders dashboard tab', () => {
    render(<Dashboard />)
    expect(screen.getByText('Мои финансы')).toBeInTheDocument()
    expect(screen.getByText(/Привет, alice/)).toBeInTheDocument()
    expect(screen.getByTestId('balance-card')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
  })

  it('renders add tab', () => {
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'add' } as any)
    render(<Dashboard />)
    expect(screen.getByText('Новая операция')).toBeInTheDocument()
    expect(screen.getByTestId('add-transaction')).toBeInTheDocument()
  })

  it('renders history tab', () => {
    vi.mocked(useFinanceStore).mockReturnValue({ activeTab: 'history' } as any)
    render(<Dashboard />)
    expect(screen.getByText('История')).toBeInTheDocument()
  })

  it('shows username from store', () => {
    render(<Dashboard />)
    expect(screen.getByText(/alice/)).toBeInTheDocument()
  })
})
