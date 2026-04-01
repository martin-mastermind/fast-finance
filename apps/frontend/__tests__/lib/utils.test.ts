import { describe, it, expect } from 'bun:test'
import { formatCurrency, formatDate, cn } from '../../lib/utils'

describe('formatCurrency', () => {
  it('formats positive amount in RUB', () => {
    const result = formatCurrency(1000, 'RUB')
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('formats negative amount in RUB', () => {
    const result = formatCurrency(-500, 'RUB')
    expect(result).toContain('500')
  })

  it('formats zero correctly', () => {
    const result = formatCurrency(0, 'RUB')
    expect(result).toContain('0')
  })

  it('formats decimal amounts', () => {
    const result = formatCurrency(99.99, 'RUB')
    expect(result).toContain('99')
  })

  it('formats USD currency', () => {
    const result = formatCurrency(100, 'USD')
    expect(typeof result).toBe('string')
  })

  it('defaults to RUB when no currency provided', () => {
    const withDefault = formatCurrency(1000)
    const withRub = formatCurrency(1000, 'RUB')
    expect(withDefault).toBe(withRub)
  })

  it('handles large amounts', () => {
    const result = formatCurrency(999999.99, 'RUB')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-03-15T10:30:00Z')
    const result = formatDate(date)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats ISO date string', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles today date', () => {
    const today = new Date()
    const result = formatDate(today)
    expect(typeof result).toBe('string')
  })

  it('handles past dates', () => {
    const pastDate = new Date('2020-01-01')
    const result = formatDate(pastDate)
    expect(typeof result).toBe('string')
  })
})

describe('cn (className merger)', () => {
  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })

  it('removes null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('handles empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('handles conditional classes with objects', () => {
    const result = cn({ 'text-red-500': true, 'text-green-500': false })
    expect(result).toBe('text-red-500')
    expect(result).not.toContain('text-green-500')
  })

  it('merges array and string inputs', () => {
    const result = cn(['p-4'], 'text-white')
    expect(result).toContain('p-4')
    expect(result).toContain('text-white')
  })
})
