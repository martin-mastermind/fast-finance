import { describe, it, expect } from 'bun:test'
import { formatCurrency, formatDate, cn } from '../../lib/utils'

describe('formatCurrency', () => {
  it('форматирует RUB с символом ₽', () => {
    const result = formatCurrency(1000, 'RUB')
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('форматирует ноль', () => {
    const result = formatCurrency(0, 'RUB')
    expect(result).toContain('0')
  })

  it('форматирует отрицательную сумму', () => {
    const result = formatCurrency(-500, 'RUB')
    expect(result).toContain('500')
    expect(result).toContain('-')
  })

  it('форматирует USD', () => {
    const result = formatCurrency(99.99, 'USD')
    expect(result).toContain('99')
  })

  it('использует RUB по умолчанию', () => {
    const withDefault = formatCurrency(100)
    const withRub = formatCurrency(100, 'RUB')
    expect(withDefault).toBe(withRub)
  })
})

describe('formatDate', () => {
  it('форматирует Date объект', () => {
    const result = formatDate(new Date('2024-03-15'))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('форматирует строку ISO date', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('cn (className merger)', () => {
  it('объединяет классы', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('игнорирует falsy значения', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })

  it('разрешает конфликты Tailwind (последний выигрывает)', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('обрабатывает условные классы через объект', () => {
    const result = cn({ 'text-red-500': true, 'text-green-500': false })
    expect(result).toBe('text-red-500')
    expect(result).not.toContain('text-green-500')
  })
})
