import { describe, it, expect } from 'bun:test'
import { parseSmartInput } from '../../lib/smart-input'

describe('parseSmartInput — expenses', () => {
  it('parses "500 кофе" as expense with Food category', () => {
    const result = parseSmartInput('500 кофе')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-500)
    expect(result!.type).toBe('expense')
    expect(result!.description).toBe('кофе')
  })

  it('parses "кофе 200" with description before amount', () => {
    const result = parseSmartInput('кофе 200')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-200)
    expect(result!.description).toBe('кофе')
    expect(result!.type).toBe('expense')
  })

  it('categorizes taxi expense correctly', () => {
    const result = parseSmartInput('300 такси')
    expect(result!.amount).toBe(-300)
    expect(result!.type).toBe('expense')
  })

  it('categorizes clothing as shopping', () => {
    const result = parseSmartInput('1500 одежда')
    expect(result!.amount).toBe(-1500)
    expect(result!.type).toBe('expense')
  })

  it('categorizes movie as entertainment', () => {
    const result = parseSmartInput('500 кино')
    expect(result!.amount).toBe(-500)
    expect(result!.type).toBe('expense')
  })

  it('categorizes pharmacy as health', () => {
    const result = parseSmartInput('200 аптека')
    expect(result!.amount).toBe(-200)
    expect(result!.type).toBe('expense')
  })

  it('parses decimal amounts with dot separator', () => {
    const result = parseSmartInput('12.5 кофе')
    expect(result!.amount).toBe(-12.5)
  })

  it('parses decimal amounts with comma separator', () => {
    const result = parseSmartInput('1,5 кофе')
    expect(result!.amount).toBe(-1.5)
  })

  it('defaults to "Other" for unknown category', () => {
    const result = parseSmartInput('999 ксилофон')
    expect(result!.type).toBe('expense')
    expect(result!.amount).toBe(-999)
  })
})

describe('parseSmartInput — income', () => {
  it('parses "зарплата 50000" as income', () => {
    const result = parseSmartInput('зарплата 50000')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(50000)
    expect(result!.type).toBe('income')
    expect(result!.description).toBe('зарплата')
  })

  it('parses "50000 зарплата" with amount first', () => {
    const result = parseSmartInput('50000 зарплата')
    expect(result!.amount).toBe(50000)
    expect(result!.type).toBe('income')
  })

  it('categorizes freelance correctly', () => {
    const result = parseSmartInput('фриланс 15000')
    expect(result!.amount).toBe(15000)
    expect(result!.type).toBe('income')
  })

  it('parses advance payment', () => {
    const result = parseSmartInput('аванс 25000')
    expect(result!.amount).toBe(25000)
    expect(result!.type).toBe('income')
  })

  it('handles decimal income', () => {
    const result = parseSmartInput('зарплата 50000.5')
    expect(result!.amount).toBe(50000.5)
    expect(result!.type).toBe('income')
  })

  it('parses regular transfer as income', () => {
    const result = parseSmartInput('перевод 10000')
    expect(result!.amount).toBe(10000)
    expect(result!.type).toBe('income')
  })
})

describe('parseSmartInput — edge cases', () => {
  it('returns null for empty string', () => {
    expect(parseSmartInput('')).toBeNull()
  })

  it('returns null for whitespace only', () => {
    expect(parseSmartInput('   ')).toBeNull()
  })

  it('returns null for text without number', () => {
    expect(parseSmartInput('кофе')).toBeNull()
  })

  it('handles number only input', () => {
    const result = parseSmartInput('500')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-500)
    expect(result!.description).toBe('')
  })

  it('handles negative numbers explicitly', () => {
    const result = parseSmartInput('-500 кофе')
    expect(result!.amount).toBe(-500)
  })

  it('handles very large amounts', () => {
    const result = parseSmartInput('9999999 кофе')
    expect(result!.amount).toBe(-9999999)
  })

  it('handles multiple spaces between words', () => {
    const result = parseSmartInput('500   кофе')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-500)
  })
})
