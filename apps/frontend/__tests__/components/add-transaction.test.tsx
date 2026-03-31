import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('@/lib/api', () => ({
  createApiClient: vi.fn(() => ({
    accounts: { list: vi.fn() },
    categories: { list: vi.fn() },
    transactions: { create: vi.fn() },
  })),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  },
}))

import { AddTransaction } from '../../components/add-transaction'
import { useQuery, useMutation } from '@tanstack/react-query'

const mockAccounts = [{ id: 1, name: 'Карта', balance: 5000 }]
const mockCategories = [
  { id: 1, name: 'Еда', icon: '🍕', type: 'expense' },
  { id: 2, name: 'Зарплата', icon: '💰', type: 'income' },
]

describe('AddTransaction', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'accounts') return { data: mockAccounts } as any
      if (queryKey[0] === 'categories') return { data: mockCategories } as any
      return { data: undefined } as any
    })
    vi.mocked(useMutation).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  })

  it('renders smart input field', () => {
    render(<AddTransaction userId={1} />)
    expect(screen.getByPlaceholderText('500 кофе или зарплата 50000')).toBeInTheDocument()
  })

  it('parses expense on Enter key', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: '500 кофе' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('-500.00')).toBeInTheDocument()
  })

  it('parses income on Enter key', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: 'зарплата 50000' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('+50000.00')).toBeInTheDocument()
  })

  it('parses input on button click', () => {
    render(<AddTransaction userId={1} />)
    const input = screen.getByPlaceholderText('500 кофе или зарплата 50000')
    fireEvent.change(input, { target: { value: '300 такси' } })
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('-300.00')).toBeInTheDocument()
  })

  it('shows no-accounts hint when accounts list is empty', () => {
    vi.mocked(useQuery).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'accounts') return { data: [] } as any
      if (queryKey[0] === 'categories') return { data: mockCategories } as any
      return { data: undefined } as any
    })
    render(<AddTransaction userId={1} />)
    expect(screen.getByText('Сначала создайте счёт в настройках')).toBeInTheDocument()
  })
})
