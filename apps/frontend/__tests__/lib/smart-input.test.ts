import { describe, it, expect } from 'bun:test'
import { parseSmartInput } from '../../lib/smart-input'

describe('parseSmartInput — расходы', () => {
  it('"500 кофе" → expense -500, категория Еда', () => {
    const result = parseSmartInput('500 кофе')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-500)
    expect(result!.type).toBe('expense')
    expect(result!.description).toBe('кофе')
    expect(result!.suggestedCategory).toBe('Еда')
  })

  it('"кофе 200" (описание перед суммой) → expense -200', () => {
    const result = parseSmartInput('кофе 200')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-200)
    expect(result!.description).toBe('кофе')
  })

  it('"300 такси" → категория Транспорт', () => {
    const result = parseSmartInput('300 такси')
    expect(result!.suggestedCategory).toBe('Транспорт')
    expect(result!.amount).toBe(-300)
  })

  it('"1500 одежда" → категория Покупки', () => {
    const result = parseSmartInput('1500 одежда')
    expect(result!.suggestedCategory).toBe('Покупки')
  })

  it('"500 кино" → категория Развлечения', () => {
    const result = parseSmartInput('500 кино')
    expect(result!.suggestedCategory).toBe('Развлечения')
  })

  it('"200 аптека" → категория Здоровье', () => {
    const result = parseSmartInput('200 аптека')
    expect(result!.suggestedCategory).toBe('Здоровье')
  })

  it('дробная сумма "12.5 кофе" → -12.5', () => {
    const result = parseSmartInput('12.5 кофе')
    expect(result!.amount).toBe(-12.5)
  })

  it('сумма с запятой "1,5 кофе" → -1.5', () => {
    const result = parseSmartInput('1,5 кофе')
    expect(result!.amount).toBe(-1.5)
  })

  it('неизвестная категория → Прочее', () => {
    const result = parseSmartInput('999 ксилофон')
    expect(result!.suggestedCategory).toBe('Прочее')
    expect(result!.type).toBe('expense')
  })
})

describe('parseSmartInput — доходы', () => {
  it('"зарплата 50000" → income +50000', () => {
    const result = parseSmartInput('зарплата 50000')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(50000)
    expect(result!.type).toBe('income')
    expect(result!.suggestedCategory).toBe('Зарплата')
  })

  it('"50000 зарплата" → income +50000', () => {
    const result = parseSmartInput('50000 зарплата')
    expect(result!.amount).toBe(50000)
    expect(result!.type).toBe('income')
  })

  it('"фриланс 15000" → категория Фриланс', () => {
    const result = parseSmartInput('фриланс 15000')
    expect(result!.suggestedCategory).toBe('Фриланс')
    expect(result!.type).toBe('income')
  })

  it('"аванс 25000" → income', () => {
    const result = parseSmartInput('аванс 25000')
    expect(result!.type).toBe('income')
  })
})

describe('parseSmartInput — граничные случаи', () => {
  it('пустая строка → null', () => {
    expect(parseSmartInput('')).toBeNull()
  })

  it('только пробелы → null', () => {
    expect(parseSmartInput('   ')).toBeNull()
  })

  it('только текст без числа → null', () => {
    expect(parseSmartInput('кофе')).toBeNull()
  })

  it('только число → работает (без описания)', () => {
    const result = parseSmartInput('500')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(-500)
    expect(result!.description).toBe('')
  })
})
